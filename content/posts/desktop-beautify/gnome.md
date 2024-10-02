+++
title =  "GNOME 入坑指南"
date = 2022-07-20
path =  "posts/desktop-beautify/gnome"
template = "page.html"
+++
> 关于 GNOME 的入坑指南, 让你了解, 配置, 美化桌面环境
<!-- more -->

# 开篇说明

**注意:**  
本篇文章的配置皆在注重 **简洁**, **美观**, **高效**  
想要平铺式, 炫酷效果, 更多功能的, 请自行配置, 或查看我的另外一篇博客: [Hyprland 平铺式](/posts/desktop-beautify/hyprland)  
请注意 GNOME 版本是否相符, 有少许地方或因版本差异而不同, 我将尽量保持同步, 使该文章最新  
目前, 该篇文章的适用 GNOME 版本为: **44**  (**于2023年5月21更新本文**)

**注意:**  
如果你是在我的博客上阅读本文, 请善用右侧目录功能  

- - -

# 更新说明

**每次更新本文时, 一切更改记录都会放在这里, 方便读者进行版本迁移 (比如从 43 -> 44), 或者发现新的有用的插件**  

- 2023.5.21  
更新了本文版本以适配 GNOME-44, 更新了推荐插件列表及相应配图, 添加了 "gdm下部分设置无法生效" 的解决方法



- - -

# 成品展示
2023年了, GNOME 又靠谱又好用, 但有些人的界面仍处于是十年前的样子...  
我个人认为 **简洁** + **大气** + **美观** 比较重要, 当然你也可以自行修改进行DIY  
如果真的有需求, 请自己动手, 丰衣足食吧! ~~(虽然我认为本文已经详细地不能再详细了)~~ 

![44_wave_dark_wallapper](/images/gnome/overview_44_wave_dark_wallpaper.webp)
![44_blue_wallpaper](/images/gnome/overview_44_blue_wallpaper.webp)
<!-- ![42(旧版本的保留图片)](/images/gnome/overview_42.webp)  -->

- - -

# 使用工具说明

- `dconf`:
是一套基于键的配置系统, 十分高效, 你可以将其视作 Windows 下的注册表, 但修改起来非常简单  
- `gsettings`:
是 GNOME 下的高级API, 是一个命令行工具, 用来简化对 dconf 的操作  
 

你可能在年份久远的文章中听说过 `gconf`, 这是什么? 与 `dconf` 有啥区别?  
答: 其作用也类似注册表, 但现在已经停止使用, 被效率更高的 `dconf` 所取代  

接下来的大部分配置, 都会使用 `gsettings` 在命令行中进行操作

当然, 你也可以通过图形化界面, 比如 `gnome-control-center` 进行设置, 但有一些东西是界面里不存在/无法调整的  
同时, 为了方便读者进行复制粘贴, 特此写成命令形式 ~~(快说蟹蟹!!)~~  

- - - 

# 常用设置
以下是各种方面的设置, 直接复制粘贴, 有些地方进行下修改, 适配自己情况即可  

## 触摸板
触摸板可是笔记本党的灵魂啊, 尤其对于我这种万年不用鼠标, 除非打CSGO ~~(但CS我也能用触摸板玩)~~

有一些 Linux 发行版的 GNOME比较贴近上游, `轻击模拟鼠标点击` 默认未开启  
这导致触摸板很难用, 得按下去才能模拟鼠标的点击  

你想一想, 你想选中一段文字, 得重重按下触摸板, 在巨大的摩擦力下移动手指...  
而且, 默认的触摸板, 速度可能比较慢, 反正我不适应, 因此需要修改...  
还有就是, 触摸板在打字的时候默认是禁用的, 这对有时会用触摸板打CSGO的我来说很愤怒...  

你可以在终端输入如下命令进行调整:  

```bash
gsettings set org.gnome.desktop.peripherals.touchpad tap-to-click true
gsettings set org.gnome.desktop.peripherals.touchpad speed 0.57
gsettings set org.gnome.desktop.peripherals.touchpad disable-while-typing false
```

分别对应:  
- 轻击模拟鼠标点击, 默认为false
- 调整触摸板速度, 默认为0
- 打字时禁用触摸板, 默认为true

常用手势:  
- 单指: 移动鼠标
- 双指上下: 翻页
- 三指左右: 切换Workspace
- 三指上: 打开Overview (不常用, 按Super更快)
- 三指下: 显示任务栏 (当你隐藏任务栏时)

(安装一些插件后, 相关快捷键可能会发生改变)

## 窗口与工作区
我个人喜欢将工作区设置为静态, 也就是禁止动态工作区, 防止窗口自由移动, 同时将工作区设置为10个:  

```bash
gsettings set org.gnome.mutter dynamic-workspaces false
gsettings set org.gnome.desktop.wm.preferences num-workspaces 10
```

