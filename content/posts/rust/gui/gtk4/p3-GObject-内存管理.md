+++
title = "rust-gtk4-p3~> GObject-内存管理"
path = "posts/rust-gtk4/p3"
date = 2022-03-30
template = "page.html"
+++
> 来看看什么是 Widget, 由此出发, 创建一个双按钮加减数字的经典程序, 探讨内存管理, 防止内存泄漏  
<!-- more -->

同系列传送门: [rust-gui](/categories/rust-gui)  
GNOME入坑指南: [gnome](/posts/desktop-beautify/gnome)

# Widget
任何Gtk应用, 都由许多部件(Widget)组成, 比如窗口、对话框、按钮、多行文本、容器等, 因此 Widget 是个抽象概念  
再比如, `Button(按钮)`, `Container(容器)`, 都属于 `Widget`  

[Widget Gallery](https://docs.gtk.org/gtk4/visual_index.html) 是Gtk提供的网站, 你可以通过浏览它, 更好地选择 `Widget`  

我们甚至能自定义出新的Widget, 通过`继承/子类化`, 因为 Gtk 是面向对象的GUI框架  
例如 `Button`, 其继承树如下:  

```
GObject
└── Widget
    └── Button
```

GObject, 也就是 `gtk::glib::object::Object`, 是 Gtk 对象层级中的基类, 继承 GObject 可以获取其特性  
举个例子, GObject 具有 `引用计数` 的特性, GObject 的子类对象也具有该特性, 当指向自身的强引用归零时, 自动释放内存  

接下来, 我们就来创建一个双按钮加减数字的程序, 探讨一下相关的注意事项, 这是来自官方书籍中的例子:  

- 创建一个窗口, 上面有两个按钮 `btn_inc`, `btn_dec`, 刚刚开始分别显示 `Increase` 与 `Decrease`, 会加减初始值为零的数字  
- 按下 `btn_inc`, 则将数字加一, 随后在 `btn_dec` 上显示该数字  
- 按下 `btn_dec`, 则将数字减一, 随后在 `btn_inc` 上显示该数字  

- - -

# 错误实现
首先请注意, 我都说了这是错误的实现, 接下来的思考是有瑕疵, 未考虑完全的 :)  

为了实现这样一个程序, 我们首先要定义这两个按钮, 并且将它们显示在窗口上, 上一节讲的没忘吧?  
下面是代码, 已经讲过的概念不再重复:  

```rust
use gtk::prelude::*;
use gtk::{Application, ApplicationWindow, Button, Orientation};

const APP_ID: &str = "xyz.jedsek.myapp";

fn main() {
    let app = Application::builder().application_id(APP_ID).build();
    app.connect_activate(build_ui);
    app.run();
}

fn build_ui(app: &Application) {
    // 创建两个按钮, 设置Label
    let btn_inc = Button::builder()
        .label("Increase")
        .margin_top(12)
        .margin_bottom(20)
        .margin_start(12)
        .margin_end(12)
        .build();
    let btn_dec = Button::builder()
        .label("Decrease")
        .margin_top(12)
        .margin_bottom(20)
        .margin_start(12)
        .margin_end(12)
        .build();

    // `Clicked` 事件发生后的处理函数
    // 出于简单演示的目的, 这里只是单纯的加减数字而已
    let mut num = 0;
    btn_inc.connect_clicked(|_| {
        num += 1;
    });
    btn_dec.connect_clicked(|_| {
        num -= 1;
    });

    // 创建容器, 指定其方向为垂直, 即添加元素的位置是上至下
    // 因此, 从上往下第一个是btn_inc, 第二个是btn_dec
    let gtk_box = gtk::Box::builder()
        .orientation(Orientation::Vertical)
        .build();
    gtk_box.append(&btn_inc);
    gtk_box.append(&btn_dec);

    // 窗口只能设置一个child, 因此把容器添加进去
    // 随后在容器中添加很多 widget, 达到全添加进去的目的
    let win = ApplicationWindow::builder()
        .application(app)
        .title("My Gtk App")
        .child(&gtk_box)
        .build();
    win.present();
}
```

显然, 都说了是错误演示, 自然会报错, 而且这里是编译期的报错  
如果看下 `connect_clicked` 的定义, 会发现它要求传入的闭包, 必须有 'static 的 lifetime  

道理很简单, 鬼知道用户啥时候会点按钮, 调用该回调函数, 要是闭包还活着, num这变量已经没了咋办?  
因此, 闭包有个 'static 的 lifetime, 在编译期就能限制开发者写出不安全的代码, 拒绝活得没闭包久的变量  

