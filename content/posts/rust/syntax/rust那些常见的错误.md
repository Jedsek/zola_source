+++
title = "rust中那些常见的错误"
path = "posts/rust-common-errors"
date = 2023-06-08
template = "page.html"
+++
> 一起来见识下那些 rust 编程语言中常见的错误吧!
<!-- more -->

**本文说明:**
本文会记录一下我本人遇见过的一些错误, 供大家参考, 喜欢或多或少能帮到大家, 错误来源于群聊或者个人开发  
开始吧! 时间...要加速了!! (jojo立, 神父换碟)  

**注意:**  
本文正在长期更新中, 你所看见的并非成品  


# 对模式匹配不敏感

```rust
use std::fmt::Display;

fn info<T: Display>(t: &T) {
    println!("{t}")
}

fn main() {
    // 报错
    let a: &str = "str_a";
    info(a);
    
    // 不报错
    let b: &&str = &"str_b";
    info(b);
}
```

如果你在 [rust-playground](https://play.rust-lang.org) 上运行这段代码, 会报如下错误:  

```
 --> src/main.rs:11:10
   |
   |     info(a);
   |     ---- ^ doesn't have a size known at compile-time
   |     |
   |     required by a bound introduced by this call
   |
help: the trait `Sized` is not implemented for `str`
note: required by a bound in `info`

  --> src/main.rs:3:9
   |
   | fn info<T: Display>(t: &T) {
   |         ^ required by this bound in `info`
help: consider relaxing the implicit `Sized` restriction
   |
   | fn info<T: Display + ?Sized>(t: &T) {
   |                    ++++++++
```

报错信息非常友善, 第一段说, 我们在调用 `info` 函数时, 参数的大小无法在编译器知晓  
随后提示帮助: `str` 没有实现 `Sized`, 即 `str` 的大小在编译期时无法求解  

道理很简单嘛, 我们在传入参数, 发生模式匹配时, `&str` 对应 `&T`, 所以说 `T` 的类型是 `str`  
又因为 Rust 中默认泛型 `T` 是 `T: Sized`, 所以自然报错了  

编译器还非常贴心地在第二段贴出解决方案, 那就是为 `T` 指明, `T` 可以是大小在编译期时不知晓的 `?Sized`  
毕竟 `T` 虽然是 `?Sized`, 但我们使用的参数 `t` 是 `&T` 嘛, 完全没有问题! 所以改成如下即可  

```rust
use std::fmt::Display;

fn info<T: Display + ?Sized>(t: &T) {
    println!("{t}")
}

fn main() {
    let a: &str = "str_a";
    info(a);
    
    let b: &&str = &"str_b";
    info(b);
}
```

Perfect!

- - -

# 生命周期默认省略
啊啊啊啊啊啊啊啊啊啊啊, 举个例子, 有这么一个函数:  

```rust
let mut paragraph = Paragraph::new();
{    
    // ......
    // ......
    let text = String::from(include_str!("../file.txt"));
    let text: Vec<Line<'_>> = textwrap::wrap(&text, wrap_width)
        .into_iter()
        .map(Line::from)
        .collect();
    paragraph = Paragraph::new(text);
    // ......
    // ......
}
search_err.xxx();
```

这是一个被简化的例子, 存在一个 String 类型的 text 变量, 对其进行自动换行, 据此创建一个 Paragraph  
你意识到这里的wrap可以被写到 `src/utils.rs` 下, 以便其他代码复用  

你可能会这么写:  

```rust
pub fn wrap_text(text: &str, width: u16) -> Vec<Line> {
    textwrap::wrap(text, width)
        .into_iter()
        .map(Line::from)
        .collect::<Vec<_>>()
}
```

这里 text 的类型是 &str, 因为要放宽类型限制, 如官方教程中所述, 将比如 &String 通过 deref 转成 &str 后传入  
你在定义这个的时候, 编译完全ok, 逻辑看上去也ok, 生命周期默认省略嘛  

但是不对哟~~~~ 这里存在着一个陷阱  
因为生命周期可以自动省略的规则, 我们可能会因此没有下意识地去思考, 这导致了我们的错误  
举个例子, 当我们调用它时:  

```rust
let mut paragraph = Paragraph::new();
{    
    // ......
    // ......
    let text = String::from(include_str!("../file.txt"));
    let text: Vec<Line<'_>> = utils::wrap_text(&text, width);
    paragraph = Paragraph::new(text);
    // ......
    // ......
}
search_err.xxx();
```

这时就会报一个编译错误, 指出第一个 text 变量是在大括号/代码块中创建的  
根据 RAII, 第一个 text 在离开代码块的范围之后, 必定要被 drop  

在来看看我们对 wrap_text 的定义:  

```rust
pub fn wrap_text(text: &str, width: u16) -> Vec<Line>
```

因为 Line 实际上有着一个泛型, 所以它其实全称是 Line<'a>, 'a 是某个生命周期标记  
因为生命周期的默认省略规则: 当函数只传入一个引用时, 返回值的生命周期标记与它的生命周期标记挂钩  

所以, 把省略展开之后, 实际上是这个:  

```rust
pub fn wrap_text<'a>(text: &'a str, width: u16) -> Vec<Line<'a>>
```

在看看之前调用时的代码:  

```rust
{    
    // ......
    // ......
    let text = String::from(include_str!("../file.txt"));
    let text: Vec<Line<'_>> = utils::wrap_text(&text, width);
    // ......
    // ......
}
```

发现问题了吗?  
即使我们的函数实现, 其返回值实际上并不依赖引用, 但由于生命周期标记的约束, 编译器还是会按照约束来提醒我们  

为了纠正我们热心但却办了坏事的老朋友 rustc, 我们应该这样定义函数:  

```rust
pub fn wrap_text<'a, 'b>(text: &'b str, width: u16) -> Vec<Line<'a>>
```

这表明, 返回值的生命周期, 引用的生命周期, 两者并不搭噶  
伟大的 clippy 提醒了我们, 可以把 'b 省略掉:  
(省略的生命周期标记, 默认与已经定义的生命周期标记并不是同一个)  

```rust
pub fn wrap_text<'a>(text: &str, width: u16) -> Vec<Line<'a>>
```

呼~~ 完美啊, 经过这次事件之后, 需要走出的误区如下:  

- rust 本质上是一门手动管理内存的语言, 即使它很现代, 给人一种脚本式语言的错觉
- 为库设计函数时, 务必让自己的函数最通用, 限制下放到最小  
比如这里, 返回值的生命周期, 明明与参数的不搭噶, 但我们却将它们联系在了一起  
这相当于强行添加了一个不必要的约束条件, 所以才导致了我们原本能编译过的代码无法编译  
- 生命周期标记省略规则, 只是为了让代码更加清爽, 避免一部分正确情况下的不必要添加  
但你还是需要额外注意, 不要误以为能省略就一定是正确的 <br/>

你问我为什么知道这个情况?  ~~(当然是因为我也...)~~  
但没关系, 还是那句话, 编译报错就报错了, 正是以为 rustc 严格执法, 才让我思考为什么这里编译不过  

正是因为接下来的思考, 我才会去查看变量们相应的生命周期, 然后疑惑:  不应该啊, 这里调用没毛病啊?  
那么只可能是函数定义的时候出错了! 于是顺藤摸瓜寻找到了错误 :)  

错了并不要紧, 明白怎么改就行了  
~~(当你遇见 rust 的报错, 修改起来越发熟练后, 会发现自己成为了名无比卓越的 cpper, 精通各种生命周期, 内存管理的问题)~~  