(Mutter 是 GNOME 自己的窗口管理器)  
 

对于快捷键, 你可以自定义窗口的最大化/最小化/全屏/隐藏/更改大小/移动, 与有关工作区的部分  
鉴于这一部分属于设置快捷键系列, 请您移动至本文后面的 **[修改快捷键](#xiu-gai-kuai-jie-jian)** 目录  

举个例子:  
比如 "move window", 普通来讲你可能会双击窗口的标题栏, 然后拖动窗口进行移动, 但你完全可以将这个操作绑定在快捷键 "Super+x" 上  
然后按一次该快捷键, 进入 "move mode", 移动完毕之后再按一次(或者点击一下), 就可以确定窗口位置  
如果你不满意, 可以按一下 `Esc`, 恢复到初始位置  

还有很多操作, 比如移动某个窗口至指定工作区, 或者切换至某个工作区, 就像是使用着类似 "i3/sway/hyprland" 等 "window manager" 一样的体验  

- - -

# GDM
稍微说明下, 如果你在登陆之后使用 gsettings 进行的设置, 无法在 GDM 中生效时, 极大概率是用户的身份与权限问题  

比如, 你发现触摸板明明已经设置了轻触模拟点击, 但在 GDM 中无效, 那就指定 `gdm` 用户, 再设置一遍即可:  

```bash
xhost +SI:localuser:gdm
sudo -u gdm gsettings set org.gnome.desktop.peripherals.touchpad tap-to-click true
sudo -u gdm gsettings set org.gnome.desktop.peripherals.touchpad speed 0.57
sudo -u gdm gsettings set org.gnome.desktop.peripherals.touchpad disable-while-typing false
```

如果你想美化 GDM, 请在 [gnome-look.org](gnome-look.org/) 上寻找一个好看的主题, 然后查看其安装脚本支不支持美化 GDM  
比如我就是使用了 [github.com/Graphite-gtk-theme](https://github.com/vinceliuice/Graphite-gtk-theme/) 这一主题  
在 release 界面将其下载到本地之后, 在其目录下输入以下内容:  

```bash
./install.sh -g
```

就能安装完成 GDM 的主题, 更改背景图片, 并使用已经配置好的 css 文件了  

- - -

# 插件
## 安装插件
GNOME 的插件(Extensions)是其重要的组成, 赋予了随意组合的 **自由** 与 **强大**, 说是 GNOME 一半的 **灵魂** 所在, 也不为过之  
我将先介绍如何安装/使用它们, 因为后面需要用到插件  

有两种安装方法, 一种从命令行安装, 一种从浏览器安装  
我更倾向于前者, 因为不需要下载对应的东西, 适合快速部署, 但两者我都会介绍  

### 从命令行
**提示**  
请确保拥有以下命令: `unzip`, `jq`, 有些发行版默认连 `unzip` 都没有...  
下载成功后, 切记要 logout, 然后再登进来, 运行 `gnome-session-quit` 即可  

每个 GNOME 插件都拥有独一无二的, 名为 `uuid` 的标识符, 我们可以通过 `uuid`, 下载插件  

你可以在 [Extensions-GNOME](https://extensions.gnome.org/) 这个网站上, 浏览并下载插件  
请将以 .zip 结尾的插件放在同一目录下, 假设该目录叫 `exts_list`  

下面是 Bash/Fish 脚本, 传入该目录的路径, 自动进行安装:  


<figcaption> install-extensions.sh </figcaption>

```bash
#!/usr/bin/env bash
declare -a UUID_LIST
EXTS_DIR=$HOME/.local/share/gnome-shell/extensions
EXTS_LIST=${1}
str_join() {
  echo "$*" | sed 's/""/","/g'
}
mkdir -p $EXTS_DIR
chmod -R 755 $HOME/.local/
for EXT in $EXTS_LIST/*.zip
do
  UUID=$(unzip -p $EXT metadata.json | jq -r ".uuid")
  mkdir -p $EXTS_DIR/$UUID
  unzip -q -o $EXT -d $EXTS_DIR/$UUID
  UUID_LIST+="\"$UUID\""
done
UUID_LIST=[$(str_join ${UUID_LIST[@]})]
gsettings set org.gnome.shell enabled-extensions ${UUID_LIST[@]}
```

执行脚本: `sh install-extensions.sh exts_list` 下载该目录下的所有插件  

**注意: 先logout, 再登进来**  

也可以通过dbus安装, 但获取uuid还得解压zip, 何不直接像上面那样手动安装? 所以不推荐:  

```bash
sudo dbus-send --type=method_call --dest=org.gnome.Shell /org/gnome/Shell \
  org.gnome.Shell.Extensions.InstallRemoteExtension string:'xxxxx_uuid'
```

### 从浏览器
该方法其实也蛮方便的, 但不适合快速部署  
你需要安装两个玩意, 才能直接从 [Extension-GNOME](https://extensions.gnome.org/) 上直接下载  

- `gnome-browser-connector`:  
本地软件, 你可以通过包管理器, 直接搜这个名字  

- `GNOME Shell integration`:  
浏览器插件, Chrome/Firefox 的浏览器商店都有它  
Edge 的插件商店里无, 但可以下载 iGuge (谷歌访问助手), 然后下Chrome的插件  

一个在本地, 一个在浏览器,  因此可以支持你从 [网站](https://extensions.gnome.org/) 上 直接安装到本地  

- - -

## 查看与配置插件
此处推荐使用浏览器来设置插件, 在 [https://extensions.gnome.org/local/](https://extensions.gnome.org/local/) 页面管理与配置插件  

如果你想通过命令行, 则可以使用 `gnome-extensions` 这个命令, 来查看并配置插件:  

```bash
# 获取帮助, `Command` 为可选项
gnome-extensions help [Command]

# 查看插件列表
gnome-extensions list --user    # 查看用户级插件
gnome-extensions list --system  # 查看系统级插件

# 查看插件的信息
gnome-extensions info launch-new-instance@gnome-shell-extensions.gcampax.github.com

# 启用/禁用某个插件
gnome-extensions enable nothing-to-say@extensions.gnome.wouter.bolsterl.ee
gnome-extensions disable nothing-to-say@extensions.gnome.wouter.bolsterl.ee

# 配置某个插件 (打开 GUI 界面)
gnome-extensions prefs nothing-to-say@extensions.gnome.wouter.bolsterl.ee
```

或者通过 `gsettings` 来配置某个插件, 但不推荐, 因为麻烦:  

```bash
# 查看某个插件的所有选项
gsettings --schemadir ~/.local/share/gnome-shell/extensions/nothing-to-say@extensions.gnome.wouter.bolsterl.ee/schemas/  \
  list-recursively org.gnome.shell.extensions.nothing-to-say
  
# 得到/重置/设置 某个插件的某选项当前的值 (根据上面这条命令查看所有选项)
gsettings --schemadir ~/.local/share/gnome-shell/extensions/nothing-to-say@extensions.gnome.wouter.bolsterl.ee/schemas/  \
  get    org.gnome.shell.extensions.nothing-to-say show-osd
# reset  org.gnome.shell.extensions.nothing-to-say show-osd
# set    org.gnome.shell.extensions.nothing-to-say show-osd
```

你可以在已经配置好插件的机器上, 导出 `dconf.settings` 文件, 并在新机器上加载它, 避免更换机器/重装系统之后再次设置插件  
详情请见 [**加载配置**](#jia-zai-pei-zhi)  

- - -

# 推荐插件列表
以下是我目前正在使用且推荐的插件, 适用版本为 **44**  

**注意:**
<!-- 如果你是通过我的博客 [jedsek.xyz](https://jedsek.xyz) 观看的话, 我默认隐藏了这些图片  -->
<!-- 你可以展开任意一张图片后, 点击图片, 然后可以通过方向键切换图片 :)  -->

- [transparent-top-bar(adjustable-transparency)](https://extensions.gnome.org/extension/3960/transparent-top-bar-adjustable-transparency/)  
让顶栏变透明的插件, 当窗口最大化或者与顶栏重叠时, 为了显示清晰会自动重新变回不透明  <br/>

- [auto-move-windows](https://extensions.gnome.org/extension/16/auto-move-windows/)  
通过指定窗口规则, 使得打开某个app时, 将其自动分配到特定工作区 (需要指定的.desktop文件)  <br/> 

- [color-app-menu-icon](https://extensions.gnome.org/extension/5473/color-app-menu-icon-for-gnome-40/)  
顶栏左上角会显示你当前所在应用的图标与名称   <br/>

- [draw-on-your-screen-2](https://extensions.gnome.org/extension/4937/draw-on-you-screen-2/)  
通过设置的快捷键, 让你可以在屏幕上用画笔画画, 在录制视频, 向他人演示, 标记重点的时候非常有用  <br/> 

- [removable-drive-menu](https://extensions.gnome.org/extension/7/removable-drive-menu/)  
当你插入u盘之后, 顶栏会出现显示图标, 让你快速访问文件, u盘拔出之后图标自动消失   <br/>

- [run-cat](https://extensions.gnome.org/extension/2986/runcat/)  
在顶栏出现一只奔跑的小猫与 cpu 的利用率, cpu 利用率越高, 小猫跑得越快   <br/>

- [quick-touchpad-toggle](https://extensions.gnome.org/extension/5292/quick-touchpad-toggle/)  
在 quick-settings 中增加一个选项, 让你快速启用/禁用触摸板   <br/>

- [quick-close-in-overview](https://extensions.gnome.org/extension/352/middle-click-to-close-in-overview/)  
在 overview 中, 当你的鼠标移动到对应窗口时, 右上角增加一个叉叉, 让你快速关闭窗口  <br/> 

- [just-another-search-bar](https://extensions.gnome.org/extension/5522/just-another-search-bar/)  
让你自己设置一个快捷键, 按下之后打开一个搜索框, 然后用你的默认浏览器搜索输入内容, 你可以设置搜索引擎(google/bing)  
这个操作在 overview 中也可以做到, 名字都说了是 just-another, 是为了更美观   <br/>

- [coverflow-alt-tab](https://extensions.gnome.org/extension/97/coverflow-alt-tab/)  
让你在使用 `super+tab`/`alt+tab` 切换窗口时, 获得好看美观的特效   <br/>

- [customize-iBus](https://extensions.gnome.org/extension/4112/customize-ibus/)  
ibus 是 gnome 内置的一个输入法, 但没有 fcitx5 强, 不过默认情况下已经蛮好看了  
该插件可以深度自定义 ibus 的行为, 比如打字时能让候选框随着打字的节奏而抖动, 非常爽  
再比如设置中英文切换时, 指示器的显示时间, 抖动效果, 闪烁特效等  
~~(但我还是选择无敌的 fcitx5)~~   <br/>
![ibus默认情况下的外表/系统暗色主题](/images/gnome/ibus.webp)  

- [quake-mode](https://extensions.gnome.org/extension/1411/quake-mode/)  
雷神模式!! 该插件可以让你以雷神模式打开一些与快捷键绑定的应用, 即以下拉式打开任意一个app, 全部工作区共享一个app  
quake-mode 配上你喜欢的任意一个终端, 都会产生非常棒的奇效, 具体效果可以点击链接看动图演示即可    <br/> 

- [color-pciker](https://extensions.gnome.org/extension/3396/color-picker/)  
采色笔, 用来采集颜色, 有相关需求的话非常有用, 没什么好说的   <br/>

- [battery-time](https://extensions.gnome.org/extension/5425/battery-time/)  
在 quick-setting 中显示你的电量还可以撑多久   <br/>

- [bluetooth-battery-indicator](https://extensions.gnome.org/extension/3991/bluetooth-battery/)  
当你连接蓝牙设备之后, 会在顶栏显示电量   <br/>

- [bluetooth-quick-connect](https://extensions.gnome.org/extension/1401/bluetooth-quick-connect/)  
在 quick-setting 中, 让你快速连接/断开已经配对过的蓝牙设备, 非常有用  <br/> 

- [control-blur-effect-on-lock-screen](https://extensions.gnome.org/extension/2935/control-blur-effect-on-lock-screen/)  
锁屏之后, 背景图片会变得模糊(blur), 这个插件可以修改模糊度, 我个人喜欢背景完全不模糊  <br/> 

- [transparent-window-moving](https://extensions.gnome.org/extension/1446/transparent-window-moving/)  
在对窗口进行移动/调整大小时, 使窗口变得透明   <br/>

- [just-perfection](https://extensions.gnome.org/extension/3843/just-perfection/)  
我最喜欢的一个插件, 用于对界面进行大量自定义与精简  
比如, 可以隐藏 Dash (按Super后底部的一行), 改变顶栏元素等   <br/>
![just-perfection](/images/gnome/overview_44_wave_dark_wallpaper.webp)

- [nothing-to-say](https://extensions.gnome.org/extension/1113/nothing-to-say/)  
用于切断/恢复声音的输入, 对我来说蛮有用的:  
当与同学打游戏, 撞上爸妈查房, 立刻按下 `Super+\`, 防止爸妈训我的声音流入同学耳中, 维护尊严 :)  <br/> 

- [space-bar](https://extensions.gnome.org/extension/5090/space-bar/)  
模仿 I3/Sway/Bspwm 等窗口管理器, 在左上角显示工作区, 有些类似的插件, 但个人认为, 这个插件最好  <br/> 
![space-bar/名称](/images/gnome/space-bar_name.webp)
![space-bar/数字](/images/gnome/space-bar_number.webp)

<br>

<!-- Deprecated -->
<!-- - [workspace-switcher-manager](https://extensions.gnome.org/extension/4788/workspace-switcher-manager/) -->
<!-- 美化通过键盘(我配成了 `Super + 1..9`), 切换工作区时的动画效果, 很赞很好看, 可以高度 DIY   -->
<!-- >>> **点击展开/隐藏图片** -->
<!-- ![workspace-switcher-manager](/images/gnome/workspace-switcher-manager.webp) -->
<!-- >>> -->
<!--  -->
<!-- <br> -->

- [disable-workspace-switch-animation-for-GNOME40+](https://extensions.gnome.org/extension/4290/disable-workspace-switch-animation-for-gnome-40/)  
消除通过键盘切换工作区时的过渡动画, 获得急速切换的体验感  <br/> 

- [gsconnect](https://extensions.gnome.org/extension/1319/gsconnect/)  
GNOME版的 `kdeconnect`, 用于电脑与手机互连 (一个网下), 在右上角菜单添加对应菜单, 以便快速打开  
手机需安装 `kdeconnect`, 你可以从本博客下载 apk 进行安装: [kdeconnect](/downloads/gnome/kdeconnect.apk)  <br/> 
![gsconnect](/images/gnome/gsconnect.webp)

<br>

<!-- Deprecated -->
<!-- - [blur-my-shell](https://extensions.gnome.org/extension/3193/blur-my-shell/) -->
<!-- 用于让面板, 顶栏, Overview, 锁屏, gnome自带的截屏, 甚至特定的app, 都能被毛玻璃化, 很强大的插件   -->
<!-- 但我并不推荐这个插件, 因为修改的东西太多, 和其他插件一起的话, 有概率发生死机等问题   -->
<!-- >>> **点击展开/隐藏图片** -->
<!-- ![blur-my-shell](/images/gnome/overview.webp) -->
<!-- >>> -->
<!--  -->
<!-- <br> -->

- [user-avatar-in-quick-settings](https://extensions.gnome.org/extension/5506/user-avatar-in-quick-settings/)  
让右上角菜单出现你的头像, 提升美观而已   <br/>

- [gnome40-ui-improvements](https://extensions.gnome.org/extension/4158/gnome-40-ui-improvements/)  
按下 `Super`, 进入 `Overview` 后, 在中上方显示工作区  
与下面的插件 `v-shell`  不兼容, 二选一, 我推荐下面的 `v-shell`  <br/> 
![gnome40-ui-improvements](/images/gnome/gnome40-ui-improvements.webp)

<br>

- [v-shell](https://extensions.gnome.org/extension/5177/vertical-workspaces/)  
按下 `Super`, 进入 `Overview` 后, 在左边显示工作区, 同时附赠了各种非常好用的操作  
当你进入 `Overview` 后, 按下 `space` 后可以查询打开的窗口, `alt+space` 查询最近修改的文件  <br/> 
与上面的 `gnome40-ui-improvements` 二选一  
![v-shell](/images/gnome/overview_44_wave_dark_wallpaper.webp)

<br>

- [gnome-fuzzy-app-search](https://extensions.gnome.org/extension/3956/gnome-fuzzy-app-search/)  
出于某些目的, 默认的 `GNOME` 在 `Overview` 中不支持模糊查找, 可以通过该插件修改行为  <br/> 

- [pip-on-top](https://extensions.gnome.org/extension/4691/pip-on-top/)  
当你通过浏览器中的画中画模式, 观看视频时, 让窗口一直保持在最顶部, 即使焦点在别的窗口  <br/> 

- [frequency-boost-switch](https://extensions.gnome.org/extension/4792/frequency-boost-switch/)  
在右上角菜单中的 `电池策略` 中添加一个 `Checkox`, 用于切换 `是否允许超频`  <br/> 

<!-- Deprecated -->
<!-- - [overview-navigation](https://extensions.gnome.org/extension/1702/overview-navigation/) -->
<!-- 当按下 `Super` 进入 `Overview` 后, 可以按下 `空格键`, 窗口上会出现字母   -->
<!-- 输入小写字母就切换到对应窗口, 按下 `Shift` 会使字母颜色变红, 此时输入字母会关闭对应窗口   -->
<!-- >>> **点击展开/隐藏图片** -->
<!-- ![overview-navigation](/images/gnome/overview-navigation.webp) -->
<!-- >>> -->
<!--  -->
<!-- <br> -->

<!-- Deprecated -->
<!-- - [cleaner-overview](https://extensions.gnome.org/extension/3759/cleaner-overview/) -->
<!-- 进入 `Overview` 时, 将窗口排列整齐, 简单实用   -->
<!-- >>> **点击展开/隐藏图片** -->
<!-- ![cleaner-overview](/images/gnome/overview-navigation.webp) -->
<!-- >>> -->
<!--  -->
<!-- <br> -->

- [user-theme](https://extensions.gnome.org/extension/19/user-themes/)  
从用户目录加载对应的主题 (之后的换主题教程中会讲到)  
注意: 还需要使用 `gnome-extensions prefs user-theme@gnome-shell-extensions.gcampax.github.com` 指定主题  
但我个人还是喜欢 GNOME 默认的暗色主题, 默认的就已经非常好看了  <br/> 

- [user-syle-sheet](https://extensions.gnome.org/extension/3414/user-stylesheet-font/)  
读取 `~/.local/share/gnome-shell/gnome-shell.css` 直接修改 GNOME 的默认CSS, 十分逆天, 适合重度 DIY 患者  <br/> 



- - -

# 美化
以下美化工作涉及暗模式, 背景, 头像, 主题, 字体, Dash等  
还有很多插件有帮助, 上面 [推荐插件列表](#tui-jian-cha-jian-lie-biao) 里有提到, 比如那个更改css的, 这里不说了  

- 启动暗模式:  

```bash
gsettings set org.gnome.desktop.interface color-scheme "prefer-dark"
```

- 背景壁纸: 暗模式下的背景与普通模式可以不一样, 因此也要注意设置下  

```bash
gsettings set org.gnome.desktop.background picture-uri 'file:///usr/share/backgrounds/aaa.webp'
gsettings set org.gnome.desktop.background picture-uri-dark 'file:///usr/share/backgrounds/aaa.webp'
```

- 头像: 假设用户名是 `Xyz`, 则需要将图片命名为 `Xyz`, 随后放到 `/var/lib/AccountsService/icons/` 下

```bash
sudo mv ./Xyz /var/lib/AccountsService/icons/

# 或将图片命名为.face, 放到家目录
# mv ./Xyz ~/.face  
```

- 主题: 单用户的放 `~/.themes/` , 多用户的放 `/usr/share/themes/`, 可前往 [gnome-look](https://www.gnome-look.org/) 挑选主题  

```bash
# 以 Nordic 为例子
mkdir ~/.themes/ && cd ~/.themes/
git clone https://gitee.com/mirror_jedsek/Nordic.git
gsettings set org.gnome.desktop.interface gtk-theme 'Nordic'
gsettings set org.gnome.desktop.wm.preferences theme 'Nordic'

# 你也可以使用 `user-theme` 这个插件进行设置:  
mkdir ~/.themes/ && cd ~/.themes/
git clone https://gitee.com/mirror_jedsek/Nordic.gi
gnome-extensions prefs user-theme@gnome-shell-extensions.gcampax.github.com
```

- 字体: 将顶栏字体换成 `Fira Code`, 顺便调整下大小  

```bash
gsettings set org.gnome.desktop.interface font-name 'Fira Code 11.8'
```

- 隐藏 `Dash` 栏: 对我个人来讲, Dash 毫无用处还占地方, 快捷键+Overview的搜索, 可以应付一切工作了  

```bash
gsettings set org.gnome.shell favorite-apps "[]"
```

**注意:**  
以上命令仅仅移除 Dash 中的app, 但仍然会留下一个空的Dash栏  
若想要彻底隐藏, 请使用 `Just-perfection` 插件，其得到了官方支持, 可将桌面化简, Dash 是其中之一  
如果你只是使用插件, 将 Dash 隐藏, 未置空列表, 相关快捷键仍然生效, 需被禁用而彻底消除Dash, 请看下面的 [禁用快捷键](#jin-yong-kuai-jie-jian)  

- 去掉左上角的 `Activities`: 可将其换成 I3/Sway 式, 显示工作区名称 (请安装插件: `space-bar`)  

```bash
# 自定义工作区的名称, 不然就是默认的数字
gsettings set org.gnome.desktop.wm.preferences workspace-names "['Browser', 'Terminal', 'Game', 'Box', 'Other']"
```
- 隐藏顶栏: 安装 `just-perfection` && `blur-my-shell`, 配置后就是本文 [成品展示](#cheng-pin-zhan-shi) 中的了, 处于 `Overview` 中才显示顶栏  

**注意:**  
我并不推荐您使用除了 Adwaita(默认主题) 之外的任何主题, 因为默认的已经足够了, 而且保证了稳定性  
~~(你也不想你辛辛苦苦高度自定义的界面因为某个傻*主题的傻*下载脚本给干沉默吧?)~~
当然, 我认为仅美化 GDM 的界面是可以接受的, 当你开机进入用户选择登陆的界面时, 赏心悦目也是蛮重要的  

如果你想美化 GDM 界面, 请跳转到 [GDM](#gdm)

- - -

# 快捷键
这也是个很影响体验的地方, 如果你对自带的快捷键不满意, 完全可以自己更改  

我个人就不喜欢 `Alt+Fn数字`, 因为太远了, 而且记不清, 干脆换些简单易记的, 像 `I3/Sway` 那样  
当然, 你还可以禁用一些快捷键, 做到一些事情, 比如消除 Dash  

**注意:**  
快捷键部分, 还是推荐通过 `gnome-control-center keyboard` 打开设置中心的键盘区, 在其中自定义快捷键  
(如果图形界面无法满足你的需求, 你可以再捉摸着, 看看下面的命令行部分, 或许可以帮到你)

快捷键之间有冲突的话, 可能无法生效, 请通过 `gnome-control-center keyboard` 查看快捷键冲突并重置快捷键至默认  


## 查找快捷键
首先, 我们得明白如何查找对应的快捷键  

下面的命令会列出极大部分的快捷键:  

```bash
gsettings list-recursively | grep -E "Super|Alt|Ctrl|Shift|F[0-9]|Page|Up|Down|Right|Left" | cat
```

你可以在后面通过 pipeline, 追加一个 grep, 搜索 theme, font, workspace, switch, move 等词语  
如果实在找不到, 一点点看过去也行 :)  


## 禁用快捷键
某命令的快捷键, 一般可以有多个, 即某命令的快捷键是一个数组  
想要禁用该快捷键, 将对应的数组设置为空就行了  

举个例子, 禁用Dash的快捷键 (见上文的置空 `favorite-apps`):  

```bash
# Default: Super+"1..9"
for i in $(seq 9)
do
    gsettings set org.gnome.shell.keybindings switch-to-application-$i "[]"  
done    
```

禁用快捷键还可以让你避免冲突, 比如:  
某个操作绑定了快捷键A, 另一个操作也绑定了快捷键A, 可能键A就失效了, 我遇到过好几次  
这时就要借助 GUI 的力量了: 输入 `gnome-control-center keyboard`, 然后进入自定义那栏, 会显示冲突的键  

举个例子, 我想修改 `Super+Esc` 变成锁屏, 我就要这样做:  

```bash
gsettings set org.gnome.settings-daemon.plugins.media-keys screensaver "['<Super>Escape']" #Default: Sup+L
gsettings set org.gnome.mutter.wayland.keybindings restore-shortcuts "[]" # Default: Sup+Esc
```

## 修改快捷键
修改, 也就是覆写默认的快捷键, 与下文要讲的 [添加快捷键](#tian-jia-kuai-jie-jian) 不是一个概念  
单纯的改改改而已, 下面是我个人修改的一套快捷键, 供大家参考  

- Vim 式的按键, 改变窗口布局, 替代原有的 `Super+方向键`:  

```bash
# 其实还有更丧心病狂的, 可以绑定快捷键, 将窗口放左上角, 右上角, 中间左边, 中间右边的......

gsettings set org.gnome.mutter.keybindings      toggle-tiled-left  "['<Super>h']" # 放左边
gsettings set org.gnome.desktop.wm.keybindings  maximize           "['<Super>j']" # 最大化
gsettings set org.gnome.desktop.wm.keybindings  unmaximize         "['<Super>k']" # 最小化
gsettings set org.gnome.mutter.keybindings      toggle-tiled-right "['<Super>l']" # 放右边
```

对了, 如果你追求平铺式的话, 插件可以满足一部分要求, 但肯定比不上专业的窗管...  

- move, resize, kill 一个窗口:  

```bash
# Move
gsettings set org.gnome.desktop.wm.keybindings begin-move   "['<Super>x']"        #Default: Alt+F7

# Resize
gsettings set org.gnome.desktop.wm.keybindings begin-resize "['<Super>r']"        #Default: Alt+F8

# Kill
gsettings set org.gnome.desktop.wm.keybindings close        "['<Super><Shift>q']" #Default: Alt+F4
```

- toggle-max, max, min, toggle-fullscreen, show-desktop:  

```bash
# Toggle max
gsettings set org.gnome.desktop.wm.keybindings toggle-maximized  "['<Super>m']"     #Default: Alt+F10

# Max/Min
gsettings set org.gnome.desktop.wm.keybindings maximize          "['<Super>j']"
gsettings set org.gnome.desktop.wm.keybindings unmaximize        "['<Super>k']"
gsettings set org.gnome.desktop.wm.keybindings minimize          "['<Super>comma']" #Default: Super+H

# Toggle fullscreen
gsettings set org.gnome.desktop.wm.keybindings toggle-fullscreen "['<Super>f']"     #Default: None

# Show desktop
gsettings set org.gnome.desktop.wm.keybindings show-desktop      "['<Super>d']"     #Default: None
```

- 还有套很重要的快捷键, 就是切换工作区了, 搭配先前提到过的消除过渡动画的插件, 流畅感Max:  

```bash
for i in $(seq 9)
do
  gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-$i "['<Super>$i']"
  gsettings set org.gnome.desktop.wm.keybindings move-to-workspace-$i   "['<Super><Shift>$i']"
done
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-10   "['<Super>0']"
gsettings set org.gnome.desktop.wm.keybindings move-to-workspace-10     "['<Super><Shift>0']"
```

- 再比如, 覆写 `run-dialog` 的快捷键 (默认是按Alt-F2, 但太远了...):  

```bash
gsettings set org.gnome.desktop.wm.keybindings panel-run-dialog "['<Super>c']" #Default: Alt+F2
```

## 添加快捷键
此处指的是真正的, 添加自己的快捷键. 不是简单的覆写  
比如 `Super+Return` 打开一个终端, `Super+B` 打开浏览器, `Super+E` 打开文件管理器...  

废话不多说, 你按下面照猫画虎, 就阔以了:  

```bash
gp0="/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings"
gp1="org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:\
/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings"

# Custom Keys
# 注意!!!!!!!
# 不要在最后添加逗号
gsettings set org.gnome.settings-daemon.plugins.media-keys custom-keybindings "[             \
    '$gp0/custom0/', '$gp0/custom1/', '$gp0/custom2/', '$gp0/custom3/', '$gp0/custom4/'      \
]"

## Terminal
gsettings set $gp1/custom0/ name     'Terminal'
gsettings set $gp1/custom0/ command  'alacritty'
gsettings set $gp1/custom0/ binding  '<Super>Return'

## Files
gsettings set $gp1/custom1/ name     'Files'
gsettings set $gp1/custom1/ command  'nautilus'
gsettings set $gp1/custom1/ binding  '<Super>e'

## Browser
gsettings set $gp1/custom2/ name     'Browser'
gsettings set $gp1/custom2/ command  'firefox'
gsettings set $gp1/custom2/ binding  '<Super>b'

## Logout
gsettings set $gp1/custom3  name     'Logout'
gsettings set $gp1/custom3/ command  'gnome-session-quit'
gsettings set $gp1/custom3/ binding  '<Super><Shift>Escape'

## Fcitx5 Reload
gsettings set $gp1/custom4/ name     'Fcitx5_Reload'
gsettings set $gp1/custom4/ command  'fcitx5 -r'
gsettings set $gp1/custom4/ binding  '<Alt><Shift>space'
```

上面的一切已经非常非常详细, 但接下来还要解决最后的问题:  
如果你更换了机器/重装了系统, 如何快速恢复先前的工作环境?  

- - -

# 加载配置
我们可以通过 dconf 这个工具, 导入或导出记载着 GNOME 数据的配置文件  
你可以导出记载当前DE的配置文件, 然后导出到另一台机器上  
这意味着, 当你重装系统时, 按下面的方法能快速恢复到先前的DE  

**注意:**  
我相信你还没有忘记, 如何把插件下载下来, 将十几个zip文件放在一个文件夹里面, 然后用bash脚本自动下载安装吧?  
请跳转至上面的 [安装插件/从命令行](#cong-ming-ling-xing) 目录


## 对于非Nixos
对于普通的Linux发行版, 直接按下面的方式  

- 导出当前的dconf数据到某个文件:  

```bash
dconf dump / > dconf.settings
```

- 加载/导入某个dconf文件到当前系统:

```bash
cat dconf.settings | dconf load -f /
```

对于背景与头像, 你可以写一段脚本, 将其复制到相应位置, 然后再添加上面的代码加载配置  
同时确认 `dconf.settings` 中的 `picture-uri` / `picture-uri-dark` 指向对应文件  

## 对于Nixos

如果你使用 Nixos, 请先确保已经安装了 [HomeManager](https://github.com/nix-community/home-manager)  
HomeManager 是 Nixos 中用来管理用户配置, 支持回滚的工具  

虽然也能按上面的方法配置 Nixos 的 GNOME, 但还是推荐使用 HomeManager, 原因略过, 自看文档  
请先下载 `dconf2nix`, 这是一个将 dconf文件, 转换为 nix 表达式的工具  
随后, 在终端输入以下内容, 得到 `dconf.nix` :  

```bash
dconf dump / > dconf.settings
dconf2nix -i dconf.settings -o dconf.nix
```

在你的 ~/.config/nixpkgs 中, 保持这样的目录结构 (当然了, 可以随你想法):  

```txt
nixpkgs/
├── gnome
│   ├── .background
│   ├── .face
│   └── dconf.nix
└── home.nix
```

这里的 `dconf.nix` 就是刚刚转换得到的nix表达式, 在 `home.nix` 中导入它:  

```nix
imports = [
  ./gnome/dconf.nix
];
```


介于 HomeManager 的权限问题, 必须将背景图片/人物头像, 保持在 `$HOME` 下  
这里将两个图片放在了 `~/.config/nixpkgs/gnome/` 下, 因此要修改下相应文件  


- 对于背景图像, 修改 `dconf.nix` 中的 `picture-uri`:  

```nix
"org/gnome/desktop/background" =
let picture = ../.background.webp; in
{
  picture-uri = "file://${picture}";
  picture-uri-dark = "file://${picture}";
};
```

- 对于人物头像, 在 `home.nix` 添加以下内容:  

```nix
home.file.".face".source = ./.face;
```

大功告成!  我相信这是最最最最最全的一份 GNOME 入坑指南了  

- - -

下一篇: [Hyprland 入坑指南](/posts/desktop-beautify/hyprland)  
