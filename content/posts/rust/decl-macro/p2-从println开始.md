+++
title = "rust-decl-macro-p2~> 从println开始"
path = "posts/rust-decl-macro/p2"
date = 2021-09-19
template = "page.html"
+++
> 我们从熟悉的 println! 开始, 了解下声明宏的大致结构吧  
<!-- more -->
同系列传送门:  
- [博客: rust-decl-macro](/categories/rust-decl-macro) 
- [B站视频: Rust编程语言-声明宏](https://www.bilibili.com/video/BV1Wv411W7FH?p=1)

# 开篇  
大家应该都用过一个宏, 它就是 `println!`:  

```rust 
fn main() {
	let s = "Rush B!!!!";
	println!("{}",s);
	println!()
}
```

当你刚刚接触它的时候, 可能会感到些许疑惑, 为什么后面要跟个感叹号? 为什么括号里面的参数可以不一样?  

亲爱的 TRPl 在教你写 [Hello World!](https://kaisery.github.io/trpl-zh-cn/ch01-02-hello-world.html#%E5%88%86%E6%9E%90%E8%BF%99%E4%B8%AA-rust-%E7%A8%8B%E5%BA%8F) 时告诉过你: 名字后加个感叹号,就是个`宏(macro)`  
可 macro 到底是啥? ~~(算了算了,反正只要会用就行了,于是你点击了该网页的叉叉)~~  

- - -

# 查看定义  
让我们按住Ctrl,鼠标左键点击println (以VSCode 为例):

```rust
macro_rules! println {
    () => ($crate::print!("\n"));
    ($($arg:tt)*) => ({
        $crate::io::_print($crate::format_args_nl!($($arg)*));
    })
}
// 你可能会看到, 在 println! 的上面
// 有着类似下面的玩意:  
// 
// #[macro_export]
// #[stable(feature = "rust1", since = "1.0.0")]
// #[allow_internal_unstable(print_internals, format_args_nl)]
// 
// 这些也属于宏, 不过是 `过程宏`
// 而该系列要讲的是 `声明宏`, 因此略过
```

你悲催地发现, 根本看不懂这堆鬼画符... 但没事, 到后面几节你肯定就懂, 现在只需明白的是大致结构:  

- 我们将`macro_rules!`放在`println`前面,说明后者是个宏 (`macro_rules!`当作特定语法即可)  
- 之后用花括号包起来,里面是该宏的具体定义  

问题来了, 那对花括号内, 也就是具体定义里, 到底干着怎么的事?  
请容许我来帮你粗暴地类比一下`match表达式 && macro`:  

```rust
// match
match num {
	1 => "1".repeat(10),
	2 => {
		"2".repeat(10)
	}
	_ => panic!("Fuck you! I just want the  numer 1 or 2")
}
// macro
macro_rules! println {
    () => ($crate::print!("\n"));
    ($($arg:tt)*) => ({
        $crate::io::_print($crate::format_args_nl!($($arg)*));
    })
}
```

macro有点像是match,能根据不同参数,展开不同的代码, 在macro最外层的花括号中,有许多匹配分支, 想match一样:  

match:
- match表达式,称呼每个匹配分支为`arm`  
- 逗号分割它们彼此,或者不用逗号而用花括号包裹来分割  
- 最后一个arm可省略逗号  

macro:
- macro,则称呼每个匹配分支为`rule`(明白为什么使用`macro_rules!`创建宏了吗)  
- 必须使用花括号包裹,使用分号分隔彼此  
- 最后一个rule可省略分号  

你并不需搞清所有细节,现在先不用试图记忆具体语法,有印象即可  
现在再来看看 `println`,是不是稍微有点感觉了(看不懂的地方依然直接跳即可):  

```rust
// 定义部分
macro_rules! println {
	// 空参时, 只输出换行符
    () => ($crate::print!("\n"));
	// 有参时, 输出参数, 并换行
    ($($arg:tt)*) => ({
        $crate::io::_print($crate::format_args_nl!($($arg)*));
    })
}
// 使用部分
let s = "xxx";
println!("{}",s);
println!();
```
- - -
# 总结  

1. 创建一个假设叫xxx的macro,花括号包裹具体定义:  

```rust
macro_rules! xxx {}
fn main() {}
```

2. 然后创建两个匹配分支:  
(匹配空参 => 不做任何事)  
(匹配123 => 打印123)   <br/>

```rust
macro_rules! xxx {
	() => {};
	(123) => {println!("123")}
}
fn main() {}
```

3. 调用时, 要做到: 宏名+感叹号+传参:  
(传入的参数,若与任何rule都不匹配,则报错) <br/>

```rust
macro_rules! xxx {
	() => {};
	(123) => {println!("123")}
}
fn main() {
	xxx!();      // Nothing
	xxx!(123);   // println!("123");
}
```

本节只是为了留个大致印象, 建立一个整体结构的认知, 相信你肯定还有一些疑惑, 后面会比较系统地讲解  
咱们下期见  

- - -

上一篇: [p1~> 系列说明](/posts/rust-decl-macro/p1)  
下一篇: [p3~> 声明与使用](/posts/rust-decl-macro/p3)  
