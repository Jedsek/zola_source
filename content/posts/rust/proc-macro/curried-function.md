+++
title = "rust中的柯里化函数与过程宏实现"
path = "posts/rust-curried-function"
date = 2022-03-03
template = "page.html"
+++
> 了解什么是柯里化(curry), 手动地实现, 最后使用过程宏作为大杀器, 自动生成柯里化函数吧
<!-- more -->

前置知识: Rust基础语法  
完整代码: [github/jedsek/curried](https://github.com/Jedsek/curried)  

`Note`:  
请注意, 此篇代码的目的, 不在于写出一个 "完美地支持比如异步等各种函数的任何场景下的柯里化操作"  
更多的是了解函数, 闭包, 柯里化, 过程宏与元编程的概念与使用, 也可视作 `过程宏(proc-macro)` 的教程文章, 请多包容啦QAQ

`Note`:  
我非常建议按照顺序阅读下去, 但如果你已经熟悉前面的内容, 可以直接跳转至 [柯里化](#ke-li-hua) 或者之后的 [过程宏](#guo-cheng-hong) 部分  

# 成品

当你看完本节, 跟着敲完代码(或者直接git clone上面链接给出的仓库), 你能够获得一种基于过程宏实现的语法糖  
(基于stable rust, 不过中间学习的时候会演示nightly rust下的一些feature)  

> 他们大喊着什么友情啊羁绊啊之后, 就一股脑地冲上来把函数给柯里化了口牙! ! ! :

```rust
use curried::{curry, to_curry};
use std::fmt::Display;

#[curry]
fn add(a: i32, b: i32, c: i32) -> i32 {
    a + b + c
}

#[curry]
fn concat_string<T>(a: T, b: T, c: T) -> String
where
    T: Display + 'static, // Note: You should additionally add 'static
{
    a.to_string() + &b.to_string() + &c.to_string()
}

fn map(a: i32, b: i32, c: i32) -> i32 {
    a + b - c
}

fn normal_curry() {
    let i = add(1)(2)(3);
    assert_eq!(i, 6);
}

fn generic_curry() {
    let f = concat_string(1)(23);
    let s = f(456);
    assert_eq!(s, "123456");
}

fn map_curry() {
    let f = to_curry!(|a, b, c| map(b, a, c));
    let i = [1, 2, 3].map(f(1)(-3));
    assert_eq!(i, [-3, -4, -5]);
}
```

简单来说, `柯里化(curry)` 让我们将一个 "接收n个参数的n元函数", 转化为一个 "接收1个参数并返回一个(n-1)元函数的函数"  
于是 add(1, 2, 3) 可以被写作 add(1)(2)(3), 之后会再讲解柯里化相关的一些作用  

正片开始~~~~

- - -

# 函数

为了方便之后实现柯里化时的讲解, 所以先提前将一些概念放在了前面, 首先让我们来看看函数  
什么是函数? 传入参数, 进行操作, 然后返回结果, 仅此而已 (结果可以为空)  

在 rust 中, 下面这种函数是最常见的, 也叫作 [function item](https://doc.rust-lang.org/reference/types/function-item.html)  

<figcaption> 输出结果是个类似这样的指针的地址: 0x600cc581a4f0 </figcaption>

```rust
fn foo(x: i32) -> i32 {
    x + 1
}

fn main() {
    let a: fn(i32) -> i32 = foo;
    println!("{:?}", a);
}
```

对于有泛型的函数, 其本身也有一个类型, 因为rust的泛型是 `异构翻译(heterogeneous-translation)`, 即会进行单态化生成具体类型  
所以, 对于泛型函数, 我们必须手动指定其类型, 帮助编译器进行推导 (编译器 is not 卡密!):

```rust
fn bar<T>(x: T) -> T {
    x
}

fn foo(x: i32) -> i32 {
    x + 1
}

fn main() {
    let mut b: fn(i32) -> i32 = bar::<i32>;
    b = foo;
}
```

你会注意到, 手动标注了类型的变量, 可将其他类型相同的函数赋值给自己

但若是自动推导, 在IDE/编辑器上悬浮的类型会多一个 `标识符(ident)`, 也就是函数本身的名字(无法手动标注)  
让我们去掉认人为添加的类型, 让编辑器自己推导类型, 并且尝试将新函数赋值给变量:  

```rust
fn foo(x: i32) -> i32 {
    x + 1
}

fn bar(x: i32) -> i32 {
    x + 1
}

fn main() {
    // typeof(a): fn foo(i32) -> i32
    let mut a = foo;
    a = bar;  // Failed to compile: type mismatched
}
```

因为编译器其实为每个函数都生成了一个独一无二的标识符(`unique identifier`), 并将其作为类型信息的一部分  
如果我们不是自己手动标注类型, 而是任由编译器将这默认的标识符添加上去, 就会导致 `type mismatched` 的编译期错误  

rust 中的函数还是所谓的 `ZST(zero sized type)`, 即零大小类型, 因为其类型都是在编译期间就已经确定, 全是静态的  

在 rust-reference 中的 [function item](https://doc.rust-lang.org/reference/types/function-item.html) 的末尾, 明确提过编译器对于这些fn类型都自动实现了哪些 trait:  
Fn, FnMut, FnOnce, Copy, Clone, Send, Sync (前三个 trait 对应闭包, 我们马上就要讲到)  

**但是, 但是啊, 但是! 这些类型有一个致命的缺陷, 那就是没有办法使用 outer 环境下的变量**  

举个例子, 如果我们想这样做是不可以的, 因为引用的不是const也不是static, 而是用let修饰的局部变量:  

```rust
fn main() {
    let a = 1;
    fn print_a() {
        println!("{}", a);
    }
}
```

这时候就要论到我们的闭包类型登场了! 锵锵锵锵!(BGM起~~~~)

- - -

# 闭包

最早实现 `闭包(closure)` 的语言是 `scheme` 这门lisp的两种主要方言之一, 其定义非常简单: `能够捕获与使用自由变量的函数`  

什么是 `自由变量`? 其实你在上一节的末尾已经见识过了, 让我们再把那部分的代码贴出来:

```rust
fn main() {
    let a = 1;
    fn print_a() {
        println!("{}", a);
    }
}
```

让我们忽略先前的编译错误, 假设这部分代码可以成功编译, 随后基于这个假设开始阐述:  

在外层函数 main 中, 我们定义了a, 它是在 main 函数中产生的, 它的一切都被 main 函数所知晓, 所以对该外层函数来讲, a 是 `不自由/被约束` 的  
但对于内层的函数 print_a 来讲, 变量a 即没有出现在参数的位置, 也不是在其函数体内产生的, 所以对于内层函数来讲, a 是 `自由` 的  

倘若 `闭包是能够捕获与使用自由变量的函数`, 那么这里的 print_a 毫无疑问就是一个闭包  
当然, 在很多编程语言中, 闭包一般也拥有许许多多的别名, 比如匿名函数/lambda表达式等, (虽然完全视作相同概念并不严谨, 但暂时忽略这些区别)  

在 rust 中, 我们可以这样创建与使用闭包, 其大多数情况下可以自动推导传入参数的类型:  

```rust
let f = || 1;
f()  // 1

let g = |x| x + 1;
g(1)  // 2

let a = 10;
let h = |x| a + x
h(10) // 20
```

闭包相当有用, 运用场景很多, `而且具有不可替代的作用`, 这点等一会就要讲到  
倘若没有闭包, 我们就得手动创建一个具体名字的函数, 声明其参数的类型, 但这么简单的工作直接生成一个匿名函数, 自动类型推导会更轻松:  

```rust
fn main() {
    let (a, b, c) = ("a", "b", "c");
    let f = |x| (String::from("Hello, ") + x + "~~~~~~~~");

    f(a);
    f(b);
    f(c);
}
```

我们也可以给诸如 map 这种函数传入一个闭包:

```rust
// [10, 20, 30]
[1, 2, 3].map(|x| x * 10);
```

我们这里仅仅把闭包当作一个普通的匿名函数, 并没有用到它捕获自由变量(或者说作用域环境内的局部变量)的能力  
之前说过 `function item` 不能也不会捕获作用域内变量, 而闭包则在捕获时会分配内存存储值  

以下三种 trait 先前已经提到过了, 所有 function item 已经自动都实现了, 但是闭包则并不会全部实现:  

- FnOnce: 至少运行一次的闭包
- FnMut: 以 &mut(可变借用) 形式使用被捕获的变量
- Fn: 以 &(不可变借用) 的形式使用被捕获的变量

当你创建并使用闭包时, 这些 trait 会自动为 闭包/匿名函数/lambda表达式 实现, 你以什么样的形式使用了被捕获的变量, 就会实现对应的 trait  
每个闭包都自动实现了 FnOnce, 表示至少能够运行一次, 每个闭包除此之外还会自动实现 Fn 或者 FnMut (取决于你以什么形式使用被捕获的变量)  

倘若这个闭包即不是以&mut的形式使用被捕获的变量(没有实现FnMut), 也不是以&的形式(没有实现Fn), 因此它就只实现了 FnOnce  
这就自然代表了, 只实现了 FnOnce 的闭包, 会以 "取得所有权的形式" 使用被捕获的变量  

`Note`:  
请注意上面强调的是 `如何使用`, 假设你使用了 `move` 关键字, 强制拿走了被捕获变量的所有权  
但是, 如果闭包内仍然只是以不可变借用的形式使用, 那么该闭包也仍然只是实现了 Fn  

这三个 trait 有所谓的父子关系: `Fn: FnMut: FnOnce`, 代表实现 Fn 的前提是实现了 FnMut 与 FnOnce, 实现 FnMut 的前提是实现了 FnOnce  
因为Fn与FnMut都是FnOnce的subtrait, 表示都基于FnOnce的基础上多了一些东西与功能, 所以只要求传入FnOnce的地方自然可以被Fn/FnMut所代替  

值得注意的是, 闭包的类型, 有点类似先前所述的 `function item` 里的 `unique identifier`, 因为每个闭包, 其实背后都生成了一个匿名结构体  
这导致每个闭包的实际类型, 即使看起来一样, 其实不一样, 况且它还是个 trait  

我们得用泛型, 或者 impl 关键字来表示闭包的实际类型:  

```rust
fn generate_close() -> impl Fn(i32) -> i32 {
    |x| x + 1
}
```

哟西, 大致的基础概念都会了  
~~既然你已经懂得了1+1=2了, 让我们开始证明哥德巴赫猜想吧!~~  
~~既然你已经懂得函数与闭包的概念了, 让我们开始用过程宏进行元编程, 写一个可以将函数柯里化的属性宏吧!~~  
既然你已经懂得函数与闭包的概念了, 让我们开始手动模拟一下柯里化吧!  


- - - 

# 柯里化

柯里化: 仅接收一个参数并返回一个新函数, 这个函数也仅接收一个参数并返回新函数......直到最后一个函数, 接收一个参数并返回最后的值

请考虑利用先前提到的知识, 尝试对下面这个简单的函数进行柯里化:

```rust
fn add(a: i32, b: i32, c: i32) -> i32 {
    a + b + c
}

fn add_curry(a: i32) -> ??? {
    ???
}

fn main() {
    add(1, 2, 3)        // 6
    add_curry(1)(2)(3)  // 6
}
```

思路很容易想到, 毕竟该怎么做不都已经告诉你了吗 (bushi  

```rust
#![feature(impl_trait_in_fn_trait_return)]

fn add(a: i32, b: i32, c: i32) -> i32 {
    a + b + c
}

fn add_curry(a: i32) -> impl Fn(i32) -> impl Fn(i32) -> i32 {
    move |b| move |c| a + b + c
}

fn main() {
    add(1, 2, 3)        // 6
    add_curry(1)(2)(3)  // 6
}
```

恭喜, 接下来让我们开始过程宏的概念吧, 了解什么元编程, 了解rust过程宏的强大之处, 随后将任意类似这样的函数自动柯里化吧  

啊咧? 这一节结束的也太快了吧? 话说原来这么简单的几行代码就Ok了啊......  
~~当然不可能啊小傻瓜!!~~, 其实还有一些坑, 不过让我们放到后面再讲, 先用宏实现一个初版的语法糖再继续  

- - -

# 过程宏
