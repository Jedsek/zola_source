+++
title = "rust-gtk4-p6~> GObject-属性"
path = "posts/rust-gtk4/p6"
date = 2022-12-10
template = "page.html"
+++
> 本节将学习 GObject 的 property(属性), 探索其强大且灵活的运行时
<!-- more -->

同系列传送门: [rust-gui](/categories/rust-gui)  
GNOME入坑指南: [gnome](/posts/desktop-beautify/gnome)

# 说明  
属性(Property), 让我们能够访问 GObject 的状态(state)  

glib 虽然以面向过程的 C 为核心, 但却具有面向对象的思想, 属性自然是其中重要的一环  
通过库为我们提供的运行时, 我们得到了一个灵活的, 动态的运行时  

得益于此, 我们可以在程序的运行过程中, 动态地修改其属性, 比如:  
- 动态注册某个新的属性  
- 进行属性间的自动绑定  
- 属性变更时将执行操作 

- - -

# 常规使用

如下的代码是一个修改 `Switch` 部件的 `state` 属性, 并在下一行获取其值的例子:  
(记得use一下相关的路径, 这里为了简略就没有写出来, 本节之后的代码也是同理)  

<figcaption> src/main.rs </figcaption>

```rust
fn build_ui(app: &Application) {
    // Create the switch
    let switch = Switch::new();

    // Set and then immediately obtain state
    switch.set_state(true);
    let current_state = switch.state();

    // This prints: "The current state is true"
    println!("The current state is {}", current_state);
}
```

我们还可以用 `general-property` 来设置与获取属性, 与上一节的[通用类型](/posts/rust-gtk4/p5)相对应  
例子如下, 在获取属性时用 `turbofish` 语法来推导其类型:  

<figcaption> src/main.rs</figcaption>

```rust
fn build_ui(app_&Application) {
    // Create the switch
    let switch = Switch::new();

    // Set and then immediately obtain state
    switch.set_property("state", &true);
    let current_state = switch.property::<bool>("state");

    // This prints: "The current state is true"
    println!("The current state is {}", current_state);
}
```

如果属性不存在/类型不正确/属性不可写(无write权限)等, 都会导致 `property`/`set_property` 恐慌(panic), 在大部分如上的硬编码情况下是可行的  
同样的, 如果你想设置多个属性, 可以用 `properties`/`set_properties`  

现在已经不存在 `try_property`/`try_set_property`, 因为导致错误的情况, 只是仅为上一段所述的几种而已  
不过截止目前, 官方教程还没有更新, 我已经提交了一个pr  

值得注意的是, 当你使用这种以字符串的方式来访问属性时, 需要遵循 `kebab-case(烤肉串式)`, 比如 `user-name`, `person-age`  
在本节后面, 我们为自定义对象创建自定义属性时, 也需要遵循这种命名方式  

- - -

# 属性绑定

属性不仅可以通过 `getter`/`setter` 进行访问与修改, 还可以彼此进行绑定:  

<figcaption> src/main.rs </figcaption>

```rust
fn build_ui(app: &Application) {
    // Create the switches
    let switch_1 = Switch::new();
    let switch_2 = Switch::new();

    switch_1
        .bind_property("state", &switch_2, "state")
        .flags(BindingFlags::BIDIRECTIONAL)
        .build();
}
```

`bi-directional` 的意思是 `双向`, 我们在这里进行了双向绑定, `switch_1` 的 `state` 已经与 `switch_2` 的 `state` 绑在了一起  
于是, 两个 `switch` 的 `state` 属性会一直保持一样, 修改其中一个, 另外一个也会被自动修改  

如果你不添加任何 `BindingFlags`, 则为默认的 `BindingFlags::DEFAULT`, 作用是由源属性向目标属性进行更新  

可以看下来自官方教程的动图, 当我们切换其中一个按钮的状态时, 另外一个会自动保持相同:  

<video id="video" preload="auto" loop=true autoplay=true>
    <source id="webm" src="/images/rust/gtk4/bidirectional_switches.webm" type="video/webm">
</video>

- - -

# 为自定义对象添加属性

