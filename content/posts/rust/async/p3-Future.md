+++
title = "rust-async-p3~> Future"
path = "posts/rust-async/p3"
date = "2021-09-12"
template = "page.html"
+++
> Rust 中的 Future/async/.await 说明  
<!-- more -->  
同系列传送门: [rust-async](/categories/rust-async)

# 开篇
大家好! 我们上一节已经知晓异步的基础概念, 现在,来看看Rust中的异步语法吧    

本节, 我们将学习以下三个概念的大致含义:  
(暂时不涉及背后原理, 原理要等之后专门出好几节来讲)   

- Future (trait)  
- async (keyword)
- .await (keyword)

- - -

# Future
## 概念
`Future`,一个标准/核心库中的trait: `std/core::future::Future`   

在Rust中,一个实现了Future(trait)的类型, 该类型的实例(一个Future实例), 便代表 `一次异步计算`, 可将其交给 `Runtime(运行时)` 来异步执行   

`异步执行`, 也就是指:    
- 其他异步任务阻塞时,当前异步任务有机会执行  
- 当前异步任务阻塞时,其他异步任务有机会执行  

总而言之,阻塞时期执行其他任务,不给cpu空闲的机会


**注意两个名词的区别:**  
- `异步 计算`  
- `异步 任务`

两者有着区别,举个例子你就明白了:  
  
假设有这么个父计算, 由两个子计算组成:   
1. Open: 先异步打开一个文件(async open)  
2. Read: 再异步读取该文件(async read)   
 
我们可以看出, 一次计算可以由多个有依赖关系的子计算组成, 若 Open 陷入阻塞, Runtime 不能调度 Read 填充这段阻塞时期  
因此, 当某个子计算阻塞时, 它所属的最顶层的父计算也应阻塞, 避免 Runtime 调度非法计算  
(我们将`最顶层的父计算(top-level Future, 即最顶层的Future实例)`称为`Task(任务)`)  

当前 Task 阻塞时, 接管执行权的不能是当前 Task 中的其他子计算, 只能是其他 Task 中的子计算  

总结:  
- Task 是一个顶层 Future 实例 (即一次顶层异步计算) 
- 一个 Future 可以由多个 Future 组成, 即一个 Future 里可以执行多个 Future
- Task_A 阻塞时,接管执行的是其他 Task 中的子计算,不能是 Task_A 中的子计算
- Task 可以只是一次单独计算

一个 Future, 可理解为是组成一个 Task 的最小单位 

## 定义  

让我们来看看它的定义:
```rust   
pub trait Future {
    type Output;
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```
下面简单了解一下:  

- Future:  
代表一次异步计算  

- Output: 代表 Future 执行完毕后, 产出的值的类型   
- poll: 所有执行操作都会放在该函数中, Runtime 会不断调用 poll 来推进 Future 的完成, 其返回值是枚举类型, 代表是否完成
- Poll\<T\>: 枚举类型, 作为 poll 的返回值类型, 其变体有:  
`Poll::Pending`: 指明该计算处于阻塞, 调度程序在该计算阻塞完毕后, 继续调用 poll(因为之后可能还会阻塞)  
`Poll::Ready(T)`: 指明该计算执行完毕, 并产出一个类型为 T 的值   <br/>

- - -

# Async  
Rust 为我们提供了关键字 async, 方便人们为某次计算实现 Future  
你想一想, 实现了 Future 本身的类型可以是随便某个类型, 毕竟我要的是计算, 而不是结构体啊  
async, 便是用来创建一个匿名结构体实例, 自动为该结构体实现 Future, 即, 用来创建一个 Future 实例  

来个例子,看看 async 的好处:   

```rust
// 1 
async fn hello_str_1() -> String { 
	String::from("Hello! World!")
}
// 2 
struct HelloStr;
impl Future for HelloStr {
	type Output = String;
	fn poll(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Self::Output> {
		let str = String::from("Hello! World!");
		Poll::Ready(str)
	}
}
fn hello_str_2() -> impl Future<Output = String> {
	HelloStr
}
```

你可以观察到, 使用 async 进行了符合直觉的简化, 这两种函数,实际上是等价的  
看看它们两的返回值:  

```rust
// 1
async fn hello_str_1() -> String { 
	String::from("Hello! World!")
}
hello_str_1() // 返回值为 `impl Future<Output = String>`
// 2
fn hello_str_2() -> impl Future<Output = String> {
	HelloStr // Future<Output = String> 的实例
}
hello_str_2() // 返回值为 `impl Future<Output = String>`  
```

注意, 异步函数的调用, 只是返回一个 Future实例  
但并没有开始执行, 它是惰性的, 只有调用 Future 的 poll 方法, 才能推动它的执行, 而调用 poll 的工作, 则交给了运行时(执行器), 而非用户

这样的好处就在于, 将一次异步计算当作一个变量, 方便传参等工作  
比如, 想舍弃某次异步任务, 只需将对应的 Future 实例给 drop 掉, 使其所有权丢失即可  
如果一旦创建 Future 实例就立刻执行, 就没有这么方便了

async 的作用就是创建一个 Future 实例, 以下是不同的语法糖:  
- `async fn`: 异步函数, 要求返回一个 Future 实例   
- `async block`: 异步代码块, 创建一个 Future 实例  
- `async closure`: 异步闭包 (目前是不稳定特性) 创建一个 Future 实例  

