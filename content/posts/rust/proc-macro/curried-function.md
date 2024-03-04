+++
title =  "rust-tui"
path = "/posts/rust-curried-function"
date = "2024-03-03"
template = "page.html"
+++

> 了解什么是柯里化(curry), 手动地实现, 最后使用过程宏作为大杀器, 自动生成柯里化函数吧  

<!-- more -->

前置知识: Rust基础语法  
完整项目: [github/jedsek/curried](https://github.com/jedsek/curried)  

`Note`:  
请注意, 此篇代码的目的并不在于写出一个 "完美地支持比如异步等各种函数的任何场景下的柯里化操作"  
更多的是了解函数, 闭包, 柯里化, 过程宏, 元编程, 属于面向新手, 相对友好的 `过程宏 && 柯里化` 教程, 请多包容啦QAQ  

# 成品

完整代码放在下面了, 仅放在博客, 因为知乎等没有代码折叠功能, 直接去仓库看吧  

> 他们大喊着什么友情啊羁绊啊之后, 就一股脑地冲上来把函数给柯里化了口牙! ! ! 

<figcaption class="fold-close"> Cargo.toml </figcaption>

```toml
[dependencies]
proc-macro2 = "1.0.78"
quote = "1.0.35"
syn = { version = "2.0.51", features = ["full"] }

[lib]
proc-macro = true
```

<figcaption class="fold-close"> src/lib.rs </figcaption>

```rust
use proc_macro::TokenStream;
use proc_macro2::TokenTree;
use quote::quote;
use std::str::FromStr;
use syn::{parse_macro_input, Block, FnArg, ItemFn, Pat, ReturnType, Type};

#[proc_macro]
pub fn to_curry(input: TokenStream) -> TokenStream {
    let input = proc_macro2::TokenStream::from(input);

    let mut in_body = true;
    let mut f = None;
    let mut body = None;
    let mut args = vec![];

    for tt in input.into_iter() {
        match tt {
            TokenTree::Group(b) => body = Some(b),
            TokenTree::Punct(p) if p.as_char() == '|' => in_body = !in_body,
            TokenTree::Ident(ident) => {
                if in_body {
                    f = Some(ident)
                } else {
                    args.push(ident)
                }
            }
            _ => (),
        }
    }

    let f = f.unwrap();
    let body = body.unwrap();

    let gen = quote!(
        #( move |#args| )* #f #body
    );

    gen.into()
}

#[proc_macro_attribute]
pub fn curry(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let parsed = parse_macro_input!(item as ItemFn);

    let (body, sig, vis) = (parsed.block, parsed.sig, parsed.vis);

    let fn_return_type = sig.output;
    let (fn_ident, fn_args) = (sig.ident, sig.inputs);
    let (impl_generics, _ty_generics, where_clause) = sig.generics.split_for_impl();

    let mut arg_idents = vec![];
    let mut arg_types = vec![];
    for arg in fn_args.into_iter() {
        let (ident, ty) = match arg {
            FnArg::Typed(p) => (p.pat, p.ty),
            FnArg::Receiver(_) => panic!("self parameter is unsupported now"),
        };
        arg_idents.push(ident);
        arg_types.push(ty);
    }

    let return_type = generate_return_type(&arg_types, fn_return_type);
    let body = generate_body(&arg_idents, &arg_types, body);
    let first_arg_ident = arg_idents.first().unwrap();
    let first_arg_type = arg_types.first().unwrap();

    let new_fn = quote!(
        #vis fn #fn_ident #impl_generics (#first_arg_ident: #first_arg_type) #return_type #where_clause {
            #body
        }
    );

    println!("{}", new_fn);

    new_fn.into()
}

fn generate_return_type(
    types: &[Box<Type>],
    fn_return_type: ReturnType,
) -> proc_macro2::TokenStream {
    let last = types.len();
    let range = 1..last;
    let len = range.len();

    let types = &types[range.clone()];

    let fn_return_type = quote!(#fn_return_type).to_string();
    let mut token_stream = String::new();
    for ty in types.iter() {
        let ty = quote!(#ty);
        token_stream += &format!("-> Box<dyn FnOnce({ty})");
    }
    token_stream += &fn_return_type;
    token_stream += &">".repeat(len);

    proc_macro2::TokenStream::from_str(&token_stream).unwrap()
}

fn generate_body(
    idents: &[Box<Pat>],
    types: &[Box<Type>],
    body: Box<Block>,
) -> proc_macro2::TokenStream {
    let last = types.len();
    let range = 1..last;
    let len = range.len();

    let idents = &idents[range.clone()];
    let types = &types[range];

    let body = quote!(#body);
    let mut token_stream = String::new();
    for (id, ty) in idents.iter().zip(types.iter()) {
        let (ident, ty) = (quote!(#id), quote!(#ty));
        token_stream += &format!("Box::new( move |{ident}: {ty}| ");
    }
    token_stream += &format!("{body}");
    token_stream += &")".repeat(len);

    proc_macro2::TokenStream::from_str(&token_stream).unwrap()
}
```

<figcaption class="fold-close"> tests/test.rs </figcaption>

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

当你看完本节, 跟着敲完代码(或者直接复制粘贴/克隆仓库), 你能够获得一种基于过程宏实现的语法糖  
(成品基于 stable-rust, 不过中间学习的时候会演示 nightly-rust 下的一些 feature)  

简单来说, `柯里化(curry)` 让我们将一个 "接收n个参数的n元函数", 转化为一个 "接收1个参数并返回一个(n-1)元函数的函数"  
于是 `add(1, 2, 3)` 可以被写作 `add(1)(2)(3)`, 之后会再讲解柯里化相关的一些作用  

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

你会注意到我们手动标注了变量的类型, 并且其可以被赋值一个类型相同的函数  

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

因为编译器其实为每个函数都生成了一个独一无二的标识符`(unique identifier)`, 并将其作为类型信息的一部分  
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

最早实现 `闭包(closure)` 的语言是 `scheme`(lisp的两种主要方言之一), 其定义非常简单: `能够捕获与使用自由变量的函数`  

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

倘若闭包是 `能够捕获与使用自由变量的函数`, 那么这里的 `print_a` 毫无疑问就是一个闭包  
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

- `FnOnce`: 至少运行一次的闭包  
- `FnMut`: 以 `&mut(可变借用)` 的形式使用被捕获的变量  
- `Fn`: 以 `&(不可变借用)` 的形式使用被捕获的变量  

当你创建并使用闭包时, 这些 trait 会自动为 闭包/匿名函数/lambda表达式 实现, 你以什么样的形式使用了被捕获的变量, 就会实现对应的 trait  
每个闭包都自动实现了 FnOnce, 表示至少能够运行一次, 每个闭包除此之外还会自动实现 Fn 或者 FnMut (取决于你以什么形式使用被捕获的变量)  

倘若这个闭包即不是以&mut的形式使用被捕获的变量(没有实现 FnMut), 也不是以&的形式(没有实现Fn), 因此它就只实现了 FnOnce  
这就自然代表了, 只实现了 FnOnce 的闭包, 会以 "取得所有权的形式" 使用被捕获的变量  

`Note`:  
请注意上面强调的是 如何使用, 假设你使用了 `move` 关键字, 强制拿走了被捕获变量的所有权  
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

`柯里化(curry)`: 仅接收一个参数并返回一个新函数, 这个函数也仅接收一个参数并返回新函数......直到最后一个函数, 接收一个参数并返回最后的值  
柯里化的概念其实相当简洁好懂, 难的是在默认不支持柯里化的语言中实现柯里化(没错, 就是你, rust!)  

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

恭喜, 接下来让我们开始过程宏的概念吧, 了解什么是元编程, 了解rust过程宏的强大之处, 随后将任意类似这样的函数自动柯里化吧  

啊咧? 这一节结束的也太快了吧? 话说原来这么简单的几行代码就Ok了啊......  
当然不可能啊小傻瓜!!, 其实还有一些坑, 不过我们将其放到后面再讲, 用宏先来实现一个初版的语法糖再说  

- - -

# 元编程

倘若是真的一点都没接触过相关概念, 理解下面的内容时可能会比较吃力, 明白的人直接跳过这节即可  
我强烈建议学习 rust 中的宏/元编程时, 先学习 `声明宏(declare-macro)`, 其在我的博客中也有相应教程: [传送门](/categories/rust-decl-macro)  

`宏(macro)` 是 rust 中一种重要的 `元编程(meta-programming)` 手段  
在正常编程时, 我们将 i32/f64/String 等类型视作数据, 操控与计算它们生成新的数据, 而元编程则将代码视作数据进行操控, 并生成新的代码  

举个例子, 我们拿比较常见的 `vec!` 宏来说明 (仅仅为了说明宏的概念, 所以会有出入并化简)  
下面是宏根据我们传入的 `1, 2, 3` 所生成的实际代码:  

```rust
// 1
let a = vec![1, 2, 3]

// 2
let a = {
    let mut v = Vec::new();
    v.push(1);
    v.push(2);
    v.push(3);
    v
}
```

源代码其实只是一串文本(String), 并没有什么特殊含义, 得交给编译器解析这串文本才能得到可执行程序(`编译`)  
就像正常编程时将数据划分为 i32/f64/String/Vec 等类型一样, 元编程中也对代码进行了分类, 为文本赋予了人为的含义:  
表达式(expr), 标识符(ident), 变量类型(type), 字面量(literal), 模式(pattern) 等......  

我们将这些被人为赋予了意义的文本叫作 `Token(编程语言中的最小语法单元)`  
在 rust 官方内嵌提供的 `proc-macro` 库中, 我们将其归类为 `TokenTree`  

> A single token or a delimited sequence of token trees (e.g., [1, (), ..]).

```rust
pub enum TokenTree {
    Group(Group),     // 被括号包裹起来(包括括号本身)的内容
    Ident(Ident),     // 标识符, 比如变量名, 函数名
    Punct(Punct),     // 标点符号, 比如逗号, 加号等
    Literal(Literal), // 字面量, 比如 'a', "s", 2, true 等
}
```

而通过提供的 `proc-macro` 这个编译器内置的库, 我们可以使用过程宏操控 `TokenStream`  
其概念相当于 `Vec<TokenTree>`, 但 Clone 的代价并不昂贵  

在比如, 我们其实经常使用过程宏:  

```rust
// 1
#[derive(Debug)]
struct A(i32);


// 2
struct A(i32);
impl std::fmt::Debug for A {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        todo!()
    }
}
```

宏为我们生成并隐藏了这些代码, 暴露给用户的接口宛若魔法一般, 这即是元编程魅力的冰山一角  

- - -

# 过程宏

本节我们将开始实现一个最小化的柯里化宏  
为了照顾第一次学习过程宏的同学, 我会贴一下过程宏的三种分类与实际开发时的常用库  

过程宏(procedural-macro), 即 proc-macro, 在rust中有以下三种类型:  

- `函数式(function like)`: 类似于调用函数, 与声明宏使用起来的语法一致, 类似 `vec![]`  
- `派生宏(derive macro)`: 你使用的哪些 `#[derive(...)]` 都属于这类范畴  
- `属性宏(attribute macro)`: 我们接下来要创建的柯里化宏就是这一类, `#[CustomMacro(Attribute)]`, 括号与其中的Attr可以为空  

没错, 第三类宏的生成代码你其实见到过了:  

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

如果改成第三类的属性宏, 则用户可以写成这样, 不需要关心实现的细节:  

```rust
#![feature(impl_trait_in_fn_trait_return)]

use curried::curry;

#[curry]
fn add(a: i32, b: i32, c: i32) -> i32 {
    a + b + c
}

fn main() {
    let a = add(1);  // impl Fn(i32) -> impl Fn(i32) -> i32
    let b = add(2);  // impl Fn(i32) -> i32
    let c = add(3);  // i32: 6
}
```

我们将 `fn add(...) -> i32 { ... }` 作为参数喂给了 `#[curry]` 这个宏, 宏吃下传入的 `TokenStrean`, 进行一番操作后生成了新的 `TokenStream`  
这个新的 `TokenStream` 才会被编译器所编译, 这里生成的结果是一个函数, 其名字来源于传入的参数, 也叫 `add`, 但函数签名与函数体都被修改过了  

让我们开始写第一个过程宏吧, 首先新建一个 crate, 让我们将其命名为 `curried`, 并且添加依赖:  

```txt
cargo new --lib curried
cd curried
cargo add proc-macro2
cargo add quote
cargo add syn -F "full"
```

随后记得修改 `Cargo.toml`, 使其是个 proc-macro 类型的 lib:  

<figcaption> Cargo.toml </figcaption>

```toml
[dependencies]
proc-macro2 = "1.0.78"
quote = "1.0.35"
syn = { version = "2.0.51", features = ["full"] }

[lib]
proc-macro = true
```

末尾的 `proc-macro = true`, 是因为目前 rust 只允许被这样声明的 lib 编写过程宏, 并且只允许向外导出过程宏  
被声明为 `proc-macro` 的 lib 在默认情况下能直接 use 的, 除了 `std` 还将多一个 `proc-macro` (官方提供的用来解析与生成 `TokenStream`)  

接下来要理清楚新加进来的三个 crate 之间的关系, 这三个全都不是官方的, 但却是开发过程宏的事实标准:  

- `proc-macro2`:  
和官方提供内嵌的 `proc-macro` 名字很像, 不过其实是第三方写的, 但确实是下一代, 无脑用就行了  
其提供了可以在 build.rs/main.rs, 还有单元测试中解析/生成 TokenStream 的能力, 是对官方库的一层包装  

- `syn`:  
基于 `proc-macro2`, 提供了将 TokenStream 解析为更加高抽象的结构 (人为地赋予更明显的意义)  
比如 `泛型(T), where子句(where T:), 函数项(fn), 可见性(pub, pub(crate))` 等, 更加方便地进行解析  

- `quote`:  
基于 `proc-macro2`, 提供了根据由 syn/proc-macro2 得到的解析结构, 便捷地生成新的 TokenStream 的方法  
它会给你一个 `quote!` 宏, 方便地进行插值, 生成新的 TokenStream  

而官方内嵌提供的 `proc-macro`, 你可以理解为某种 abi 标准, 编译器只能通过 `proc_macro::TokenStream` 生成代码  
站在 `proc-macro2/syn/quote` 提供的高抽象框架上, 生成的则是 `proc_macro2::TokenStream`, 而非 `proc_macro::TokenStream`  
但没关系, 别人早就全帮你准备好了, 在两者进行转换时, 只需要调用一下 `.into()` 就 OK 了  

让我们来实际感受一下上面所说的内容:  

<figcaption> src/lib.rs </figcaption>

```rust
use proc_macro::TokenStream;
use proc_macro2::TokenTree;
use quote::quote;

#[proc_macro_attribute]
pub fn curry(_attr: TokenStream, input: TokenStream) -> TokenStream {
    let parsed = syn::parse_macro_input!(input as syn::ItemFn);

    let (body, sig, vis) = (parsed.block, parsed.sig, parsed.vis);
    let (fn_ident, fn_args, fn_return_type) = sig.ident, fn_args = sig.inputs, sig.output);

    let new_fn = quote!(
        #vis fn #fn_ident (#fn_args) #fn_return_type {
            #body
        }
    );

    println!("{}", new_fn);

    new_fn.into()
}
```

根据代码继续加深印象:  

- `proc-macro2`:   
相当于 `proc-macro` 的包装, 基于三剑客最后生成的是 `proc_macro2::TokenStream`, 但传给编译器的得是 `proc_macro::TokenStream` 所以要调用 `.into`  

- `syn`:  
提供了许多高抽象的结构帮助解析, 比如这里我们将原始的 TokenStream 类型的 `input` 给转换为了 `ItemFn`  
随后将从已经被解析包装为 `ItemFn` 类型的变量中, 提取了函数体, 函数签名, 函数可见性修饰符(不是pub就是空)  
随后从函数签名上得到了函数的名称, 函数的参数, 函数的返回类型  
(不然你就得自己进行解析抽象了哦~~)  

- `quote`:  
在 `quote!` 宏里面, 我们以 `#变量名称` 的形式进行插值, 类似于 `format!("{a}")` 中的 `{a}`, 不过生成的是 `proc_macro2::TokenStream`  
我们这里仅仅是原封不动的解析拆解了输入, 然后原封不动地组装回去作为了输出  

让我们测试一下可不可以通过编译, 在项目根目录创建测试文件夹 `tests/`:  

<figcaption> tests/test.rs </figcaption>

```rust
use curried::curry;

#[curry]
fn add(a: i32, b: i32, c: i32) -> i32 {
    a + b + c
}

#[test]
fn test() {
    let x = add(1, 2, 3);
    assert_eq!(x, 6);
}
```

若运行 `cargo test`, 则编译会顺利通过  

你也可以稍加修改, 比如给生成函数的名字增加一个 `new_` 的前缀:  

<figcaption> src/lib.rs </figcaption>

```rust
use proc_macro::TokenStream;
use quote::{format_ident, quote};

#[proc_macro_attribute]
pub fn curry(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let parsed = syn::parse_macro_input!(item as syn::ItemFn);

    let (body, sig, vis) = (parsed.block, parsed.sig, parsed.vis);
    let (fn_ident, fn_args, fn_return_type) = (sig.ident, sig.inputs, sig.output);

    let new_fn_ident = format_ident!("new_{fn_ident}"); // here
    let new_fn = quote!(
                // here
        #vis fn #new_fn_ident (#fn_args) #fn_return_type {
            #body
        }
    );

    println!("{}", new_fn);

    new_fn.into()
}
```

现在, `test.rs` 中应该会出现编译错误, 因为现在生成的新函数的名字已经变成了 `new_add`  

让我们介绍在 `quote!` 宏中如何进行重复插值, 柯里化宏的实现需要依赖这个功能  