我们还可以为 `CustomObject` 添加属性, 以 [p4](/posts/rust-gtk4/p4) 中所讲述的 `CustomButton` 为例  
(没印象的赶紧再去看看, 毕竟本篇p6是写完p4好久后才更新的...当然如果你是未来来的, 不是追着看的话, 问题也不大, 那时本系列应该写完了, 吧?)  

我们为 `CustomButton` 实现 `ObjectImpl` 这个 trait, 覆写对应的虚函数:  

<figcaption> src/custom_button/imp.rs </figcaption>

```rust
// Trait shared by all GObjects
impl ObjectImpl for CustomButton {
    fn properties() -> &'static [ParamSpec] {
        static PROPERTIES: Lazy<Vec<ParamSpec>> =
            Lazy::new(|| vec![ParamSpecInt::builder("number").build()]);
        PROPERTIES.as_ref()
    }
    fn set_property(&self, _id: usize, value: &Value, pspec: &ParamSpec) {
        match pspec.name() {
            "number" => {
                let input_number =
                    value.get().expect("The value needs to be of type `i32`.");
                self.number.replace(input_number);
            }
            _ => unimplemented!(),
        }
    }
    fn property(&self, _id: usize, pspec: &ParamSpec) -> Value {
        match pspec.name() {
            "number" => self.number.get().to_value(),
            _ => unimplemented!(),
        }
    }
    fn constructed(&self) {
        self.parent_constructed();

        // Bind label to number
        // `SYNC_CREATE` ensures that the label will be immediately set
        let obj = self.obj();
        obj.bind_property("number", obj.as_ref(), "label")
            .flags(BindingFlags::SYNC_CREATE)
            .build();
    }
}
```

看见 `fn properties` 里面的 `Lazy` 没有? 这是为了延迟创建资源的过程  
每次访问都会检查是否已经创建了资源, 没有的话就调用闭包进行创建并访问, 不然就直接访问已经创建好的资源  
这样就能避免每一次调用 `properties` 时都需要重新创建资源了  

当然, rust-analyzer 可能无法为你导入 `Lazy` 所在的路径, 因为它可能还没有进标准库  
在它进标准库之前, 可以使用 `once_cell` crate:  

在项目的根目录执行:  

```bash
cargo add once_cell
```

