+++
title = "rust-gtk4-p7~> GObject-信号"
path = "posts/rust-gtk4/p7"
date = 2022-12-10
template = "page.html"
+++
> 本节将学习 GObject 的 signal(信号)
<!-- more -->

同系列传送门: [rust-gui](/categories/rust-gui)  
GNOME入坑指南: [gnome](/posts/desktop-beautify/gnome)

# 说明
本节难度较小, 如果你已经掌握了之前的属性一章, 那么本节将会有非常多的相似之处  

`GObject` 的信号(signal), 是一套为特定事件注册回调函数的系统  
例如, 当点击按钮时, `clicked` 信号被 发射(emit), 为 `clicked` 信号注册的回调函数会执行  

代码如下:  

```rust
// Connect to "clicked" signal of `button`
button.connect_clicked(|button| {
    // Set the label to "Hello World!" after the button has been clicked on
    button.set_label("Hello World!");
});
```

或者这样, 类似于使用属性, 可以处理自定义信号:  

```rust
// Connect to "clicked" signal of `button`
button.connect_closure(
    "clicked",
    false,
    closure_local!(move |button: Button| {
        // Set the label to "Hello World!" after the button has been clicked on
        button.set_label("Hello World!");
    }),
);
```

这里的 `false` 表示该回调在默认处理程序之后调用，否则在之前调用  

- - -

# 为自定义对象添加信号

直接上代码:  

<figcaption> src/custom_button/imp.rs </figcaption>

```rust
// Trait shared by all GObjects
impl ObjectImpl for CustomButton {
    fn signals() -> &'static [Signal] {
        static SIGNALS: Lazy<Vec<Signal>> = Lazy::new(|| {
            vec![Signal::builder("max-number-reached")
                .param_types([i32::static_type()])
                .build()]
        });
        SIGNALS.as_ref()
    }
```

我们为 `CustomButton` 注册了自定义信号, 叫作 `max-number-reached`, 当 发射(emit) 时, 发射一个类型为 i32 的数值  
与命名属性时的规则一样, 我们应该遵循 `kebab-case`  

让我们继续, 接下来自定义被点击时的行为, 我们让按钮被点击, 数值达到某个规定的最大值时, 发送该信号:  

<figcaption> src/custom_button/imp.rs </figcaption>

```rust
static MAX_NUMBER: i32 = 8;

// Trait shared by all buttons
impl ButtonImpl for CustomButton {
    fn clicked(&self) {
        let incremented_number = self.number.get() + 1;
        let obj = self.obj();
        // If `number` reached `MAX_NUMBER`,
        // emit "max-number-reached" signal and set `number` back to 0
        if incremented_number == MAX_NUMBER {
            obj.emit_by_name::<()>("max-number-reached", &[&incremented_number]);
            obj.set_property("number", &0);
        } else {
            obj.set_property("number", &incremented_number);
        }
    }
}
```

点击按钮, 数值加一, 直到最大, 发射信号, 然后归零 ~~(好湿好湿!)~~  

现在，你已经知道如何连接信号, 自定义信号  
如果您想通知 GObject 的使用者, 某个事件已经发生，那么自定义信号特别有用

- - - 

上一篇: [p6~> GObject-属性](/posts/rust-gtk4/p6)  
下一篇: [p8~> GObject-主事件循环](/posts/rust-gtk4/p8)  
