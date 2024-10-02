+++
title = "rust-terminal-p1~> 跨平台的现代终端alacritty"
path = "posts/rust-terminal-world/p1"
date = "2024-01-28"
template = "page.html"
+++
> 本节将介绍 alacritty && wezterm 两个 rust 开发的现代跨平台终端
<!-- more -->

同系列传送门: [rust-terminal-world](/categories/rust-terminal-world)

# 介绍
有许多终端可供你选择, 比如 windows 上的 windows terminal, 再比如 linux 上的 kitty, 不过它们并不跨平台(linux, windows, macos)  
而且它们的功能也都很强大, 跨平台真的有这么重要吗?  
~~(, 这不是废话吗, 跨平台的话受众也会广啊, 而且统一)~~, 我后面介绍的一个工具也都是跨平台的, 所以干脆关于终端也开了一p, 仅此而已

有 2 个用 rust 开发的现代跨平台终端是我个人比较推荐的:

- alacritty: 专注于速度, 最快
- wezterm: 专注于特性, 最友好

我个人是使用了 alacritty, 因为可以和后面的 zellij 搭配在一起, 做出许多炫酷的事情, 但如果你对此不感兴趣, wezterm也是一个好选择  

alacritty 确实相当快, github上放言要是benchmark不是第一就请去提issue, 但代价则是一些特性, 比如连体字(ligature), 终端图像显示, 多标签等的不支持  
但是相当稳定, 而且开发也很迅猛, bug修复快

wezterm 非常友善, bug 很多, 有比较大的性能问题, 毕竟支持的特性很多, 新特性的开发也很快, 支持连体字, 图片显示, 多标签等  
我个人用了相当长的时间, 但现在还是切回了 alacritty + zellij的组合

说句题外话, 不用觉得 alacritty 的开发者太固执不愿意支持连体字, 不用认为明明已经有支持连体字的fork为什么不合并, 人家也考虑过, 但字体渲染这一块确实很复杂  
原话是: "你就这么想用一个虽然支持连体字, 但是代码质量差且性能低下的fork吗?", 虽然刺耳与攻击性强了一点, 但确实是这个理  

里面也提到过诸如多标签这种事情, 可以交给窗口管理器或者多路复用器, 也就是我目前使用的 alacritty+zellij 组合  
因为 zellij 的自定义程度相当高, 包括布局, 美化啥的, 但初次启动加载时会耗费一段时长  
如果基于本来就很快的 alacritty, 启动速度会稍微好一点 (在我电脑上还是比 wezterm 快一点)

我也在系列开口就提过了, 这些章节充满个人喜好, 因为我目前使用 alacritty+zellij, 所以就暂且只介绍它们, 如果切到其他的也会实时更新滴 ~~

- - -

# 配置

懒得说, 建议自己去看官网的 [guide](https://alacritty.org/config-alacritty.html), 我贴一下配置文件, 意思是不言自喻的:  


<figcaption> ~/.config/alacritty/alacritty.toml </figcaption>

```toml
import = [
  "~/.config/alacritty/themes/nord.toml",
]


# 注意，必须设置default shell, 启动zellij, 而不是启动nu再启动zellij
[shell]
program = "zellij"
args = [
  "options",
  "--default-shell",
  "nu"
]

[window]
decorations = "None"
padding = { x = 4, y = 0 }
opacity = 0.94
blur = false 
startup_mode = "Windowed"

[font]
normal = { family = "JetBrainsMono Nerd Font"}
size = 13

[mouse]
hide_when_typing = true
```

<figcaption class="fold-close"> ~/.config/alacritty/themes/nord.toml </figcaption>

```toml
[colors.primary]
foreground = "#d8dee9"
background = "#2e3440"
dim_foreground = "#a5abb6"

[colors.cursor]
text = "#2e3440"
cursor = "#d8dee9"

[colors.vi_mode_cursor]
text = "#2e3440"
cursor = "#d8dee9"

[colors.search.matches]
foreground = "CellBackground"
background = "#88c0d0"

[colors.search.focused_match]
foreground = "#d8dee9"
background = "#434c5e"

[colors.bright]
black = "#4c566a"
blue = "#81a1c1"
cyan = "#8fbcbb"
green = "#a3be8c"
magenta = "#b48ead"
red = "#bf616a"
white = "#eceff4"
yellow = "#ebcb8b"

[colors.dim]
black = "#373e4d"
blue = "#68809a"
cyan = "#6d96a5"
green = "#809575"
magenta = "#8c738c"
red = "#94545d"
white = "#aeb3bb"
yellow = "#b29e75"

[colors.normal]
black = "#3b4252"
blue = "#81a1c1"
cyan = "#88c0d0"
green = "#a3be8c"
magenta = "#b48ead"
red = "#bf616a"
white = "#e5e9f0"
yellow = "#ebcb8b"


[colors.selection]
background = "#4c566a"
text = "CellForeground"
```

- - -

# 字体
要注意一下, 那就是请配置一款 nerd-font的字体, 可以在终端上显示相当多的图标, 在之后使用终端上的文件管理器的时候, 或者编辑代码时用于美化, 比较重要 a 
可以去 [nerdfonts](https://www.nerdfonts.com/) 下载对应的字体, 寻找你想要的图标

- - -

# 展示

透明啊模糊啊啥的都给加上, 终端上面再自定义个状态栏(zellij的插件), 就酱

![写zelliji插件时的真实场景](/images/rust/terminal-world/alacritty-1.webp#w90)
