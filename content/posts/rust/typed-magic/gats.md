+++
title = "rust-typed-magic: 泛型关联类型(GATs)"
path = "/posts/rust-typed-magic/gats"
date = "2024-04-24"
template = "page.html"
+++

> rust 中的 gat(泛型关联类型), HKT(高阶类型), type-constructor(类型构造器) 等概念  

<!-- more -->

# 关联类型

`关联类型(associated-type)` 非常的常见 ~~(我感觉没啥好多说的, 但还是说一嘴吧)~~    

## 定义

让我们以标准库中的 [Add](https://doc.rust-lang.org/std/ops/trait.Add.html) 为例:

```rust
trait Add<Rhs = Self> {
    type Output;

    fn add(self, rhs: Rhs) -> Self::Output;
}
```

该定义中的 `Output` 便是所谓的 `关联类型(associated-type)`, 而 `Rhs` 则是普通的泛型, 默认值是 `Self`  

```rust
impl Add for i32 {
    type Output = i32;

    fn add(self, other: i32) -> $t { self + other }
}
```

我们在实现中指定 `Output` 的类型, 而 `Rhs` 也已经推导为 `i32`  

关联类型的出现是必要的, 在这里, 我们需要先澄清一下 trait 的 输入类型(input) 与 输出类型(output)  

## 输入与输出

- input: `Add` 中的泛型参数 `Rhs`
- output: `Add` 中的关联类型 `Output`  

```rust
impl Add<i32> for i32 { ... }
impl Add<Complex> for i32 { ... }
```

考虑这两种 impl, `Add<i32>` 与 `Add<Complex>` 被视作两个不一样的 trait  
作为类型参数的 `i32` 与 `Complex` 都是该 trait 的输入, 通过输入, 才最终确定并形成了这两个不同的 trait  

但对于关联类型, 它是某个已经确定了的 trait 的输出, 因此它只可能在 impl 的时候由实现者确定, 不参与 trait 的类型推断  

倘若没有关联类型, 我们只能全部写进泛型中当作参数:  

```rust
impl Add<i32, i32> for i32 { ... }
impl Add<Complex, Complex> for i32 { ... }
```

以第一个 impl 为例子, 第一个 i32 代表 `Rhs`, 第二个 i32 代表 `Output`, 但现在你还分得清 input 与 output 吗?  
不仅如此, 原本不该参与 `通过泛型列表确认是哪个trait` 这一推导过程, 而应由实现者在 impl 内部指定的 `Output`, 此刻却暴露了出来  

## 工程学优点

你可能还是有点懵, 那就再以 [rfc-0195](https://rust-lang.github.io/rfcs/0195-associated-items.html#associated-types-engineering-benefits-for-generics) 中的代码为例子 (有些地方和真代码不一样, 看得懂即可):  

```rust
trait Graph<N, E> {
    fn has_edge(&self, &N, &N) -> bool;
    ...
}

fn distance<N, E, G: Graph<N, E>>(graph: &G, start: &N, end: &N) -> uint { ... }
```

我们有一个 `Graph` trait, 来表示图论算法中的图, 涉及 3 种类型: 节点(Node), 边(Edge), 图(Graph)本身  
如果我们定义了这样的 trait 并为某个具体的类型实现, 按理来说 节点(N) 与 边(E) 也是与该具体类型相关联的具体类型  
但暴露给用户的却是必须强制写出来后才能使用的泛型参数, 这一点相当令人困惑  

但倘若用关联类型改写:  

```rust
trait Graph {
    type N;
    type E;
    fn has_edge(&self, &N, &N) -> bool;
}

fn distance<G: Graph>(graph: &G, start: &G::N, end: &G::N) -> uint { ... }
```

下游的用户在使用时不再需要被强迫写成泛型, 需要引用 Node 与 Edge 代表的具体类型时, 直接通过 `G::N/G::E` 来使用即可  

这在工程学上有着相当大的优势, 而且是单纯的泛型绝对替代不了的 (我直接翻译 [rfc-0195](https://rust-lang.github.io/rfcs/0195-associated-items.html#associated-types-engineering-benefits-for-generics) 中的原文了):  

- `可读性/可扩展性`:  
  关联类型可以一次抽象出整个类型系列，而不必单独命名每个类型, 这提高了泛型代码的可读性 (如上面的 distance 函数)  
  它还使泛型更具 “可扩展性”: trait 可以包含其他关联类型, 而不会给 "不关心这些类型的客户端" 带来额外的负担  
  相比之下, 在今天的 rust 中，为一个 trait 添加额外的泛型参数, 通常感觉是个非常 “重量级” 的举动  

- `易于重构/演进`:  
  由于 trait 的用户不必单独对其关联类型进行泛型参数化, 因此可在不破坏现有客户端代码的情况下, 添加新的关联类型  
  (泛型的话, 你每次添加新的代码, 用户也得给每个函数都加上新的泛型参数啦!! 想想刚刚的 `distance`, 这会破坏所有涉及该 trait 的代码)  

- - - 

# 泛型关联类型

关联类型允许泛型, 就是所谓的泛型关联类型啦! ~~(废话!)~~  
~~(但是这玩意儿让 rust 团队写了七年, 期间重构数次编译器与类型分析系统)~~  

现在要介绍的, 是 rust 自 1.65 版本后引入的重大特性, 泛型关联类型(GAT/GATs, Generic-Associated-Types)  
这是个相当重量级的特性, rust 团队为了支持这个特性, 写了整整将近 7 年, 诞生了诸如 [chalk](https://github.com/rust-lang/chalk) 等项目  

~~(没错, 将近 7 年, 确切来说是 6.5 年, 而且至今仍在完善)~~  

但现在(1.79)版本下, gat 仍然有相当多的不完善之处, 对其支持仅仅是最小化支持, 且带有相当多限制  
但即使如此, 也已经相当够用了  

顾名思义, 泛型关联类型, 也就是在关联类型的基础上添加了泛型, 仍然是关联类型的一种:  

```rust
trait Container {
    type Value<T>;  // Here
}
```

是的, 你没有看错, 仅仅是使得关联类型的位置能够支持泛型了  
但这却解决了非常非常多的问题, 让 rust 能模拟一个非常重要的语法特性: `HKT(高阶类型, Higher-Kinded-Type)`  

GATs 让我们拥有了使用 `type-constructor(类型构造器)` 的能力  

- - -

# Type && Kind

那么什么是 `type-constructor` 呢?  介绍它之前, 先让我们了解一下 `type(类型)` 与 `kind(阶)` 的概念  
比如这么一个函数:  

```rust
fn not(x: bool) -> bool {
    !x
}
```

- `not` 函数接收一个 type 为 bool 的参数, 返回一个 type 为 bool 的值, 因此 `not` 的 type 就是 `bool -> bool`  
- `x` 这个参数的 type 则是 `bool`  

type 表示 `数值的类型`, 那么什么是 kind 呢? 其实这也是较好理解的, 是基于 `type` 再往上抽象了一层的产物:  

|name|type|kind|
|:--|:--|:--|
|`not`|bool -> bool|*|
|`x`|bool|*|

不管是 `bool` 还是 `bool -> bool`, 两者的类型都是一个已经非常具体的类型, 其 `kind` 则是 `*`  
为了便于理解, 姑且称呼这些类型为 `具体类型` (你也可以将它们叫作 `full-type`, `actual-type`, `standalone-type`)  
这些类型都是很具体的, 其 `kind` 是相同的 `*`  

(当我们站在 kind 这个抽象层上看待 type 时, 应该使用 `type` 指代具体的 `i32`, `bool`, `i32 -> i32`, 它们都是 `type`)  
(其实站在 type 这个抽象层看待 value 时, 也是一样的道理)  

**一句话, type 用来抽象 value, kind 用于抽象 type**  
倘若你要问 `true` 的 kind 是 `*` 吗? 那不对, 你得说 `bool` 的 kind 是 `*` 才对  

你可能要说了:  
什么鬼啊, 照你这么说岂不是所有的类型都是 `*` 了, 比如 `i32`, `fn(i32) -> i32`, `Vec<T>`, `Result<T, E>`......  
这些类型都是具体类型, 其 kind 难道不都是 `*` 吗?  
 
没错, 在 rust 中的 `Vec<T>`, `Option<T>`, 它们都是一层的 `type`, 即其 kind 是 `*`  
但如果是 `Vec` 而不是 `Vec<T>` 呢? 假设这也是某种类型  

你会发现, 你必须提供一个类型 (比如 `Vec<i32>` 就是向 `Vec` 提供了 `i32` 作为参数), 才能构造出最终的具体类型  
对于这种特殊类型来说, 其 kind 就是 `* -> *` 了  

  
|type|kind|
|:--|:--|
|`Vec<i32>`|*|
|`Vec<?>`|* -> *|
|`Option<i32>`|*|
|`Option<?>`|* -> *|
|`Result<String, Error>`|*|
|`Result<String, ?>`|* -> *|
|`Result<?, ?>`|* -> * -> *|

(`Vec<?>` 就表示前文的 `Vec`, 需要向其中提供一个参数)  
~~(其实当你看到这里, 类型构造器的概念也已经差不多了解了)~~  

- - -

# 类型构造器

~~(虽然前面已经讲了, 但这里还是写点具体的rust代码吧?)~~  

如下代码中的 `Trait::Type` 便如同前文的 `not` 函数, 不过 not 是参数接收一个值, 并返回一个值, 其参数是 `type` 为 `bool` 的 `value`  
而此时的 `Trait::Type` 却是接收一个类型, 并返回一个新类型, 即参数是 `kind` 为 `*` 的 `type`, 返回值是个新的 type  
像这样接收 type, 以 type 作为参数并创建新的 type 的玩意儿, 我们将其称为 `类型构造器`  

因此, `Trait::Type` 的 kind 可以表示为 `* -> *`  
(或者 `type -> type`, 都表达了只在乎 `阶`, 就像是不管是 true 还是 false, 都可以用 `bool` 来表示, 表达了只在乎 `类型`)  

```rust
trait Trait {
    type Type<T>;
}
```

我们可以通过将类型作为 `Type<T>` 中的泛型参数 `T` 传入, 然后在 `impl` 块里面指定新的类型, 比如如下我们指定了类型构造器是 `X -> Option<X>`  
在使用时, 我们只需要给类型构造器传入一个类型, 比如 `i32` 后就能得到 `Option<i32>` 了  

```rust
trait Trait {
    type Type<T>;
}

impl Trait for () {
    type Type<X> = Option<X>;
}

fn main() {
    let a = <() as Trait>::Type::<i32>::default();  // Option::<i32>::default()
}
```  

GATs 其实就是让 "关联类型" 允许成为 "类型构造器"  
之前这玩意也被叫作 `ACT(Associated-Type-Constructors, 关联类型构造器)`, 差不多的意思, 无须在意  

- - -

# 高阶类型(HKT)  

你可能听到过许多次 `高阶类型(Higher-Kinded-Type, HKT)` 的名字, 其实这与 `高阶函数(Higner-Ordered-Function, HOF)` 是一个道理:  

- `高阶函数(HOF)` 指某种参数可以是 函数与变量 的 函数  
- `高阶类型(HKT)` 指某种参数可以是 类型构造器与类型 的 类型构造器

当然, 就像是 `HOF(高阶函数)` 不仅可以接收 函数 作为参数, 也可以如同 普通的函数 那样接收 变量 作为参数  
`HKT(高阶类型)` 也一样, 不仅可以接收 类型构造器 作为参数, 也可以如同 普通的类型构造器 那样接收 类型 作为参数  

继续类比进行理解, 对于高阶函数来讲, 什么 `map`, `foreach` 之类的函数你肯定已经用过了, 这些函数都需要你手动传入闭包  
换句话说, `这赋予了让用户选择怎么做的权利`, 你传入 `map` 里面的闭包可以是让数组全部加 10, 可以是全部变成 0  

`高阶类型(HKT)` 也是一样的道理, 比如我们在设计某个容器类型时:  

```rust
// 一个包装容器的类型
// 伪代码中的 `C[_]` 表示一个类型构造器
struct Container<C[_] {
    data: C<i32>
    // ...
    // ...
}

Container<Vec>
Container<LinkedList>
```

你可以用 `Container<Vec>` 或者 `Container<LinkedList>` 让用户决定该以何种形式去存储数据   
但很可惜的是, 前文也说过 rust 中并不存在 HKT, 仅仅只有 `Vec<i32>`/`LinkedList<i32>` 这些具体类型, 只能通过 GATs 去模拟  
`HKT` 就是类似这样的类型, 只是它提供了根据传入的类型构造器(或者类型), 构造某个新类型的能力  

再多举一点类似的例子, 比如下面这段伪代码, 来自于 [lending_iterator](https://docs.rs/lending-iterator/latest/lending_iterator/) 中对 `HKT` 的说明:  

```rust
// ArrayKind 是一个类型构造器
struct Container<ArrayKind[_]> {
    array_i32s: ArrayKind<i32>,
    array_strings: ArrayKind<String>,
}


type StructOfVecs = Container<Vec>;
// Equals to
struct StructOfVecs {
    array_i32s: Vec<i32>,
    array_strings: Vec<String>,
}


type StructOfVecDeques = Container<LinkedList>;
// Equals to
struct StructOfVecDeques {
    array_i32s: LinkedList<i32>,
    array_strings: LinkedList<String>,
}
```

我们甚至可以更加灵活一点, 通过临时构造一个类型, 来取代上面作为参数的 `Vec` 与 `LinkedList`:  

```rust
// 假设 `HKT!` 是一个魔法宏, 人为临时地构造了一个 `类型构造器`, 如同向 `map` 函数传入闭包一样
type StructOfPairs = StructOfArrays< HKT!(T => [T; 2]) >;
// Equals to
struct StructOfPairs {
    array_i32s: [i32; 2],
    array_strings: [String; 2],
}
```

当然, rust 中并没有这种语法, 在 rust 中存在的是 `Vec<i32>`, `LinkedList<i32>` 这样的具体类型  
**但是**, rust 中存在 GATs, 也就是上一节中介绍的那个泛型关联类型哩 :)  

- - -

# 一些例子

来点小例子吧, 随便瞎扯一些, 想到了啥就扯点啥~~~~  

## 容器类型

我将如何抽象某个容器类型放到第一个地方讲, 因为这部分比较经典与有趣 ~~(其实是因为比较简单啦, 太难直接把读者劝退了咋办)~~  
得益于 rust 中 GATs 的存在, 我们可以如上面的伪代码中那样抽象容器类型:  

```rust
trait Collection<T> {
    type Iter<'iter>: Iterator<Item = &'iter T>
    where
        Self: 'iter,  // 此行的添加是由于 https://github.com/rust-lang/rust/issues/87479 中的限制
        T: 'iter;     // T 的生命周期需要 比 'iter 更久才能借用

    fn empty() -> Self;
    fn add(&mut self, value: T);

    // fn iterate(&'iter self) -> Self::Iter<'iter>;
    fn iterate(&self) -> Self::Iter<'_>;
}
```  

在 `iterate` 方法中, 我们返回了集合迭代时的具体类型, 但因为不同集合类型的迭代器具体类型是不一样的, 所以我们需要进行抽象:  

- `Vec<T>` 对应的迭代器具体类型 `std::slice::Iter<'a, T>`  
- `LinkedList<T>` 对应的迭代器具体类型是  `std::collections::linked_list::Iter<'a, T>`  

因此我们可以通过 GATs 来表述, 无非就是多了个生命周期 (生命周期也是泛型的一种), 然后为各种集合类型实现该 trait:  

```rust
// Vec
impl<T> Collection<T> for Vec<T> {
    type Iter<'iter> = std::slice::Iter<'iter, T> 
    where
        T: 'iter;

    fn empty() -> Self {
        vec![]
    }

    fn add(&mut self, value: T) {
        self.push(value);
    }

    fn iterate(&self) -> Self::Iter<'_> {
        self.iter()
    }
}

// LinkedList
impl<T> Collection<T> for LinkedList<T> {
    type Iter<'iter> = std::collections::linked_list::Iter<'iter, T>
    where
        T: 'iter;

    fn empty() -> Self {
        LinkedList::new()
    }

    fn add(&mut self, value: T) {
        self.push_back(value);
    }

    fn iterate(&self) -> Self::Iter<'_> {
        self.iter()
    }
}
```

以 trait 为基调的实现比较符合 rust 常见的编码风格  
你可以把你脑子里那些什么 HKT, GATs 等名词, 类型构造器, kind与type 等概念全删掉, 然后仅简单将上述代码看作关联类型  
~~(这也是语言特性的开发团队为了一致性与兼容性所深思熟虑过的事情捏)~~  

然后我们可以拥有像这样的方法, 比如让元素是整数类型的集合转换为浮点数的集合:  

```rust
fn floatify<Input, Output>(ints: &Input) -> Output
where 
    Input: Collection<i32>,
    Output: Collection<f32>
{
    let mut floats = Output::empty();
    for &i in ints.iterate() {
        floats.add(i as f32);
    }
    floats
}

fn main() {
    let v = vec![1, 2, 3];
    let v: Vec<_> = floatify(&v);

    let l = LinkedList::from_iter([4, 5, 6]);
    let l: LinkedList<_> = floatify(&l);
}
```

同时需要注意类型推断, 这让迭代器被 `collect` 成某个具体的集合类型时同理, 毕竟有许多实现了 `Collection<f32>`, 编译器怎么知道是哪个呢?  
我们希望不会改变集合的类型, 仅改变集合元素的类型, 但当故意手动添加不同集合的类型作为注解时, 能导致集合的类型改变:  

```rust
let l = LinkedList::from_iter([4, 5, 6]);
let l: Vec<_> = floatify(&l);
```

这是因为 rust 通过我们提供的类型推导出了 `Output` 类型, 而 `Input` 的类型则是根据我们传入的参数, 已经固定推导出来了  
有没有什么办法从类型的关系上, 让 rust 不必通过用户提供的类型进行推导, 而是直接从参数进行推导, 从而限制住用户这种太过自由的行为呢?  

当然! 这里可以让编译器自动推导出 `Input 与 Output 是相同的集合类型(除了元素的类型不同)` 这一我们想要的事实  
其实就是加个关联类型成员, 再将其添加一个 trait-bound 即可:  

```rust
trait Collection<T> {
    type Output<M>: Collection<M>;
    // ...
}

impl<T> Collection<T> for Vec<T> {
    type Output<M> = Vec<M>;
    // ...
}

fn floatify<Input>(ints: &Input) -> Input::Output<f32>
where 
    Input: Collection<i32>,
{
    let mut floats = Input::Output::<f32>::empty();
    // ...
}
```

我们不想使用用户提供的类型注解, 所以直接用跟参数一起的关联类型, 避免了集合的类型能从 `Vec` 变成 `LinkedList`  
值得注意的是, 有时候我们想要的是将选择的权力交给调用方, 也就是用户, 在 [family-trait](#family-trait) 中会提到  

- - - 

## Functor

(倘若你已经理解了先前的知识点, 这里理解起来应该也不算太难)  

相信大家肯定用过 `map` 函数吧, 不管是 `std::iter::Iterator` 这个 trait 里面的 `map`, 还是 为 `array` 类型单独实现的 `map`, 反正你肯定用过就对了  
那么你有没有想过, 为什么 `map` 函数的实现就得分离开来呢? 能否有个统一的 trait, 比如 `Mapable`, 能够抽象这样的行为, 统一规范所有的实现呢?  

在各种各样以函数式编程为主的语言中, 就存在着这样一个概念, 不过它不叫 `Mapable`, 而叫 `Functor`  
让我们尝试利用 rust 中的 GATs 来实现这样一个抽象了 `map` 行为的 trait:  

```rust
trait Functor {
    type Inner;      // Unwrapped/Unplugged (代表容器内部值的类型)
    type Output<T>;  // Wrapper/Plugged (代表容器本身的类型, 其实是个接收类型创建新类型的类型构造器)

    // 为了与原本的 `map` 区分开来, 我们将方法取名为 `fmap`  
    fn fmap<F, B>(self, f: F) -> Self::Output<B>
    where
        F: FnMut(Self::Inner) -> B;
}
```

倘若你把 `Output<T>` 改成 `Output`, 意图根据此来指代整个容器类型的概念......很抱歉, 你可以自己试一试  

当我们实现时  

<figcaption> 以 `Option` 类型为例 (`Result` 类型同理):  </figcaption>  

```rust
impl<T> Functor for Option<T> {
    type Inner = T;
    type Output<U> = Option<U>;

    fn fmap<F, U>(self, mut f: F) -> Self::Output<U>
    where
        F: FnMut(Self::Inner) -> U,
    {
        #[allow(clippy::manual_map)]
        match self {
            None => None,
            Some(t) => Some(f(t)),
        }

        // // 你也可以直接复用标准库中已经实现的 `map`  
        // self.map(f)
    }
}
```

<figcaption> 照猫画虎为 `array` 类型实现一下 </figcaption>  

```rust
impl<T, const N: usize> Functor for [T; N] {
    type Inner = T;
    type Output<U> = [U; N];
    fn fmap<F, B>(self, f: F) -> Self::Output<B>
    where
        F: FnMut(Self::Inner) -> B,
    {
        self.map(f)
    }
}
```

倘若没有 GATs, 也就是没有 `type Output<T>` 这里的类型构造器的情况下, 我们将只可能拥有同态的 functor  
也就是说 map 函数必须返回相同的类型,  即只能 `T -> T`, 而无法 `T -> U`, 我们此刻的是多态的 functor, 对应后者  

还有其他非常多的来自函数式编程中的一些概念, 不过 `Functor` 算是其中最经典最简单的一个了  
其余在 rust 中的实现, 就请自行查阅与思考吧!  

~~(我是不会告诉你其实是因为有些概念我也看不懂所以才不继续讲的)~~  

## Self泛型

众所周知, rust 中的 `Self` 是一个类型别名, 指示你正在 `impl` 的那个类型, 如 `impl i32 { ... }` 时, `Self` 就指代 `i32`  
同样众所周知的一点, 那就是 `Self` 是不能够添加泛型的, 你只能 `Self`, 而不能 `Self<T>`  

让 Self 能够泛型化有什么用呢?  让我们以之前的 `Functor` 为例, 倘若其可以支持泛型:  

```rust
trait Functor<T>: HKT1 {
    fn map<U, F>(self, f: F) -> Self::With<U>
    where
        F: FnMut(T) -> U;
}

impl<T> Functor<T> for Option<T> {
    fn map<U, F>(self, f: F) -> Self<U> 
    where
        F: FnMut(T) -> U
    {
        self.map(f)
    }
}
```

倘若用模式匹配的思想看待上述伪代码, 你会发现返回值的类型 `Self<U>` 对应 `Option<U>`, 则 `Self` 就自然对应了 `Option`  
这在今天的 rust 中可能吗? 不, 这不可能, rust 中的类型都是具体类型, 比如 `M<T, U, Z>`, 而不可能是 `M` 这种没写全的  
~~(当然诸如 haskell 等许多函数式编程语言都是可以的)~~  

哭唧唧~~, 要是能够像这样写岂不是会写得很爽? (虽然本质上一样, 无非是先前那套 Functor 的关联类型给你隐藏起来了而已)  
但鉴于 GATs 的存在, 我们确实可以模拟出来:  

```rust
trait HKT1 {
    type Inner1;
    type With<T>;
}

impl<T> HKT1 for Option<T> {
    type Inner1 = T;
    type With<A> = Option<A>;
}

impl<T> Functor<T> for Option<T> {
    fn map<U, F>(self, f: F) -> Self::With<U>
    where
        F: FnMut(T) -> U,
    {
        self.map(f)
    }
}
```

本质上和先前的 Functor 是一样的, 只是我们包装起来稍微舒服点, 通过 `Self::With<U>` 来模拟 `Self<U>` 了  
你也可以模仿上面的 `HKT1`, 定义 `HKT2`, `HKT3` 等 trait, 并且实现:  

```rust
trait HKT2 {
    type Inner1;
    type Inner2;
    type With<T, U>;
}
```

如果使用宏的话, 这些重复的定义都能够自动生成, 且自动为你指定的类型实现, 不过我懒得继续讲宏了, 就这样吧, 略过略过!!  
(你可以把宏理解为操控字符串, 只要你懂得怎么自动生成这些代码, 就可以通过声明宏喂给编译器进行解析)  

## family-trait

`family-trait/type-family` 是种技巧, 也可以说是设计模式, 你能暴露出部分内部的实现, 然后让用户自行选择使用哪部分  

其实理解起来很简单, 让我们看看下面几个类型:  

- `Rc<RefCell<T>>`
- `Rc<Cell<T>>`
- `Arc<Mutex<T>>`
- `Arc<RwLock<T>>`

这些都是 `智能指针(smart-pointer)`, 且提供了内部可变性, 但是分为了单/多线程的情况  

让我们再具体一点, 并且将问题只放在 `Rc` 与 `Arc` 上, 倘若你正在编写树状的数据结构, 用 `Rc` 或 `Arc` 来包裹树的结点  
如果你只用了 `Rc` 作为结点的类型, 那么你的用户就会开始吵闹: "喂, 为什么用的不是 `Arc` 啊? 你让我多线程情况下怎么用啊?"  
如果你只用了 `Arc` 作为结点的类型, 那么你的用户就会开始吵闹: "喂, 为什么用的不是 `Rc` 啊? 单线程情况下速度也太慢了吧?"  

你汗流浃背, 为了满足两大需求不同的群体, 你选择......写两份代码! 粘贴, 复制, 将 `Rc` 替换为 `Arc`, 一气呵成  
~~(但面对天灾(指暴怒且嗷嗷待哺的用户们), 我们并非无计可施)~~  

(其实写两份代码也是非常简单的正确方法捏~, 比如 `im-rc` 与 `im` 这两个 crate 就是这种情况)  

倘若我们可以定义一个 `reference-counted(引用计数)` 的 `family`  
但通过 GATs, 我们就可以先内部进行抽象, 然后再暴露出去让用户自己选择到底是 `Rc` 还是 `Arc` 了:  

```rust
trait RefCountedFamily {
    type Pointer<T>;
    fn new<T>(value: T) -> Self::Pointer<T>;
    // ...
    // ...
}

struct RcFamily;
impl RefCountedFamily for RcFamily {
    type Pointer<T> = Rc<T>;
    fn new<T>(value: T) -> Self::Pointer<T> {
        Rc::new(value)
    }
    // ...
    // ...
}

struct ArcFamily;
impl RefCountedFamily for ArcFamily {
    type Pointer<T> = Arc<T>;
    fn new<T>(value: T) -> Self::Pointer<T> {
        Arc::new(value)
    }
    // ...
    // ...
}

struct Container<P: RefCountedFamily> {
    data: P::Pointer<i32>,
}
```

用户使用的时候可以通过传入诸如 `RcFamily` 这种实现了 `family-trait` 的具体类型, 以此选择了使用 `Rc`:  

```rust
let c = Container::<RcFamily> {
    data: RcFamily::new(1),
};
```

对于最开始的 `Rc<RefCell<T>>`, `Rc<Cell<T>>`, `Arc<Mutex<T>>`, `Arc<RwLock<T>>` 也是同理  
你可以组合这些类型, 暴露出来, 然后交给用户进行选择, 抽象了 `线程安全/智能指针` 的选择  

## 借贷迭代

(以下部分代码来自 <https://rust-lang.github.io/generic-associated-types-initiative/explainer/motivation.html>)  

`streaming-iterator`/`lending-iterator`, 这两个都是同一个东西, 请注意, 这和 `async(异步)` 生态中的 `Stream` 不是一个概念  
因为前者的名字可能会与 `async` 生态中的 `Stream` 一起造成困扰, 所以我个人更偏向于使用后者的名词  

`lending-iterator(借贷迭代器)`, 概念上来讲就是 GATs 版的 `std::iter::Iterator`, 并且关联类型的泛型参数是个 lifetime  

先让我们重温下 `std::iter::Iterator` 相关的内容:  

```rust
pub trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
    // ...
    // ...
}
```

里面有一个非泛型的关联类型 `Item`, 我们可以调用 `next` 方法进行迭代, 因此我们可以写出类似这样的代码:  

```rust
struct Iter<'a, T> {
    data: &'a [T],
}

impl<'a, T> Iterator for Iter<'a, T> {
    type Item = &'a T;

    fn next(&mut self) -> Option<Self::Item> {
        self.data.split_first().map(|(prefix_elem, suffix)| {
            self.data = suffix;
            prefix_elem
        })
    }
}

fn main() {
    let mut iter = Iter { data: &[1, 2, 3] };
    assert_eq!(iter.next(), Some(&1));
    assert_eq!(iter.next(), Some(&2));
    assert_eq!(iter.next(), Some(&3));
    assert_eq!(iter.next(), None);
}
```  

在这里, `Item` 的类型被指定为 `&'a T`, sd




- - - 

# 参考资料

- <https://blog.rust-lang.org/2021/08/03/GATs-stabilization-push.html>
- <https://rust-lang.github.io/rfcs/0195-associated-items.html#associated-types-engineering-benefits-for-generics>
- <https://rust-lang.github.io/rfcs/1598-generic_associated_types.html>
- <https://rust-lang.github.io/generic-associated-types-initiative/explainer/motivation.html>
- <https://www.fpcomplete.com/blog/monads-gats-nightly-rust>
- <https://typelevel.org/cats/typeclasses/functor.html>
- <https://diogocastro.com/blog/2018/10/17/haskells-kind-system-a-primer>
- <https://smallcultfollowing.com/babysteps/blog/2016/11/09/associated-type-constructors-part-4-unifying-atc-and-hkt>
- <https://docs.rs/lending-iterator/latest/lending_iterator>
- <https://smallcultfollowing.com/babysteps/blog/2023/05/09/giving-lending-and-async-closures>
- <https://sabrinajewson.org/blog/the-better-alternative-to-lifetime-gats>

感谢您的观看~
