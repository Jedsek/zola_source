+++
title = "rust-gtk4-p4~> GObject-子类化"
path = "posts/rust-gtk4/p4"
date = 2022-10-09
template = "page.html"
+++
> 本节将学习如何使用子类化(Subclassing), 从而定制自己的 Widget
<!-- more -->

同系列传送门: [rust-gui](/categories/rust-gui)  
GNOME入坑指南: [gnome](/posts/desktop-beautify/gnome)

# 目录结构
gtk 基于 glib, 而 glib 最让人印象深刻的地方, 又是其 `Gobject System`  
众所周知, C 是一套面向过程的语言, 但基于 C 的 glib库, 却通过高超的思想, 提供了面向对象的支持  

在这样一个面向对象, 依赖继承的体系中, 我们可以通过子类化(Subclassing)来创建新的自定义的 GObject  
让我们保持这样子的目录结构:  

```txt
src
├── custom_button
│   ├── imp.rs
│   └── mod.rs
└── main.rs
```

在 glib 中, 我们将通过创建两个结构体来创建一个子类  
我们将会创建一个新的 GObject, 通过继承成为 `gtk::Button` 的子类, 以此添加一些自定义的功能  

- - -

# 子类化

如上面的目录结构所示, 我们定义了一个叫 `custom_button` 的模块, 在 `mod.rs` 中将 `CustomButton` 暴露给外部  
其实这就是 C 语言中实现子类化的模板, 我们将遵循这个规则, 通过定义两个 struct 来描述子类:  

- `imp.rs` 被用来存储自定义的状态, 存储继承自父类待 override 的虚函数  
- `custom_button::imp` 是私有模块, `custom_button::imp::CustomButton` 也是私有的  
- `custom_button::imp::CustomButton` 将被暴露给外界的 `custom_button::CustomButton` 使用, 作为其养料

简单来说, 我们正在利用模块, 对子类化的 GObject 的功能进行分门别类, 让其定义更加清晰罢了  

下面是具体代码, 直接抄书:  

<figcaption> src/custom_button/imp.rs </figcaption>

```rust
use gtk::glib;
use gtk::subclass::prelude::*;

// Object holding the state
#[derive(Default)]
pub struct CustomButton;

// The central trait for subclassing a GObject
#[glib::object_subclass]
impl ObjectSubclass for CustomButton {
    const NAME: &'static str = "MyGtkAppCustomButton";
    type Type = super::CustomButton;
    type ParentType = gtk::Button;
}

// Trait shared by all GObjects
impl ObjectImpl for CustomButton {}

// Trait shared by all widgets
impl WidgetImpl for CustomButton {}

// Trait shared by all buttons
impl ButtonImpl for CustomButton {}
```

先前也说了, 模块 `imp.rs` 的作用便是描述一个子类, 负责新添加的状态与待覆写的虚函数  
对于某个子类 GObject 的描述, 在 `ObjectSubclass` 中:  
- `NAME`: 该 GObject 的名字  
- `Type`: 指之后将被创建的, 实际的 GObject  
- `ParentType`: 我们继承的那个父类 GObject  

你可能会疑惑, 这个 `Name` 与 `Type` 是什么鬼, 就不能直接用 `Type (我们在Rust中实际创建的类型)` 作为 `NAME` 吗?  

别忘了, gtk 是一套跨语言的通用 GUI 框架, 拥有几十种语言的绑定, 设计必然不能拘泥在一种语言上  
不同语言自有不同命名规范, 必然得先统一风格, 比如之后会学习的 `.ui` 为后缀的 xml 文件, 可以用来描述界面, 不管哪个语言都是通用的  

因此, `NAME` 是用来描述其名字, 是统一的, 为避免命名冲突, 应使用 crate-name 与 object-name 组成 (UpperCamelCase)  
而 `Type/ParentType` 则是特定于语言的某个具体类型, 此处是Rust中的 `CustomButton`/`gtk::Button`  

再提一嘴, 之后将学习的以 `.ui` 为后缀的 xml 文件, 可以创建 GtkBuilder template class(模板类), 像下面这样去描述界面:  

```xml
<?xml version="1.0" encoding="UTF-8"?>
<interface>
  <template class="GtkAppWindow" parent="GtkApplicationWindow">
    <property name="title">My GTK App</property>
    <child>
      <!-- 此处使用 `CustomButton` 指定 widget 的类型 -->
      <object class="CustomButton" id="button_1">
        <property name="label">Press me!</property>
        <property name="margin-top">12</property>
        <property name="margin-bottom">12</property>
        <property name="margin-start">12</property>
        <property name="margin-end">12</property>  
      </object>
    </child>
  </template>
</interface>
```



你可能还会在之后对 gtk 框架的一些地方感到疑惑, 因此请记住: gtk 是一套通用的 gui 框架, 不止是为一种语言服务的  

接下来是将暴露给外界的 `CustomButton`:  

<figcaption> src/custom_button/mod.rs </figcaption>

```rust
mod imp;

use glib::Object;
use gtk::glib;

glib::wrapper! {
    pub struct CustomButton(ObjectSubclass<imp::CustomButton>)
        @extends gtk::Button, gtk::Widget,
        @implements gtk::Accessible, gtk::Actionable, gtk::Buildable, gtk::ConstraintTarget;
}

impl CustomButton {
    pub fn with_label(label: &str) -> Self {
        Object::new(&[("label", &label)])
    }
}
```

