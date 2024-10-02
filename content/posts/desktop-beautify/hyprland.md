+++
title = "hyprland 平铺式"
path =  "posts/desktop-beautify/hyprland"
date = "2022-12-10"
template = "page.html"
+++
> linux/wayland 下的炫酷窗管/混合器: hyprland, 拥有丰富的特性集, 适合追求高度自由与极致性能的用户
<!-- more -->

# 开篇与真香宣言

<details class="border-2 p-2 mt-2 mb-2">
  <summary><del>来自2022年12月10日的真香警告, 原文一字未改</del></summary>
呼呼哈哈哈哈哈哈哈爷现在还在 GNOME 的怀抱~~  
等哪一天爷看 GNOME 不顺眼了再回来补完此篇吧, 抱歉了  


**注意:**  
**以下内容是因为我现在还在GNOME**  
**~~(那一天我换回 Hyprland 了, 可能就是另外一番语调了)~~**  
而且, 都已经 2023 了, GNOME 是真 TMD 香啊, 虽然自定义这一块不如 Hyprland/Sway, 但太省心了, 不用自己写窗口规则  
而且安装平铺式是为了什么? 为了高度的自定义, 窗口修饰的自定义, 快捷键的自定义, 窗口位置等自定义 ~~(还有装逼)~~  

但我用了 Hyprland/Sway 那么久, 最后发现, 我最需要的其实是快捷键的自定义  
像工作区切换的快捷键, Super+1, Super+2, 移动窗口到指定工作区的快捷键, Super+Shift+1 这种  
像靠快捷键来 fullscreen, maximum-window, hide-winow 这些也并不是平铺式的特权  
像平铺式管理窗口, 也并不是 Hyprland 等窗管的专属功能, KDE/GNOME 等成熟 DE 里也就一个插件的事情 (比如pop-os)  

还有最关键的一点, 那就是用 DE 是真的专注于学习, 换成 Hyprland/Sway 之后就是天天改配置, 抄配置, 自己写脚本, 写 rules  
大可不必, 真的  

如果你想专注于工作, 请选择一一个成熟的, 比如 KDE/GNOME, 而且这俩还都是可以高度自定义的家伙, 真想酷炫起来并不比平铺式差  
如果你追求极致到极致的高度自定义, 每一个窗口的位置/大小/是否浮动/边框/名字等等都需要自定义, 那么平铺式就是你的配菜  

但后者绝对会耗费比前者多上好几倍好几倍的时间, 而且平铺式这种玩意吧, 本来就是高度自定义的东西  
如果你真的是直接copy别人的配置, 体验会完全不一样的, 这玩意就需要自己根据自己的情况来调整  
哪怕有大佬维护着类似 SwayDe 这样的玩意, 那也只是照顾了一部分审美与习惯正好差不多的人  

我选择了专注于工作, 真的, 我也折腾过很久平铺式, 最后发现还是 GNOME 香  
下面是我当前用的 GNOME 的一份图片:  
![gnome-44](/images/gnome/overview_44_wave_dark_wallpaper.webp)

但是这个 Overview 功能, Hyprland 想折腾就得自己写插件, 或者让别人写插件......  
简单来说, 想高度自定义就用 Hyprlnd, 懒人就用 KDE/GNOME  

</details>


**注意:**  
本文的配置思路同时也适用于其他类似的 window-manager, 诸如 sway/river/bspwm/awesome  
本文提供了一些简单但已足够好用的配置, 你可以根据需要自己进行修改  
还有, hyprland 的环境是 wayland, 而非 x11  


Hyprland 真 tmd 好用啊, 米娜桑, 快点来跟我一起用 hyprland 吧!  
配置 hyprland 可以让你对桌面进行高度自定义, 比如:  

- 快捷键(甚至支持将全局键转发给局部程序)
- 状态栏
- 桌面壁纸
- 桌面小部件
- 消息通知
- 动画效果 
- 窗口边框
- 明暗主题
- 锁屏界面
- 应用启动器
- 取色器
- ......(太多啦!)

让我们开始吧!  

