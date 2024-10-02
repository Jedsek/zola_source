+++
title = "在Linux下畅玩明日方舟"
path = "posts/other/linux-arknights"
date = 2024-03-23
template = "page.html"
+++

> 在Linux下畅玩明日方舟, 包括按键自定义, MAA使用, 超宽屏视野, 直播推流等教程

<!-- more -->

# 模拟器

## 内核

我们使用的模拟器方案基于 [redroid](https://github.com/remote-android/redroid-doc), 可以非常简单方便地在 Linux 上运行 android 容器  

首先根据 [redroid-doc](https://github.com/remote-android/redroid-doc) 的文档进行配置, 它可以在任何 Linux 上运行, 只需要启动一些内核功能即可  
我的机子是 Arch, 默认内核是 linux-zen, 所以直接就满足了需求, 不必操心这方面  

## 换源

通过包管理器安装 docker, 并且记得换成国内镜像加快下载速度, 不然会非常慢:  

```txt
sudo mkdir /etc/docker
vim /etc/docker/daemon.json
```

添加如下内容:

<figcaption> /etc/docker/daemon.json </figcaption>

```json
{
    "registry-mirrors": [
        "https://dockerproxy.com",
        "https://docker.mirrors.ustc.edu.cn",
        "https://docker.nju.edu.cn"
    ]
}
```

重启一下服务:

```txt
sudo service docker restart
```

## 启动

```bash
sudo docker run -d --privileged  \
  -v ~/vms/redroid11:/data   \
  -p 5555:5555  \
  --name redroid11   \
  redroid/redroid:11.0.0-latest   \
  androidboot.redroid_width=1920   \
  androidboot.redroid_height=1080   \
  androidboot.redroid_gpu_mode=host   \
  androidboot.redroid_dpi=480 \
  androidboot.redroid_fps=120  \
  androidboot.use_memfd=true
```

我们启动了 docker, 第一次启动时会自动帮你进行下载, 我们在这里使用的是 android11, 所以取名为 redroid11  
(并不推荐使用非 android11 的版本, 比如换成 `redroid::14.0.0-latest`, 本人遇见了好几个bug, 现在 11 是最稳定而且完全够用的)  

随后再打开另外一个终端, 输入如下内容:  

```bash
adb connect localhost:5555
scrcpy -s localhost:5555 --audio-codec=raw --print-fps -b 2048m --audio-bit-rate=2048m
```

我们连接到了先前启动的 docker 容器, 并且使用 scrcpy 创建了显示窗口(这里会在终端打印当前帧数)  

- - -

# 游戏安装

在 [明日方舟官网](https://ak.hypergryph.com/) 下载安卓版本的安装包, 然后:  

```bash
adb install ~/Downloads/arknights-hg-2221.apk
```

在 scrcpy 的显示窗口中, 我们按住鼠标左键从下往上拉, 在 `app-launcher` 界面点击 `明日方舟` 即可打开游戏并进行下载  

如果是 1920x1080 的分辨率, 你可能看不到 `app-launcher`, 所以可以更改分辨率, 比如改成 4k :  

```bash
sudo docker rm -f redroid11

sudo docker run -d --privileged  \
  -v ~/vms/redroid11:/data   \
  -p 5555:5555  \
  --name redroid11   \
  redroid/redroid:11.0.0-latest   \
  androidboot.redroid_width=3840   \
  androidboot.redroid_height=2160   \
  androidboot.redroid_gpu_mode=host   \
  androidboot.redroid_dpi=480 \
  androidboot.redroid_fps=120  \
  androidboot.use_memfd=true
```

然后通过 `adb+scrcpy` 就会看见进行过缩放的界面啦～  

- - -

# MAA自动收菜

玩粥的基本上都听说过 [MAA](https://maa.plus/) 的大名吧? 是基于 `图像识别技术` 自动帮你完成日常/公招/基建换班/肉鸽刷源石锭/生息演算刷分等  
因为是伟大的 ai 技术, 你不需要担心会像某些模拟器的录制脚本一不小心把你的合成玉/源石全部花光, 而且具有绝对的操作精准度  

我们使用目前最新的 [MAAX](https://github.com/MaaAssistantArknights/MaaX) (MAA GUI with Electron & Vue3)  

根据 README 上面的操作自行编译安装, 先确保使用包管理器安装了 `cross-env` 与 `zip`:  
(注意, release页面的不是最新版本, 有些操作没有支持, 比如 2024-03-23 的今天, 最新分支支持生息演算刷分, 但 release 的旧版还未支持)  

安装 `pnpm` 并且进行换源加速:  

```bash
npm config set registry https://registry.npm.taobao.org
sudo npm install -g pnpm
pnpm config set registry https://registry.npm.taobao.org
```

拉取 git 仓库, 速度慢记得开代理:  

```bash
git clone https://github.com/MaaAssistantArknights/MaaX.git --depth 1
cd MaaX/
git submodule update --init --recursive
sudo pnpm install
sudo pnpm run make
chown -R $(whoami) out/maa-x-linux-x64/
```

`MaaX/out/maa-x-linux-64/` 目录下的 `maa-x` 即为可执行文件, 直接打开即可  
因为我们的 redroid11 跑的端口是 `localhost:5555`, 所以在 MAA 中添加端口时添加 `127.0.0.1:5555` 并进行连接即可  
MAAX 的 ui 非常简单易懂, 所以我拒绝在此进行更多介绍啦, 继续往下看吧～  

- - -

# 超宽屏  

超宽屏体验, 也就是大约为 `21:9` 的长宽比, 在玩方舟时可以获取更多的视野, 玩起来相当舒服  

根据你的电脑配置, 自行在 `3440X1440`, `2560X1080`, `1792X768` 中选一个喂给 docker/redroid 当参数, 像上面那样重新启动:  

```bash
sudo docker rm -f redroid11

sudo docker run -d --privileged  \
  -v ~/vms/redroid11:/data   \
  -p 5555:5555  \
  --name redroid11   \
  redroid/redroid:11.0.0-latest   \
  androidboot.redroid_width=1792   \
  androidboot.redroid_height=768   \
  androidboot.redroid_gpu_mode=host   \
  androidboot.redroid_dpi=480 \
  androidboot.redroid_fps=120  \
  androidboot.use_memfd=true
```

对于我个人, 我是在方舟的设置里面开启 `低画质 + 60帧`, 因为方舟的高低画质, 肉眼看实际上是几乎完全一样的  
你可以理解为, 开启 `低画质` 可以获得 `高画质` 般的体验与较高的性能 (确信)  

先前的 scrcpy 加上了 `--print-fps` 的参数在终端输出当前帧率, 这可以方便我们进行分辨率的调教  
我的屏幕是 1920x1080, 在使用 `1792x768` 时可以获得稳定60帧, 而且对画质影响不大  

请注意, MAA 是基于 16:9 进行操作的, 所以当你使用 MAA 时, 应该从 21:9 切换回 16:9  
请注意, 使用 MAA 时, 启动 docker/redroid 应该设置为 16:9, 不过你不需要 scrcpy 显示窗口, 即使不显示也会在后台自行开刷的哦～  

- - -

# 直播推流

请自行下载 obs, 并以 `obs b站 直播推流` 的关键词进行搜索, 网上一大堆, 这点 linux 是完全与 windows 一样的, 不需要多讲  

- - -

# 按键自定义

重头戏来了, 如何在 linux 下获得如同 windows 下的 mumu模拟器/雷电模拟器 那样的按键自定义操作呢?  
嘛, 毕竟方舟是一款手游, 既然像 mumu模拟器 这种可以进行模拟, 我们在自由的 linux 上没有道理无法做到相同的事情  

以下的思路, 你的 linux 桌面环境需要满足如下条件:  

- wayland (我懒得在x11下再搞一遍了...)
- 可以对按键进行高度自定义的绑定

只要满足这两个条件即可, 类似 kde/gnome 都有办法可以做到, 不过肯定不如使用类似 sway/hyprland 这样的窗管来得方便  
我本人是基于 hyprland, 下面的脚本应该可以轻松适配到 sway 等窗管上, kde/gnome 用户则请自行琢磨吧  

我的思路是在玩方舟的时候直接将 scrcpy 的显示窗口进行全屏, 然后在 `hyprland` 中创建一个按键的子模式(mode/submap)  

当按下 `win+shift+a` 时, 会进入 `mode/arknights`, 并进行弹窗提示  
在 `mode/arknights` 下, 其他全局快捷键会被屏蔽无视, 让你只能使用 `mode/arknights` 下定义的快捷键, 以此避免了按键冲突  
再次按下 `win+shift+a` 时, 会退出 `mode/arknights`, 并进行弹窗提示  

目前是把 mumu 模拟器的快捷键方案给抄了过来:  

<figcaption> ~/.config/hypr/keybindings.conf </figcaption>

```rust
# Paths
$scripts         =  ~/.config/hypr/scripts

# 获取当前鼠标位置, 方便按键进行定位
bind = $mainMod shift,p, exec, bash -c "notify-send -t 1000 '$(hyprctl cursorpos)'"

bind = $mainMod SHIFT, A, exec, hyprctl dispatch submap arknights && notify-send -t 500 "Enter Mode/arknights"
submap = arknights

# 获取当前鼠标位置, 在 mode/arknights 下也允许
bind = $mainMod shift,p, exec, bash -c "notify-send -t 1000 '$(hyprctl cursorpos)'"

# 倍速切换
bind = , space, exec, sh $scripts/ydotool.sh click 1720 180

# 点击鼠标当前位置
bind = , C, exec, sh $scripts/ydotool.sh click

# 暂停
bind = , G, exec, sh $scripts/ydotool.sh click 1820 180

# Esc
bind = , F, exec, sh $scripts/ydotool.sh esc

# 撤退干员
bind = , A, exec, sh $scripts/ydotool.sh click && sleep 0.1s && sh $scripts/ydotool.sh click 920 370

# 释放技能
bind = , D, exec, sh $scripts/ydotool.sh click && sleep 0.1s && sh $scripts/ydotool.sh click 1220 600

# 划火柴
bind = , W, exec, sh $scripts/ydotool.sh esc && sleep 0.25s && sh $scripts/ydotool.sh esc

# 返回
bind = , grave, exec, sh $scripts/ydotool.sh click 90 200


bind = $mainMod SHIFT, A, exec, hyprctl dispatch submap reset && notify-send -t 500 "Exit  Mode/arknights"
submap = reset
```

这是基于 1920x1080 的屏幕, 对于你自己的屏幕需要更改一下进行点击时对应的 x 与 y  

<figcaption> ~/.config/hypr/scripts/ydotool.sh </figcaption>

```bash
#!/usr/bin/env bash

# 这个文件记录了对应按键的 keycode:  
# /usr/include/linux/input-event-codes.h

export YDOTOOL_SOCKET=$HOME/.ydotool_socket

pos_x=$(hyprctl cursorpos | cut -d "," -f1)
pos_y=$(hyprctl cursorpos | cut -d "," -f2)

if [[ $1 == "click" ]]; then
  if [[ -n $2 ]];then
    ydotool mousemove -a -x $2 -y $3
    ydotool click 0xc0
    # 鼠标点击之后记得回到之前的位置
    ydotool mousemove -a -x $pos_x -y $pos_y
  else
    # 如果没有给位置参数, 则鼠标在当前位置单击
    ydotool click 0xc0
  fi
fi


if [[ $1 == "esc" ]]; then
  # Esc 的 keycode 是 1, 所以 `1:1` 表示 `按下` Esc,  `1:0` 表示 `松开` Esc  
  ydotool key 1:1 1:0
fi
```

我们这里包装了 ydotool 在 wayland 下进行按键模拟, 并且记得提前允许 ydotoold:  

```bash
bash -c 'ydotoold --socket-path="$HOME/.ydotool_socket" --socket-own="$(id -u):$(id -g)"'
```

可以在每次启动 Hyprland 时自行运行 ydotoold:  

<figcaption> ~/.config/hypr/startup.conf </figcaption>

```bash
exec-once = bash -c 'ydotoold --socket-path="$HOME/.ydotool_socket" --socket-own="$(id -u):$(id -g)"'
```

至此, 已经可以在 linux 下畅玩明日方舟哩, 甚至完全可以做到比 windows 拥有更高的上限  

本文完, 我要去看仙术杯回放了哦哦哦哦哦哦哦哦哦哦哦哦, 集！成！战！略！至今我还没遇见有手游的肉鸽能比粥的肉鸽好玩 (应该吧  