我们可以选择为闭包添加前缀, 即添加关键字 `move`, 让被闭包捕获的变量, 其所有权转移到闭包中  
这样子, 闭包死之前肯定可以一直访问到 num 这个变量, 毕竟所有权都进去了, 还怕它逃不成?  

但问题是, 这样的操作只能满足一个闭包, 我们有两个按钮, 需要写两个回调函数, 而所有权只能转移一次!  
有没有什么办法, 让这两个闭包都能拥有num的所有权?  

请看下面的正确实现, 通过引用计数的方式 :)
- - -

# 引用计数

嘿! 这不就是多所有权问题嘛, 还是在单线程的情况下 ~~(GUI框架好像都是单线程的?)~~  
那就可以使用 `std::rc::Rc` 这个类型, 通过引用计数, 绕过编译期的检查, 实现多所有权  

多所有权的问题已经达成了, 但我们还需要内部可变性, 因此还需要使用 `std::cell::Cell`  
于是, num变量的类型, 从简单的i32, 变成了一个Wrapper类型, 即 `Rc<Cell<i32>>`  

**提示**  
对于实现了 Copy 的类型, 请直接使用 Cell, 而非 Refcell  
因为 Cell 简单, 且直接使用 memcpy 来改变值, 效率高易理解

下面是代码, 请务必记得use一下:  

```rust
let num = Rc::new(Cell::new(0));
let num_clone = num.clone();

btn_inc.connect_clicked(|_| {
    num_clone.set(num_clone.get() + 1);
});
btn_dec.connect_clicked(|_| {
    num.set(num.get() - 1);
});
```

感谢强大的编译器与聪明的库作者, 他们逼迫着你, 让你考虑到了这种情况, 不然别想编译通过  
其他语言中可能会轻易出现的Bug, 你无法在Rust中复现, GNOME的软件用Rust进行重写, 可能就因为这?  

让我们将这个初步的代码升个级, 实现本节开篇所描述的程序:  

- 创建一个窗口, 上面有两个按钮 `btn_inc`, `btn_dec`, 刚刚开始分别显示 `Increase` 与 `Decrease`, 会加减初始值为零的数字  
- 按下 `btn_inc`, 则将数字加一, 随后在 `btn_dec` 上显示该数字  
- 按下 `btn_dec`, 则将数字减一, 随后在 `btn_inc` 上显示该数字  

我们已经成功实现了按下按钮后数字的加减, 并借由编译器之眼看到了危险, 利用标准库提供的类型, 让程序变得安全  
要做的下一步, 就是让某按钮被按下后, 在另一个按钮上显示当前的数值  

在本节开篇, 提及过Button的继承树: 它继承了GObject, 因此具有引用计数的特点, 相当于Rust中的 `Rc<T>`  
因此, 可以复用对付num的方法, 来对付 btn_inc 与 btn_dec, 直接clone, 然后使用被clone出来的这个变量  

但每次都需要手动clone, 创建新变量, 这是不是太麻烦了点?  
所幸 Gtk4 的开发人员, 已经为我们提供了一个过程宏, 专门化简手动clone的繁琐操作  

- - -

