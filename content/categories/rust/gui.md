+++
title = "rust-gui"
path = "categories/rust-gui"
date = 2021-12-04
template = "navigation.html"
+++

这里是关于用 rust 写 GUI 程序的索引  
以下仅代表一些我个人比较喜欢的gui框架, 不要问我为什么没有 `xxx`  

# gtk4/relm4

gtk4:  

gtk4 是 linux 上的首选之一, 稳健与强大不言而喻, 且近年开始发力, 做到了基本现代化  
直接用 c 写确实繁琐, 但其具有 `gobject-introspection` 的重要特性, 因此各种语言都能拥有相应绑定  
得益于这些语言的高级特性, 加上 [blueprint](https://jwestman.pages.gitlab.gnome.org/blueprint-compiler/) 这种专门为其打造的现代 ui 声明式描述文件(取代 xml), 表达力并不算差  


- [x] [p1~> 系列说明](/posts/rust-gtk4/p1)
- [x] [p2~> 创建窗口](/posts/rust-gtk4/p2)
- [x] [p3~> GObject-内存管理](/posts/rust-gtk4/p3)
- [x] [p4~> GObject-子类化](/posts/rust-gtk4/p4)
- [x] [p5~> GObject-通用类型](/posts/rust-gtk4/p5)
- [x] [p6~> GObject-属性](/posts/rust-gtk4/p6)
- [x] [p7~> GObject-信号](/posts/rust-gtk4/p7)
- [ ] [p8~> 主事件循环](/posts/rust-gtk4/p8)
- [ ] [p9~> 设置持久化](/posts/rust-gtk4/p9)

relm4:  

基于 gtk4, 加上了 elm 语言的模型, 可以看作是 gtk-rs 的语法糖版本, 甜了一个数量级  

- - -

# iced
iced 使用 Elm 语言的模型, 是原生 rust 编写的 gui 库, 非常有趣, 简单易学, 强烈推荐 (虽然生态还没起来)  
其已被 pop-os 用于编写 cosmic-de, 对标 gnome, 证明了其编写大型工程的能力, 最关键的是: 那些工程师们的审美是一直在线的   

  

- [ ] [p1~> 系列说明](/posts/rust-iced/p1)
- [ ] [p2~> Elm式架构](/posts/rust-iced/p2)
- [ ] [p3~> 布局](/posts/rust-iced/p3)
- [ ] [p4~> 样式](/posts/rust-iced/p4)


- - -

# egui
在 rust 目前原生的 gui 库中, 比较简单易学, 且生态相对较为丰富, 对 web 端支持较为完善  
但由于即时渲染模式的固有问题, 在界面布局等存在问题, 且需要人为地将每次 update 时的渲染开销进行控制与优化  