你会看见 `ParamSpec` 这样的类型, 其来自于 `glib`, 按照相应的 [文档](https://gtk-rs.org/gtk-rs-core/stable/latest/docs/glib/struct.ParamSpec.html) 所述, 是一个struct, 封装了指定参数所需的元数据  
如果将C语言的描述, 换成了看起来稍微轻松一些的rust版本, 它差不多长这样:  

```rust
struct ParamSpec<'a> {
    name: &'a str,             // 属性的名称, 按照 `kebab-case`
    flags: glib::ParamFlags,   // 比如读写权限
    value_type: glib::Type,    // 属性对应值的类型
    owner_type: glib::Type     // 属性所有者的类型
    // more
    // more
}
```

比如代码中出现的 `ParamSpecInt`, 就是基于 `ParamSpec` 的基础上, 指定了 `value_type`  

接下来讲 `fn constructed`:  
其中出现了 `BindingFlags::SYNC_CREATE`, 它的作用是, 当创建绑定时会进行一次同步, 方向是 form 源属性 to 目标属性, 作用类似于初始化  
而之前的 `BindingFlags::BIDIRECTIONAL` 则是当源或目标属性中的一个发生更改时, 才进行同步  

更多的flags, 自己去看 [文档](https://gtk-rs.org/gtk-rs-core/stable/latest/docs/glib/struct.BindingFlags.html)

这几处讲完, 其外的代码就不讲了, 可以当作模板来使用  

敏锐的小伙伴会注意到, `number` 与 `label`, 这两个属性的类型好像不相等吧?  
之前的 [p4](/posts/rust-gtk4/p4) 里, 可不是这样写的, 没错, 属性与属性的绑定, 其值的类型并不一定要是同类型!  

下面是对比, 两种写法实现了相同的功能, 将 `number` 字符串化之后, 当作按钮的 `label`:  

<figcaption>  src/custom_button/imp.rs </figcaption>

```rust
impl ObjectImpl for CustomButton {
    // p4:
    fn constructed(&self) {
        self.parent_constructed();
        self.obj().set_label(&self.number.get().to_string());
    }

    // p6:
    fn constructed(&self) {
        self.parent_constructed();

        let obj = self.obj();
        obj.bind_property("number", obj.as_ref(), "label")
            .flags(BindingFlags::SYNC_CREATE)
            .build();
}
```

- 前一种写法中:  
你需要自己手动 `get` 内部值, 手动字符串化, 然后当作参数赋给 `set_label`  
其实这没什么大不了, 关键是你每一次修改 `number`, 都必须记得要同时修改 `label`, 进行重复性的工作

- 后一种写法中:  
通过绑定属性, 类型间的转化自动进行, 而且写法上更加清晰易懂 (`SYNC_CREATE` 显式地声明了目的)  
于此同时, 当你修改 `number` 属性的值时, `label` 会自动适应, 你只需关注 `number` 即可 

让我们继续, 接下来重载按钮被点击时的行为:  


<figcaption>  src/custom_button/imp.rs </figcaption>

```rust
// Trait shared by all buttons
impl ButtonImpl for CustomButton {
    fn clicked(&self) {
        let number_inc = self.number.get() + 1;
        self.obj().set_property("number", &number_inc);
    }
}
```

瞧, 得益于属性绑定, 你只需修改 `number` 属性的值即可, 不必再重复地添加令人生厌的模板代码, 去手动修改 `label` 了  

- - -

# 控制属性绑定的方向
接下来, 我们来完成这样一件事: 创建两个按钮, btn_1 初始为零, btn_2 始终比 btn_1 高一, 某个按钮被点击后, 其数值加一  
其效果如动图所示:  

<video id="video" preload="auto" loop=true autoplay=true>
    <source id="webm" src="/images/rust/gtk4/transform_buttons.webm" type="video/webm">
</video>

这两个按钮的 `number` 属性, 互相之间存在关联, 你可能会想到属性绑定, 没错, 不过相较于之间 `number` to `label` 的例子, 此处粒度会更细:  
直接看代码:  

<figcaption> src/main.rs </figcaption>

```rust
fn build_ui(app: &Application) {
    // Create the buttons
    let btn_1 = Custombtn::new();
    let btn_2 = Custombtn::new();

    // Assure that "number" of `btn_2` is always 1 higher than "number" of `btn_1`
    btn_1
        .bind_property("number", &btn_2, "number")
        // How to transform "number" from `btn_1` to "number" of `btn_2`
        .transform_to(|_, number: i32| {
            let incremented_number = number + 1;
            Some(incremented_number.to_value())
        })
        // How to transform "number" from `btn_2` to "number" of `btn_1`
        .transform_from(|_, number: i32| {
            let decremented_number = number - 1;
            Some(decremented_number.to_value())
        })
        .flags(BindingFlags::BIDIRECTIONAL | BindingFlags::SYNC_CREATE)
        .build();
}
```

代码很好理解, `transform_to` 定义了从源属性到目标属性的动作, `transform_from` 则是方向相反  

同时, `BIDIRECTIONAL | SYNC_CREATE` 则分别声明了双向与初始化:
  
- 双向: 由于 `BIDIRECTIONAL`, 其中一个发生被click, 数值发生改变后会按照对应方向对应的闭包, 更新另一个
- 初始化: 立刻进行一次更新, 方向是to

- - -

# 属性更改事件

你可以在属性发生更改时, 执行一个闭包, 比如:  


<figcaption> src/main.rs</figcaption>

```rust
    btn_1.connect_notify_local(Some("number"), move |btn, _| {
        let number = btn.property::<i32>("number");
        println!("The current number of `btn_1` is {}.", number);
    });
```

当 `number` 属性的值发生更改后, 会在标准输出中, 打印按钮当前显示的数值  

- - -

上一篇: [p5~> GObject-通用属性](/posts/rust-gtk4/p5)  
下一篇: [p7~> GObject-信号](/posts/rust-gtk4/p7)  