```rust
// 1
// 返回值为 `impl Future<Output = String>`
async fn hello() -> String {
	String::from("Hello")
}
// 2
// 该代码块创建了类型为 `impl Future<Output = i32>` 的实例
async {
	let a = 1_i32;
	a
}
// `async block` 也可以使用move  
// 获得其中使用的变量的所有权  
let s = String::new();
async move {
	&s 
}
s; // Error: use of moved value
// 3
// 闭包因为不稳定, 我也懒得讲了......
```

创建一个Future实例, 想必大家已经了解一二, 但如何执行一个Future实例?  
请接着往下看

- - -

# 执行
## 背景介绍  
Rust本身并不提供 `异步运行时 (async runtime)`, 以便语言内核精小, 便于进化/迭代/维护  
仔细看看 Future 的完整路径, 你会注意到, 它也存在于核心库(core)中, 这意味着, Rust 一定可以提供 Future trait, 即使是嵌入式等环境  

异步运行时, 由社区提供, 围绕语言本身提供的定义 (如 Future) 进行扩充, 来支持异步程序  
因此它是可选的, 你可以凭借 `cartes.io` 上提供的相关carte, 在不同的环境下使用不同的运行时, 即使在嵌入式等环境, 也能轻松运行异步程序  

在开始下面的章节前, 请确保你已经在 `Cargo.toml` 中添加了如下代码  
以 `async-std` 这个虽然不主流, 但和标准库的API一致, 对新人比较友好的 crate 作为例子:  

```toml
[dependencies]
async-std = { version = "1.9", features = ["attributes"] }
```

## Runtime

我们先来创建一个打印 "hello world" 的 Future吧:   

```rust
use async_std::task;
async fn hello_world() { 
	println!("Hello wrold!");
}
fn main() { 
	let fut = hello_world();
	task::block_on(fut);
}
```

还记得我们提到过的 Task (异步任务, Top-level Future, 即顶层的异步计算) 吗?  
`async_std::task` 提供了大量 API, 用来执行/操控这些 Task  

如这里出现的`task::block_on`, 传入一个 Future, Runtime 会执行它(调用 poll) 并阻塞调用线程  
该任务执行完毕后产出的值,会作为 `block_on` 的返回值  

我们执行了一个 Task, 且这个 Task 是单个的 Future, 但若我们想执行由多个 子Future 所组成的 Task, 又该怎么办?  
`.await` 关键字出场了! 

- - -

# Await  
`.await` 只能出现在 `async fn/block` 内部, 在某个 Future 变量后面添加 `.await` 后, 该 Future 就会执行  
但是, 它只是表述这么个逻辑而已, 因为Rust语言本身没有异步运行时(无执行能力)  
真正执行的话, 得将 Future 交给运行时, 带动着执行里面的 子Future   

来看看它的使用:  

```rust
use async_std::task;
async fn hello() {  
	print!("Hello ");
}
async fn world() {
	println!("world!");
}
async fn hello_world() { 
	hello().await;
	world().await;
}
fn main() { 
	let fut = hello_world();
	task::block_on(fut);
}
```

`.await` 是一个标记点, 可理解为是一个 `yield point`, Runtime 执行到 `xxx.await` 时,先会执行一次 `xxx`  

一开始会调用一次 poll, 推动执行进度, 通过它的返回值, 即 `Poll::Pending` 或 `Poll::Ready(T)`  
来决定做以下两件事中的哪一件:  
- 让其他 Task 接管执行权(yield)  
- 继续执行当前 Task  

若为`Pending`: 则选第一个, 让其他 Task 接管执行权(如IO操作的阻塞期间, 让其他 Task 执行)  
若为`Ready`: 则选第二个, 继续往下执行(一个 Task 可能由多个 子Future 组成)  

可能有点难理解, 来个简单粗暴理解版:  

`.await` 指明 `执行某个Future` 这一逻辑  
当 `xxx.await` 所在的 Task 交给 Runtime 并并执行到 `xxx.await` 时, `xxx` 这个 Future实例 会执行  

若它阻塞(这意味着该 Future 所在的 Task 也阻塞), 所以调度程序安排其他 Task, 在该空档期执行  
若不阻塞, 就继续往下执行(可能还会碰见 `.await` 哟), 直到该 Task 结束   

- - -  

# 补充
- `#[async_std::main]`  
这玩意是个属性宏, 要加在main函数头上, 使得 main 前面能被 async 所修饰  
程序运行时, main 返回的Future, 会自动交给 Runtime 开始运行, 如下:  

```rust
#[async_std::main]
async fn main() {
    hello_world().await
}
// 等价于:
fn main() {
    async_std::task::block_on( async {
        hello_world().await
    })
}
```


- `async_std::task::spawn`  
因为这玩意也很常见, 向其传入 Future, Runtime 会开始运行它, 并返回 `async_std::task::JoinHandle` 类型的实例  
它实现了 Future, 与标准库中的 `JoinHandle` 无比相似, 不过 `join` 相应地改变为了 `.await`  
想让该 handle 代表的 Task 运行完毕, 应在该 handle 前放上 `.await` 进行修饰哦:  

```rust  
use async_std::task;
#[async_std::main]
async fn main() { 
    let handle = task::spawn(async {
        1 + 1
    });
    let two:i32 = handle.await;
}
```

- - -

上一篇: [p2~> 异步简介](/posts/rust-async/p2)  
下一篇: [p4~> 状态的保存与变换](/posts/rust-async/p4)  