`glib::wrapper!` 顾名思义, 能帮我们将 `imp::CustomButton` 进行包装, 自动生成相关实现, 避免大量样例代码, 我们只需指明其继承情况即可:  
- `@extends`: 指明所有父类 GObject
- `@implements`: 指明所有实现的 Interface (在 Rust 中是 Trait)
- `imp::CustomButton`: 经过宏成为了被暴露的 `CustomButton` 的 inner 成员
- `with_label`: 添加了自己的将被暴露的新方法, 设置了 GObject 的 property (`Object::new` 的返回值是泛型, 此处会自动推导为 `Self`)

我们可以通过 [docs/gtk/hierarchy](https://docs.gtk.org/gtk4/class.Button.html#hierarchy) 来查看某个 GObject 的继承链情况  

现在, `CustomButton` 实际上已经与 `gtk::Button` 一样了, 因此我们可以直接用其替换 `Button`:  

<figcaption> src/main.rs </figcaption>

```rust
mod custom_button;

use custom_button::CustomButton;
use gtk::prelude::*;
use gtk::{Application, ApplicationWindow};

const APP_ID: &str = "xyz.jedsek.myapp";

fn main() {
    let app = Application::builder().application_id(APP_ID).build();
    app.connect_activate(build_ui);
    app.run();
}

fn build_ui(app: &Application) {
    let button = CustomButton::with_label("Press me!");
    button.set_margin_top(12);
    button.set_margin_bottom(12);
    button.set_margin_start(12);
    button.set_margin_end(12);

    let window = ApplicationWindow::builder()
        .application(app)
        .title("My GTK App")
        .child(&button)
        .build();

    window.present();
}
```

执行 `mold -run cargo run`, 你会见识一模一样的效果 :)  

- - -

# 自定义
没错, 这还不够, 如果费劲心思搞出来的子类只是和父类一般, 那就没必要搞了, 很简单的道理不是吗?  
令人兴奋的是, 我们还可以保存状态, 覆写虚函数!  

下面是例子, 直接抄书, 我们将只覆写其中两个虚函数:  

<figcaption> src/custom_button/imp.rs </figcaption>

```rust
use std::cell::Cell;

use gtk::glib;
use gtk::prelude::*;
use gtk::subclass::prelude::*;

// Object holding the state
#[derive(Default)]
pub struct CustomButton {
    number: Cell<i32>,
}

// The central trait for subclassing a GObject
#[glib::object_subclass]
impl ObjectSubclass for CustomButton {
    const NAME: &'static str = "MyGtkAppCustomButton";
    type Type = super::CustomButton;
    type ParentType = gtk::Button;
}

// Trait shared by all GObjects
impl ObjectImpl for CustomButton {
    fn constructed(&self) {
        self.parent_constructed();
        self.obj().set_label(&self.number.get().to_string());
    }
}

// Trait shared by all widgets
impl WidgetImpl for CustomButton {}

// Trait shared by all buttons
impl ButtonImpl for CustomButton {
    fn clicked(&self) {
        self.number.set(self.number.get() + 1);
        self.obj().set_label(&self.number.get().to_string())
    }
}
```

我们为 `imp::CustomButton` 添加了一个状态, 也就是其成员 `number`, 随后覆写了两个虚函数  
(覆写构造函数时, 还得记得调用一下父类的构造函数, 完成整个构造链)  

在被覆写的函数中, 我们都调用了 `self.obj()`, 你可以观察一下其签名:  

<figcaption glib::subclass::types::obj> </figcaption>

```rust
fn obj(&self) -> crate::BorrowedObject<Self::Type>
```

还记得 `Self::Type` 是什么吗? 没错, 就是被暴露的那个 `CustomButton`, 而非 `imp::CustomButton`, 它才是被使用的真正实例(instance)  
此处的 `obj()` 方法, 其别名就是 `instance()`, 得到的是在 `main.rs` 中被创建的那个真正实例的引用  

总而言之, 我们的所谓 `子类化`, 在rust中其实就是一个 warpper, 包装了一个来自gtk的部件  
随后通过实现诸如 `ObjectImpl` 之类的 trait, 修改了父部件原本的行为  

顺便再复习一下, 防止有人看见这里而感疑惑: 为什么是 `clicked(&self)` 而非 `clicked(&mut self)`, 这样不应该更方便吗?  
这是因为每个 GObject 都是引用计数的, 所以能绕过编译器的检查(全是不可变借用), 之前提到过了  

经过覆写虚函数, `CustomButton` 终于出现了有别于父类 `Button` 的新特性:  
- 被构造时: 初始化 label 为自己存储的状态数字  
- 被点击时: 会让存储的状态数字+1, 随后更新 label

现在调用 `mold -run cargo run`, 你将得到一个按钮, 按钮的 label 初始时为 0, 被点击后不断+1  

- - -

# 使用情况
什么情况下适合使用 `glib::wrapper` 来模拟继承呢 (Rust 语言层面上不支持继承, 因此叫模拟)  

- 使用一个 widget, 其添加了自定义状态与覆写虚函数
- 将 Rust 对象传递给要求参数是 GObject 的函数 (因为 gtk 不只是 Rust 的GUI框架, 还是其他许多语言的 GUI 框架)
- 为某个对象添加 property 或 signal, 继承 glib 体系下的强大力量 (下面几节会讲)  

- - -

上一篇: [p3~> 创建窗口](/posts/rust-gtk4/p3)  
下一篇: [p5~> GObject-通用类型](/posts/rust-gtk4/p5)  
