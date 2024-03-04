+++
title = "rust-gtk4-p5~> GObject-通用类型"
path = "posts/rust-gtk4/p5"
date = 2022-11-20
template = "page.html"
+++
> 本节将学习 GObject 的 generic-values(通用值), 了解 glib 的通用体系, 与序列化的代码
<!-- more -->

同系列传送门: [rust-gui](/categories/rust-gui)  
GNOME入坑指南: [gnome](/posts/desktop-beautify/gnome)

# 说明
之前说过, gnome体系依赖于 glib, 以C语言为核心的实现, 通过 Gobject-Introspection 为大量语言提供绑定  
这是一套以C为核心, 支持多语言互相交互的运行时系统, 自然要有套完整且够通用的数据类型  

在为Rust提供的绑定中, 有两套这样的数据类型, 分别是:  
- `glib::Value`: 作用于 rust 与 glib 之间数据类型的互相转换
- `glib::Variant`: 作用于数据类型的序列化/反序列化, 以使应用与外部世界(比如某个进程)交互, 或存储数据到本地磁盘

之后学习属性与信号时, 我们将会用到 `glib::Value`, 即 `GValue`, 让 rust 中的数据类型 能与 glib 的库函数互相交互  
之后学习偏好持久化/设置保存时, 我们将会用到 `glib::Variant`, 即 `GVariant`, 进行数据的序列化与反序列化  

搞清楚以上的说明之后, 接下来的难度便是一马平川, 只需稍微看几眼有个印象, 到时候多查查文档就 ok 了  
接下来的代码直接抄官方书籍了, 不过加了大量解释, 希望有助于你理解它们

- - -

# Value
你可以简单地将 `glib::Value` 理解为一个 Wrapper 类型, 如果用 rust 中的 enum 来表示, 它可以是这样的:  


```rust
enum Value<T> {
    bool(bool),
    i8(i8),
    i32(i32),
    u32(u32),
    i64(i64),
    u64(u64),
    f32(f32),
    f64(f64),
    // boxed-types
    String(Option<String>),
    Object(Option<dyn IsA<glib::Object>>),
}
```

你会观察到 `boxed-types(装箱类型)` 这几个字, 它包装一个 rust 中的 `Option<T>` 类型  
即, boxed-types, 可接受包装 `Option<T>::None`, 以此来表示可空这个概念  

此时, 装箱所得的结果, 是个代表着C语言中 `null` 概念的东西, 而其他的如数字/布尔类型的 GValue, 则不允许包装 `None`  


听着云里雾里的? 那就直接看代码吧, 下面是一些例子, 或许能帮助你更好地理解:

<figcaption> Example: non-boxed-types </figcaption>

```rust
use gtk::prelude::*;
fn main() {
    // Store `i32` as `Value`
    let integer_value = 10.to_value();

    // Retrieve `i32` from `Value`
    let integer = integer_value
        .get::<i32>()
        .expect("The value needs to be of type `i32`.");

    // Check if the retrieved value is correct
    assert_eq!(integer, 10);
}
```

<figcaption> Example: boxed-types </figcaption>

```rust
use gtk::prelude::*;
fn main() {
    // Store `Option<String>` as `Value`
    let string_some_value = "Hello!".to_value();
    let string_none_value = None::<String>.to_value();

    // Retrieve `String` from `Value`
    let string_some = string_some_value
        .get::<Option<String>>()
        .expect("The value needs to be of type `Option<String>`.");
    let string_none = string_none_value
        .get::<Option<String>>()
        .expect("The value needs to be of type `Option<String>`.");

    // Check if the retrieved value is correct
    assert_eq!(string_some, Some("Hello!".to_string()));
    assert_eq!(string_none, None);
}
```

当你希望区分可以表示空的Value, 只需将 `get::<String>` 换成 `get::<Option<String>>` 即可, 函数会自动帮你进行转换

<figcaption> 直接使用 `get::&lt;string&gt;` 而不是 `get::&lt;option&lt;string&gt;&gt;` </figcaption>

```rust
use gtk::prelude::*
fn main() {
    // Store string as `Value`
    let string_value = "Hello!".to_value();

    // Retrieve `String` from `Value`
    let string = string_value
        .get::<String>()
        .expect("The value needs to be of type `String`.");

    // Check if the retrieved value is correct
    assert_eq!(string, "Hello!".to_string());
}
```

我们将在之后学习 信号(signal) 与 属性(property) 时, 使用到 `glib::Value`

- - -

# Variant
数据要发送到某个进程或网络, 或想将数据存储在磁盘上时, 就可以使用 `glib::Variant`  
你可以将 `glib::Variant` 想象为 json 文本, 那是一种非常通用的文件格式  

根据文档所述:  
glib 中的 Variant, 被设计为与 dbus 体系有着基本相同的格式, 能够方便与 dbus 集成  
Variant 在处理序列化形式的数据方面进行了大量优化, 可在很短的常量时间内, 执行几乎所有的反序列化操作，且占用非常小的内存  
序列化的 Variant 数据也可以通过网络发送  

因此你希望更深入学习, 可以查找 dbus 的相关资料, 这不在接下来的文章范围内

与使用 `glib::Value` 的经验非常相似, 我们只需要将 `to_value()` 替换为 `to_variant()`:  

```rust
use gtk::prelude::*;
fn main() {
    // Store `i32` as `Variant`
    let integer_variant = 10.to_variant();

    // Retrieve `i32` from `Variant`
    let integer = integer_variant
        .get::<i32>()
        .expect("The variant needs to be of type `i32`.");

    // Check if the retrieved value is correct
    assert_eq!(integer, 10);
}
```

更多例子, 以下代码将实现 `Vec<T>` 与 `glib::Variant` 间的互相转化:  

```rust
use gtk::prelude::*;
fn main() {
    let variant = vec!["Hello", "there!"].to_variant();
    assert_eq!(variant.n_children(), 2);

    let vec = &variant
        .get::<Vec<String>>()
        .expect("The variant needs to be of type `String`.");
    assert_eq!(vec[0], "Hello");
}
```

我们将在使用 `gio::Settings` 保存设置, 或使用 `gio::Action` 激活操作时，用到 `glib::Variant`

- - -

上一篇: [p4~> GObject-子类化](/posts/rust-gtk4/p4)  
下一篇: [p6~> GObject-属性](/posts/rust-gtk4/p6)  