# clone!
Yeah, 这个宏的名字就叫clone: `glib::clone`, 你可以查看对应的文档: [glib::clone](https://docs.rs/glib/latest/glib/macro.clone.html)  
请务必注意use必须像下面这样写, 你得先 `use gtk::glib`, 随后 `use glib::clone`:  

```rust
use std::cell::Cell;
use std::rc::Rc;

use glib::clone;
use gtk::prelude::*;   // 这里
use gtk::{glib, Application, ApplicationWindow, Button, Orientation};  // 这里
```

如何使用这个宏呢?  如下, 明白怎么写就完事了, 还是蛮简单的:  

```rust
let num = Rc::new(Cell::new(0));
btn_inc.connect_clicked(clone!(@weak num, @strong btn_dec => move |_| {
    num.set(num.get() + 1);
    btn_dec.set_label(&num.get().to_string());
}));
btn_dec.connect_clicked(clone!(@strong btn_inc => move |_| {
    num.set(num.get() - 1);
    btn_inc.set_label(&num.get().to_string());
}));
```

使用 `clone!` 这个宏, 生成了变量的克隆值, 并指定该克隆到底是强引用(strong), 还是弱引用(weak)  
若是strong, 那自然可以直接使用, 毕竟一个Rc类型的变量, 只有强引用数归零时才会释放内存  
若是weak, 变量可能已经释放, 因此会尝试先升级到strong, 变量没死就升级成功, 不然直接从闭包返回  

懂了基础的原理后 ~~(我个人喜欢把读者当傻子, 因此尽量提一嘴)~~, 我们来看看上面这段代码:  

- 在第一个闭包中, num 的 weak-ref, 与 btn_dec 的 strong-ref 被创建  
而 num 的所有权被转移到第二个闭包中, 而该闭包的 lifetime 是 'static, 因此 weak-ref 一直可以升级并访问 num  

- 两个闭包中, 我们都创建了另一个按钮的 strong-ref  
我们获取了多所有权, 就像变量 num 一样, 只有单所有权时, 被move到闭包后的变量在之后会被使用, 编译报错, 如 btn_dec  

**注意:**  
`clone!`, 在尝试升级 weak-ref 时, 若升级失败, 闭包将直接提前返回一个可选值, 若可选值未指定, 则默认返回 `()` 值  
详情请见文档: [glib::clone](https://docs.rs/glib/latest/glib/macro.clone.html)  


至此, 已经顺利实现了功能, 但仍有个小问题, 那就是:  
循环引用导致内存泄漏!  

- - -

# 循环引用
Rust只保障内存安全, 不保障内存不泄漏, 让我们看看问题所在  
~~(大佬们可能一眼就看出来哪里循环引用了...)~~

贴一份刚刚的代码:  

```rust
let num = Rc::new(Cell::new(0));
btn_inc.connect_clicked(clone!(@weak num, @strong btn_dec => move |_| {
    num.set(num.get() + 1);
    btn_dec.set_label(&num.get().to_string());
}));
btn_dec.connect_clicked(clone!(@strong btn_inc => move |_| {
    num.set(num.get() - 1);
    btn_inc.set_label(&num.get().to_string());
}));
```

说起来也很简单, 那就是 btn_inc 产生了对 btn_dec 的 strong-ref, btn_dec 也产生了对 btn_inc 的 strong-ref  
两个 strong 互相指向, 导致每个变量的强引用的计数都至少是1, 永远不会归零, 永远不会释放内存  
这就是 `循环引用`

由于 `循环引用`, 一小块内存在整个程序运行期间, 永远得不到复用, 这就是 `内存泄漏`  

如何解决这个问题? 非常简单, 把 strong-ref 改成 weak-ref 不就Ok了? 下面是代码:  

```rust
let num = Rc::new(Cell::new(0));
btn_inc.connect_clicked(clone!(@weak num, @weak btn_dec => move |_| {
    num.set(num.get() + 1);
    btn_dec.set_label(&num.get().to_string());
}));
btn_dec.connect_clicked(clone!(@weak btn_inc => move |_| {
    num.set(num.get() - 1);
    btn_inc.set_label(&num.get().to_string());
}));
```

嘿! num 已经被移动到第二个闭包, 因此不用担心它, 现在来看看 `btn_inc`/`btn_dec`  
在闭包中, 对这两个btn都是弱引用, 当 `build_ui` 调用完毕后, 它们应该会自动drop掉 (因为作用域)  

但若改成 weak-ref, `btn_inc`/`btn_dec` 不会因缺少 strong-ref 而出现问题吗?  
答案是不会, 原因是以下两段代码  


- 第一段:  

```rust
let gtk_box = gtk::Box::builder()
    .orientation(Orientation::Vertical)
    .build();
gtk_box.append(&btn_inc);
gtk_box.append(&btn_dec);
```

- 第二段:  

```rust
let win = ApplicationWindow::builder()
    .application(app)
    .title("My Gtk App")
    .child(&gtk_box)
    .build();
win.present();
```

第一段中, `btn_inc`/`btn_dec` 的引用交给了 `append()`  
第二段中, `gtk_box` 的引用交给了 `child()`  

还记得我们已经强调过很多遍的事实吗? GObject 具有引用计数的特点, 而这些 Widget 都是其子类, 也具有该特性  
`append()`, `child()`, 都保持了对这些 Widget 的强引用, 保持了它们的活性:  
`gtk_box` 持有对 `btn` 的 strong-ref, `win` 持有对 `gtk_box` 的 strong-ref, 而 win (窗口), 一直显示着, 说明win一直活着  
win活着, 导致 gtk_box 也会活着, gtk_box 活着, 导致 btn 也会活着  

总而言之, 对待这些 Widget 时, 只需要尽可能地保持 weak-ref, 而对待自己的数据, 则需要多考虑一下, 仅此而已  
尽可能保持 weak-ref, 就能够避免循环引用而导致内存泄漏了!  

本节到此结束, 要鸽一会了, 我们下节见 :)

- - - 

上一篇: [p2~> 创建窗口](/posts/rust-gtk4/p2)  
下一篇: [p4~> GObject-子类化](/posts/rust-gtk4/p4)  
