+++
title = "rust-gui"
path = "categories/rust-gui"
date = 2021-12-04
template = "navigation.html"
+++

这里是关于用 rust 写 GUI 程序的索引  

# gtk4
gtk4 是 Linux 平台上推荐的选项, 说简单不至于, 但说稳与强大是不言而喻的  
而且 gtk4 近年开始发力, 基本现代化了, 不必因为是 C 语言写的就抱有太大偏见  

直接用 C 写确实繁琐, 但 gtk4 具有 `GObject Introspection` 的重要特性  
但 vala, swift, scala, nim, python, rust 等语言, 都拥有相应的 gtk 绑定  

得益于这些语言的高级特性与 [blueprint](https://jwestman.pages.gitlab.gnome.org/blueprint-compiler/) 这种专门为 gtk4 打造的现代 ui 描述文件来取代 xml, 表达力并不差  

- [x] [p1~> 系列说明](/posts/rust-gtk4/p1)
- [x] [p2~> 创建窗口](/posts/rust-gtk4/p2)
- [x] [p3~> GObject: 内存管理](/posts/rust-gtk4/p3)
- [x] [p4~> GObject: 子类化](/posts/rust-gtk4/p4)
- [x] [p5~> GObject: 通用类型](/posts/rust-gtk4/p5)
- [x] [p6~> GObject: 属性](/posts/rust-gtk4/p6)
- [x] [p7~> GObject: 信号](/posts/rust-gtk4/p7)
- [ ] [p8~> 主事件循环](/posts/rust-gtk4/p8)
- [ ] [p9~> 设置持久化](/posts/rust-gtk4/p9)

- - -

# relm4
基于 GTK4, 加上了 Elm 语言的模型, 可以看作是 gtk-rs 的语法糖版本, 甜了一个数量级

- - -

# egui
或许是 rust 目前所有 gui 框架中, 最简单易学的一个了!

- - -

# iced
Iced 使用 Elm 语言的模型, 很有趣, 且简单易学  
- [ ] [p1~> 系列说明](/posts/rust-iced/p1)
- [ ] [p2~> Elm式架构](/posts/rust-iced/p2)
- [ ] [p3~> 布局](/posts/rust-iced/p3)
- [ ] [p4~> 样式](/posts/rust-iced/p4)


