+++
title = "sicp-setup: 环境搭建"
path = "posts/sicp-setup"
date = "2024-06-28"
template = "page.html"
+++
> 搭建学习《SICP》的环境 (racket语言)  
<!-- more -->

racket 是一门面向语言的语言, 也就是可以造各种语法的语言, 可以满足学习 sicp 的需求  

本文基于 linux 系统  
首先通过你的包管理工具下载 racket, 以 Arch 为例:  

```bash
sudo pacman -S racket
```

随后你应该会获得如下三个程序:  

- racket: racket 语言的解释器  
- raco: racket 语言的包管理工具  
- drracket: racket 语言的 IDE  


通过 `raco` 下载 sicp 的环境:  

```bash
raco pkg install sicp
```

随后打开一个文件, 这里叫作 `a.rkt`:  

```scheme
#lang sicp

(define a 1)
(displayln a)
```

上述开头的 `#lang` 是必须的, 表示语言的语法是 sicp 的, 避免不一致  
通过 `racket a.rkt` 即可运行  

假设你用的是 vim/helix 这种需要 LSP(Language-Server-Protocal) 的编辑器:  
(强推 helix, 开箱即用)  

```bash
raco pkg install racket-langserver
```

如果想以 sicp 的环境启用 REPL:  

```bash
racket -I sicp
```

因为比较简单, 以下两种不再详细讲解:  
- vscode: 在扩展商店里直接下载对应插件即可  
- drracket: 下载并在设置选项中启用 sicp 即可