本文相关的代码, 为方便大家复制粘贴, 会全部贴出来, 行数太多的会默认隐藏, 你可以点击代码块的右上角进行展开  
代码同时也放在了 [github仓库](https://github.com) 中, 请随意使用

- - -

# 本体安装

在前面说过, 本文的思路可以适用于其他类似的窗管, 比如 sway  
因为达成最后的强大效果靠的不仅是 hyprland 自己, 还有各种各样的其他程序  

比如 hyprland 自己是不带状态栏的, 状态栏依靠另外一些程序来提供, 即使换了个窗管, 依旧可以复用这份生态  
当然, hyprland 相较于其他的窗管, 其特点就是简单, 强大, 酷炫(动画效果多)  

为了安装 hyprland, 你可以参考 [官方wiki](https://wiki.hyprland.org/Getting-Started/Installation/)  
本人目前在用的是 archlinux, 因为你都想高度自定义了, 肯定得安装很多应用, 而且最好是最新的, 防止一些奇怪的bug  
用其他发行版, 到时候还得一个个 git clone 下来, 手动安装依赖, 手动编译, 会很痛苦的 ~~(别问我为什么这么清楚)~~  
当然, 你也可以用诸如 nixos 这种, 不然即使是 opensuse 这种也是滚动更新的照样会让人不爽, 当然用起来肯定是 arch 又爽又简单  

因为我已经添加了 archlinuxcn 的源, 我可以直接:  

```bash
paru -S archlinuxcn/hyprland-git
# paru -S aur/hyprland-git
```

下载成功后, 你应该会得到两个命令: `Hyprland(大写字母开头)`, `hyprctl`, 可以通过以下命令查看版本:  

<figcaption> hyprctl version </figcaption>  

```bash
Hyprland, built from branch  at commit 1b48642fd15c433c53876f1b933dcd46265caf8f dirty ().
Tag: v0.32.3

flags: (if any)
```

hyprland  默认以 kitty 作为启动终端, 所以你可以再下一个 kitty, 本人是 wezterm, 都差不多  
当你下载好之后, 你可以在诸如 GNOME 的 GDM, 或 KDE 的 KDM 等桌面管理器中, 找到名为 Hyprland 的条目(entry)  

桌面管理器(Desktop manager), 故名思意, 指管理你不同桌面环境(GUI)的管理器  
如果你用的是 GNOME 等, 开机之后进入的第一次 "选择用户, 输入密码" 的地方就是 DM 了, 通过角落的小齿轮选择不同桌面环境  


- - - 

# 配置架构
当你在 DM 中选择了 Hyprland, 并输入密码敲下回车并进入桌面环境之后, 你会发现一个空无一物的世界(可能有个默认壁纸)  
最顶部有个无比刺眼的框框会提醒你, 告诉你这是自动生成的配置文件, 还告诉了 terminal 与 logout 的默认快捷键  



hyprland 的配置文件是 `~/.config/hypr/hyprland.conf`, 我们可以在其中导入多个配置文件来划分功能层级:  

<figcaption> tree ~/.config/hypr/ -L 2 </figcaption>

```bash
~/.config/hypr/
├── env.conf
├── hyprland.conf
├── keybindings.conf
├── scripts
│   ├── color-picker.sh
│   ├── idle.sh
│   ├── launcher.sh
│   ├── light.sh
│   ├── lock.sh
│   ├── reload.sh
│   ├── screenshot.sh
│   ├── tips-when-low-battery.sh
│   ├── toggle-layout.sh
│   └── volume.sh
├── startup.conf
├── wallpapers
│   ├── wallpaper-1.jpg
│   ├── wallpaper-2.jpg
│   ├── wallpaper-3.jpg
│   ├── wallpaper-4.jpg
│   ├── wallpaper-5.jpg
│   └── wallpaper-6.jpg
└── window-rules.conf
```

- hyprland.conf: 总的配置文件
- keybingings.conf: 快捷键, 无需多言
- startup.conf: 配置进入桌面后的自启动项, 比如一些守护进程, 输入法, 开启状态栏等  
- env.conf: 放置全局环境变量, 可以此来切换暗色主题, 更改光标大小等
- window-rules.conf: 编写窗口规则, 可以修改窗口的边框/打开的位置与大小/是否浮动等
- scripts 与 wallpapers 两个目录: 里并不是配置文件, 而是一些 assets(资源), 放置脚本与壁纸  


在 `hyprland.conf` 文件中, 我们可以定义变量, 导入其他位置的配置, 根据 [官网wiki](https://wiki.hyprland.org/) 进行配置:  



<figcaption class="fold-close"> ~/.config/hypr/hyprland.conf </figcaption>

```bash
# See https://wiki.hyprland.org/Configuring/Monitors/
monitor=,preferred,auto,1

# Set some variables
$hypr    = ~/.config/hypr
$scripts = ~/.config/hypr/scripts
$smart_gaps = yes

# Import configurations
source = $hypr/env.conf
source = $hypr/window-rules.conf
source = $hypr/keybindings.conf
source = $hypr/startup.conf

# For all categories, see https://wiki.hyprland.org/Configuring/Variables/
input {
    kb_layout = us
    kb_variant =
    kb_model =
    kb_options =
    kb_rules =

    follow_mouse = 1
    natural_scroll = true;
    sensitivity = 0.4 # -1.0 - 1.0, 0 means no modification.
    touchpad {
        natural_scroll = true
    }
}

general {
    # See https://wiki.hyprland.org/Configuring/Variables/ for more

    gaps_in = 4
    gaps_out = 0
    border_size = 1
    no_border_on_floating = no
    cursor_inactive_timeout = 0
    col.active_border = rgba(1affffee)
    col.inactive_border = rgba(595959aa)

    layout = dwindle
}


animations {
    # Some default animations, see https://wiki.hyprland.org/Configuring/Animations/ for more

    enabled = yes
    bezier = myBezier, 0.05, 0.9, 0.1, 1.05
    animation = windows, 1, 5, myBezier
    animation = windowsOut, 1, 6, default, popin 90%
    animation = border, 1, 10, default
    animation = fade, 1, 7, default
    animation = workspaces, 0, 6, default
}

dwindle {
    # See https://wiki.hyprland.org/Configuring/Dwindle-Layout/ for more

    pseudotile = no # master switch for pseudotiling. Enabling is bound to mainMod + P in the keybinds section below
    force_split = 2
    preserve_split = yes # you probably want this
    no_gaps_when_only = $smart_gaps
}

master {
    # See https://wiki.hyprland.org/Configuring/Master-Layout/ for more

    new_is_master = no
    no_gaps_when_only = $smart_gaps
}

gestures {
    # See https://wiki.hyprland.org/Configuring/Variables/ for more

    workspace_swipe = yes
}

misc {
    # See https://wiki.hyprland.org/Configuring/Variables/#misc for more 

    focus_on_activate = yes
    disable_hyprland_logo = yes
    disable_splash_rendering = no
    layers_hog_keyboard_focus = no
}

# Example per-device config
# See https://wiki.hyprland.org/Configuring/Keywords/#executing for more
device:epic mouse V1 {
    sensitivity = -0.5
}
```

这些效果直接看官网解释, 很详细, 所以我拒绝再抄一遍并进行翻译  
其实我修改的不多, 甚至把不用的直接删掉了, 类似那些动画效果的各种参数我也懒得仔细看, 直接默认  
修改了 `follow_mouse`, 开启自然滚动, 配置了下 gap/border, 设置了新变量 `smart_gap` 作为 `no_gaps_when_only` 的值

要配置的重头戏在于, 在于编写脚本/配置快捷键/配置其他应用/编写css等  
下面将进入正戏, 你可以直接使用我编写的脚本, 参考我的快捷键配置  

- - -

# 快捷键与脚本

<figcaption class="fold-close"> ~/.config/hypr/keybindings.conf </figcaption>

```bash
# Modify the following variables to your favorite
$mainMod         =  SUPER
$browser         =  firefox
$term_1          =  wezterm
$term_2          =  foot

# Vim-style key which will be used to move focus and window
$left            =  h
$right           =  l
$up              =  k
$down            =  j

# Paths
$scripts         =  ~/.config/hypr/scripts


# Binds
bind = $mainMod, Return,             exec, $term_1
bind = $mainMod  SHIFT, Return,      exec, $term_2
bind = $mainMod, B,                  exec, $browser
bind = $mainMod, Slash,              exec, killall -SIGUSR1 waybar
bind = $mainMod, Escape,             exec, sh $scripts/lock.sh

bind = $mainMod, P,                  exec, alacritty -t bottom -e btm
bind = $mainMod, C,                  exec, sh $scripts/color-picker.sh
bind = $mainMod, A,                  exec, sh $scripts/launcher.sh drun
bind = $mainMod, W,                  exec, sh $scripts/launcher.sh window
bind = $mainMod, D,                  exec, sh $scripts/launcher.sh run
bind = ALT, space,                   exec, fcitx5 -r


# Volume && Brightness
bindel = , XF86AudioRaiseVolume ,    exec, sh $scripts/volume.sh   raise
bindel = , XF86AudioLowerVolume ,    exec, sh $scripts/volume.sh   lower
bindl  = , XF86AudioMute        ,    exec, sh $scripts/volume.sh   toggle-mute

bindel = , XF86MonBrightnessUp  ,    exec, sh $scripts/light.sh    increase
bindel = , XF86MonBrightnessDown,    exec, sh $scripts/light.sh    decrease

bind = , Print, exec, sh $scripts/grimblast.sh --notify copy area
bind = SHIFT, Print, exec, sh $scripts/grimblast.sh --notify copy window
bind = CTRL SHIFT, Print, exec, sh $scripts/grimblast.sh --notify copy screen


bind = $mainMod SHIFT, Q,            killactive, 
bind = $mainMod SHIFT, R,            exec, sh $scripts/reload.sh
bind = $mainMod SHIFT, Escape,       exit, 
bind = $mainMod SHIFT, Space,        exec, playerctl play-pause
bind = $mainMod SHIFT, N,            exec, playerctl next
bind = $mainMod SHIFT, P,            exec, playerctl previous


bind = $mainMod, F,                  fullscreen, 0 
bind = $mainMod, M,                  fullscreen, 1
bind = $mainMod, O,                  exec, sh $scripts/cava-pinbox.sh
bind = $mainMod SHIFT, O,            exec, pkill -9 cava
bind = $mainMod, E,                  exec, nautilus
bind = $mainMod, V,                  togglefloating 
bind = $mainMod, C,                  centerwindow


# Focus && Window && Workspace
bind = $mainMod, $left,              movefocus, l
bind = $mainMod, $right,             movefocus, r
bind = $mainMod, $up,                movefocus, u
bind = $mainMod, $down,              movefocus, d

bind = $mainMod SHIFT, $left,        movewindow, l
bind = $mainMod SHIFT, $right,       movewindow, r
bind = $mainMod SHIFT, $up,          movewindow, u
bind = $mainMod SHIFT, $down,        movewindow, d

bindm = $mainMod, x,                 movewindow
bindm = $mainMod, R,                 resizewindow 

bind = $mainMod, 1,                  workspace, 1
bind = $mainMod, 2,                  workspace, 2
bind = $mainMod, 3,                  workspace, 3
bind = $mainMod, 4,                  workspace, 4
bind = $mainMod, 5,                  workspace, 5
bind = $mainMod, 6,                  workspace, 6
bind = $mainMod, 7,                  workspace, 7
bind = $mainMod, 8,                  workspace, 8
bind = $mainMod, 9,                  workspace, 9

bind = $mainMod SHIFT, 1,            movetoworkspacesilent, 1
bind = $mainMod SHIFT, 2,            movetoworkspacesilent, 2
bind = $mainMod SHIFT, 3,            movetoworkspacesilent, 3
bind = $mainMod SHIFT, 4,            movetoworkspacesilent, 4
bind = $mainMod SHIFT, 5,            movetoworkspacesilent, 5
bind = $mainMod SHIFT, 6,            movetoworkspacesilent, 6
bind = $mainMod SHIFT, 7,            movetoworkspacesilent, 7
bind = $mainMod SHIFT, 8,            movetoworkspacesilent, 8
bind = $mainMod SHIFT, 9,            movetoworkspacesilent, 9

bind = $mainMod, mouse_down,         workspace, e+1
bind = $mainMod, mouse_up,           workspace, e-1

bind = $mainMod, S,                  movetoworkspacesilent, special
bind = $mainMod SHIFT, S,            togglespecialworkspace


# Pass the global key forward the special app
bind = $mainMod,F10,pass,^(com\.obsproject\.Studio)$
```

我们可以定义一些变量在最开头, 方便后来修改  
我以 `Super-Key` 作为主修饰键, 也就是那个有着 Windows 图标, 或者在 macos 里叫做 Command 的键位, 一般位于左手边  


请别只用一个终端, 不然当某个终端突然崩溃时, 另外一个可以应急, 进行快速修改  

- - -

# 锁屏



<figcaption> ~/.config/hypr/scripts/lock.sh </figcaption>

```bash
#!/usr/bin/env bash
pactl set-sink-mute @DEFAULT_SINK@ toggle
playerctl stop
swaylock
hyprctl dispatch workspace empty
```

# 截屏

# 声音


# 空闲

# 取色笔




- - -

# 空闲


- - -

下一篇: [GNOME 入坑指南](/posts/desktop-beautify/gnome)  
