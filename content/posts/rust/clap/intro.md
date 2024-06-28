+++
title = "clap-rs 简介"
path = "posts/rust-clap/intro"
date = 2022-08-16
template = "page.html"
+++
> 了解命令行, 然后用 clap-rs 写个类似 GNU/wc 命令的 rwc 吧, 增加了进度条, 表格输出, 并行化等功能  
<!-- more -->

前置知识: Rust基础  
完整代码: [github/jedsek/rust-wc](https://github.com/Jedsek/rust-wc)

**注意:**  
本项目基于当前最新版本的 clap, 也就是 version 4
本项目使用 clap 中的 derive 特性, 而非 builder 特性 (其实差不多)

推荐读者别直接跟着敲代码, 先整体看一遍, 明白大致思路后再动手  
官方教程: [derive tutorial](https://docs.rs/clap/latest/clap/_derive/_tutorial/index.html)
官方资料: [derive reference](https://docs.rs/clap/latest/clap/_derive/index.html)

# 成品展示
你可以通过如下命令, 从 [crates.io](https://crates.io) 上下载该成品, 可执行文件的名称是 `rwc`:  

```bash
cargo install rust-wc
```

以下是使用 [asciinema](https://asciinema.org/) 录制的展示:  

<script id="asciicast-534647" src="https://asciinema.org/a/534647.js" async></script>

- - -

# 基础概念
CLI, 是 `command-line interface` 的简称, 意思是命令行界面, 和 GUI/TUI 是一个道理  
如在Linux下常见的 `ls/cp/mv` 等命令, 你传入参数, 它就会做些事情, 并可能会打印相应输出  

GNU 项目提供了非常多的开源命令, 如 `wc`, 它可以统计文件的 bytes/char/line 的数量  
我们将会使用 Rust 语言, 搭配一个叫 clap 的库, 写一个升级版的 `wc`  

**注意:**  
cli 可以代表抽象的界面, 也可以指代具体的某个程序  
后文中的cli, 一般情况下都指代某个具体的命令行程序, 比如 ls/cp 等

再写之前, 我们还应了解些基本概念 ~~(直接跳过感觉也木得问题??)~~:  

- `参数(Arguments)`:  
传给命令的参数, 比如一个路径 ~~(嘶, 感觉在说废话)~~

- `选项(Options)`:
通常以单/双横杠开头, 不同的options表示不同的行为  
比如 `ls ./*`, 表示以默认行为下进行输出, `ls -l ./*` 以长列表形式输出, `ls -a ./*` 输出所有隐藏文件  
单横杠开头的只有一个字母, 双横杠开头的可以有很多字母, 如 `ls -i` 与 `ls --inode`  

- `子命令(Subcommands)`:  
一个命令的子命令, 通常情况下需要不同的 args, 有不同的 options  
比如 `cargo build` 与 `cargo publish`, 都是 `cargo` 的子命令  

- `双横杠(--)`:  
在命令后面的某处位置, 加上 `--`, 可以将 `--` 后面的内容当作 argument 传入, 而非 options  
举个例子, 我有个文件, 叫做 `--asd`, 我想使用 `cat --asd` 来输出里面的内容  
如果你直接这样传参, 因为文件名以横杠开头, 将会被命令视作 options, 而 cat 本身没 `--asd` 这个option, 故失败  
在比如有个文件叫 `--help`, 使用 `cat --help` 将会打印其 help 信息  
此时, 你应该使用 `cat -- --asd`, 将 `--asd` 视作参数传入

- `短/长帮助(short/long help)`:
有些命令, `-h` 与 `--help` 分别对应短帮助与长帮助, 后者比前者会显示更多提示信息

- - -

# 初始配置
以下是层次结构, 之后要生成自动补全文件时, 还会再增加一些文件  
请自行创建好目录:  

```
./rust-wc
├── Cargo.lock
├── Cargo.toml
└── src
   ├── wc_result.rs   # 计算并存储结果
   ├── cli.rs         # 命令行的定义
   ├── files.rs       # 读取文件
   ├── lib.rs         # 声明模块, 类型别名
   └── main.rs
```

让我们新建一个叫做 `rust-wc` 的项目, 然后在 `Cargo.toml` 中添加 clap 吧:

<figcaption>Cargo.toml </figcaption>

```toml
# 包名为 `rust-wc` (因为我发布到 crates.io 的时候, `rwc` 已经被占了呜呜呜呜呜)
[package]
name = "rust-wc"
authors = ["jedsek <jedsek@qq.com>"]
version = "0.0.1"
description = "A GNU/wc implementation written in rust, which is faster when reading a large of big files"
edition = "2021"

# 指定生成的可执行文件的名字, 此处是 `rwc`, 虽然包名是 `rust-wc`, 但命令是 `rwc`
[[bin]]
name = "rwc"
path = "src/main.rs"

# 指定依赖
[dependencies]
clap = {version = "4.0.29", features = ["derive"]}     # 解析参数
unicode-width = "0.1.10"                               # 计算 Unicode 字符宽度
indicatif = "0.17.2"                                   # 进度条
prettytable-rs = "0.9.0"                               # 打印表格
rayon = "1.6.1"                                        # 并行化
```

以下是 lib.rs 的内容:  

<figcaption>src/lib.rs</figcaption>

```rust
use std::{collections::HashMap, path::PathBuf};

pub mod cli;
pub mod files;
pub mod wc_result;

pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;
pub type Counts = Vec<usize>;
pub type PathWithContent = HashMap<PathBuf, String>;
```

- - -

# 命令定义

**注意:**
clap-v3 时, 融进了另一个很强大的命令行编写库: structopt  
因此以后看见 structopt 与 clap, 直接用 clap 就完事了, 前者也发过通知, 让别人直接用 clap  
这给 clap 带来的巨大变化, 就是出现了derive宏, 以一种非常便利的声明式写法, 帮你生成与解析代码  


让我们来想象下这个命令:  

- 必须接受一个参数
- 参数必须是存在的路径, 或者是 -, 表示从标准输入读取内容
- 根据启用的 flag 来决定计算并打印哪些东西

多亏了 derive 宏, 我们可以这样定义它, 下面是 `src/cli.rs` 的完整代码:  


<figcaption>src/cli.rs</figcaption>

```rust
use clap::{ArgGroup, Parser, Subcommand};
use std::path::PathBuf;

#[derive(Parser)]  // 这里的 derive(Parser) 表示下面这一坨都会被 `宏的黑魔法` 所洗礼 
#[command(
    author, version, about, subcommand_negates_reqs = true,
    group(
        ArgGroup::new("options")
            .multiple(true)
            .required(true)
            .args(&[ "bytes", "chars", "words", "lines", "longest_line"])
    ),
)]
pub struct Cli {
    /// The path(s) you should provide
    #[arg(value_parser = check_path, value_name = "PATH", required = true)]
    pub paths: Vec<PathBuf>,

    /// Print the byte counts
    #[arg(short, long)]
    pub bytes: bool,

    /// Print the character counts
    #[arg(short, long)]
    pub chars: bool,

    /// Print the word counts
    #[arg(short, long)]
    pub words: bool,

    /// Print the line counts
    #[arg(short, long)]
    pub lines: bool,

    /// Print the maximum line width (Unicode)
    #[arg(short = 'L', long)]
    pub longest_line: bool,

    #[command(subcommand)]
    pub sub_commands: Option<SubCommands>,
}

#[derive(Subcommand)]
pub enum SubCommands {
    /// Enabled all available options
    All {
        /// The path(s) you should provide
        #[arg(value_parser = check_path, value_name = "PATH", required = true)]
        paths: Vec<PathBuf>,
    },
}


// 自定义了一个解析器, 检测路径是否存在, 或者是否从标准输入读取内容
fn check_path(filename: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(filename);
    if filename == "-" || path.exists() {
        Ok(path)
    } else {
        Err(format!("No such path: `{}`", path.display()))
    }
}

impl Cli {
    // 开启所有的 options
    pub fn enable_all_options(&mut self) {
        self.bytes = true;
        self.chars = true;
        self.words = true;
        self.lines = true;
        self.longest_line = true;
    }
        
    // 返回启用的options, 类型是 Vec<&str>, 方便后面打印表格时, 作为表格的标题
    pub fn get_enabled_options(&self) -> Vec<&'static str> {
        let mut enabled_options = vec![];

        self.bytes.then(|| enabled_options.push("Bytes"));
        self.chars.then(|| enabled_options.push("Chars"));
        self.words.then(|| enabled_options.push("Words"));
        self.lines.then(|| enabled_options.push("Lines"));
        self.longest_line.then(|| enabled_options.push("Maximum line width (Unicode)"));

        enabled_options
    }
}
```

以上的代码表示, 我们定义了一个 `Cli` 结构体, 表示对输入参数的建模  
得益于宏的黑魔法, clap 将生成一些代码, 使我们不用再耗费脑力, 考虑如何处理输入参数, 并将其解析为对应类型  
也不用再考虑解析失败时, 应该如何编写一个用户友好的错误提示  

clap 以及为我们做好了一切 :)  

我们能调用 clap 为我们实现的 Parser (trait) 中的 parse 方法, 解析参数并进行转换:  

```rust
use clap::Parser;
use rust_wc::{cli::Cli, Result};

fn main() -> Result<()> {
    let cli = Cli::parse();
    Ok(())
}
```

## 帮助信息

等下再解释, 现在先让我们看看效果, 查看下 help 吧:  

```rust
cargo run -- -h
```


```txt
A GNU/wc clone written in rust, which is super faster when reading a large of big files

Usage: rwc <--bytes|--chars|--words|--lines|--longest-line> <PATH>...
       rwc [PATH]... <COMMAND>

Commands:
  all   Enabled all available options
  help  Print this message or the help of the given subcommand(s)

Arguments:
  <PATH>...  The path(s) you should provide

Options:
  -b, --bytes         Print the byte counts
  -c, --chars         Print the character counts
  -w, --words         Print the word counts
  -l, --lines         Print the line counts
  -L, --longest-line  Print the maximum line width (Unicode)
  -h, --help          Print help information
  -V, --version       Print version information
```

哇哦! 若你用这段文字, 对比下前面的 `src/cli.rs`, 会发现先前的文档注释, 在声明宏的威力下, 变成了 help 信息  
没错! clap 能自动帮你做很多事情, 包括但不限于通过文本注释来生成 help 信息  

如果你不想要 `about` 信息直接照搬 `Cargo.toml` 里的 `description` 怎么办? 没事, 直接覆写就行, 覆写的优先级更高:  

```rust
#[derive(Parser)]
#[command(
    about = "...",
// ......
// ......
```

并且, 像 author/version/about 等信息, 是通过读取 `Cargo.toml` 来获取的, 但在 v4 版本, clap 默认不显示, 以保持简洁  
你可以查看 [help_template](https://docs.rs/clap/latest/clap/builder/struct.Command.html#method.help_template) 知晓如何显示, 例子可能是 `builder形式`, 也就是非声明式, 但别慌张:  

你可以像这样将 builder形式 的代码转化为 derive形式:  

```rust
Command::new("myprog")
    .help_template("{bin} ({version}) - {usage}")

#[derive(Parser)]
#[command(
    help_template = "{bin} ({version}) - {usage}",
// ......
// ......
```

实际上, 宏的黑魔法, 就是将这些声明式代码, 在编译期转化为 builder 代码  

## 选项与参数
clap 能非常方便地以声明的方式, 定义选项/参数

### 选项
对于一个option, 比如 `-b/--bytes`, 你只需要这样写:  

```rust
/// Print the byte counts
#[arg(short, long)]
pub bytes: bool,
```

它由三部分组成:  

- 文档注释: help 中对该命令的解释
- `#[arg(short, long)]`: 该 option 具有短/长横杠的形式
- 类型为bool: 传入时默认的行为是将其设置为 true

如 help 中所示, 会生成如下内容:

```txt
Options:
  -b, --bytes         Print the byte counts
```

当你传入该参数时, `Cli` 实例中的 `bytes` 属性将被设置为 true  
你也可以自行指定 short/long 的名称, 不指定时, short取首字母, long取全部  

比如 `-l/--lines` 与 `-L/--longest-line`, 不指定时都是 `-l`, 编译会报错, 需要自己指定:  

```rust
/// Print the maximum line width (Unicode)
#[arg(short = 'L', long)]
pub longest_line: bool,
```

### 参数
当你没有添加 `short` 或 `long` 时, 自然就代表这是个 argument  

在这里, 我们唯一需要的参数, 是一个或多个路径, 因此我们使用 `Vec<PathBuf>` 来表示它, clap 会自动将参数解析为路径   
为了醒目, 我们将其显示在 help 中的名字, 改为大写的 `PATH`, 同时指定该参数必选, 防止路径数为0:  

```rust
/// The path(s) you should provide
#[arg(value_name = "PATH", required = true)]
pub paths: Vec<PathBuf>,
```

如果你不输入参数, 命令行就会优雅地显示错误, 友善地来提醒你:  

```bash
cargo run -- -b
```

```txt
error: The following required arguments were not provided:
  <PATH>...

Usage: rwc <--bytes|--chars|--words|--lines|--longest-line> <PATH>...

For more information try '--help'
```

但此时, 其实还有一个问题: 参数虽然被转化为 PathBuf, 但不存在的路径也是路径啊! 此时就应该报错才行  
没错, clap 只是负责帮我们生成 `进行转换的代码`  
但验证存在性等工作, 应该自己来完成, 毕竟 clap 又不知道这个参数会被拿去干啥 :)  

因此, 我们来学学如何使用自定义的参数解析器吧

## 参数解析器
有些疑问或许会萦绕在你的心头:  

- clap 是怎么进行解析的?
- clap 能否将传入的参数, 解析为自定义的类型呢?  
- 我们能否在用户穿参时, 检查参数是否合法, 非法的直接报错, 来提醒用户呢?

实际上, 你需要通过向名为 value_parser 的函数, 传入一个解析器, 通过调用该解析器来对参数进行解析与验证  
比如, 如果我们想验证传入的路径是否合法, 可以这样写:  

```rust
// ......
// ......
    /// The path(s) you should provide
    #[arg(value_parser = check_path, value_name = "PATH", required = true)]
    pub paths: Vec<PathBuf>,
// ......
// ......

fn check_path(filename: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(filename);
    if filename == "-" || path.exists() {
        Ok(path)
    } else {
        Err(format!("No such path: `{}`", path.display()))
    }
}
```

Good, 现在当你传入路径时, 程序会对路径进行验证, 若路径不存在, 那就返回一个错误  
该错误会在用户传入非法路径时, 作为报错信息出现:  

```bash
cargo run -- -b asdxxx
```

```txt
error: Invalid value "asd" for '<PATH>...': No such path: `asdxxx`

For more information try '--help'
```

于此同时, clap 已经为非常多的基本类型, 常用类型, 嵌套基本类型, 嵌套常用类型实现了非常多的 parser  
得益于此, 你可以为任何类型定义对应的 parser

## 参数关系
有时候, 我们可能会面临这样或那样的问题:  

- 当启用这个 option 时, 另外一个与其冲突的 option 不应该被启用
- 一个或多个指定的 option(s) 必须被启用
- 多个指定的 options 可以同时被启用

如何实现这些关系? 你可能会想自己手写, 但时间不应该浪费在这些事情上, 在 clap 中, 有着对应机制来处理这些事情  
它叫做 `参数关系(Argument Relations)`, 当参数不符合对应关系时, 会出现友善的报错信息, 提示用户应该如何修改  
因此, 我们可以使用 Arg/ArgGroup (参数与参数组) 来声明这些关系

实际上, 你先前在 `paths` 头上写的 `required = true`, 就是一种参数关系  

以我们的 `rwc` 举个例子:  
- `-b/-c/-w/-l/-L` 能同时出现, 即支持类似 `-b -c -w` 或 `-bcw` 的形式
- `-b/-c/-w/-l/-L` 至少出现其中一个, 防止只传路径不传 option 

任何一个 Arg 类型 (被 #[arg] 所修饰的), 或者 ArgGroup, 都能够声明这种参数间的关系  
我们可以新建一个 ArgGroup 的实例, 然后把先前的一坨 `-b/-c/-w/-l/-L` 都放入其中:  

```rust
// ......
// ......
#[derive(Parser)]
#[command(
    author, version, about, subcommand_negates_reqs = true,
    group(
        ArgGroup::new("options")
            .multiple(true)
            .required(true)
            .args(&[ "bytes", "chars", "words", "lines", "longest_line"])
    ),
)]
pub struct Cli {
    /// The path(s) you should provide
    #[arg(value_parser = check_path, value_name = "PATH", required = true)]
    pub paths: Vec<PathBuf>,
// ......
// ......
```

`multiple(true)` 表示可以同时出现参数组的成员, `required(true)` 表示至少传入该参数组中的其中一个成员  

## 子命令
我们还可以定义一个 subcommand, 用来启用所有的 options, 它也要接受一个路径作为参数  

```rust
pub struct Cli {
// ......
// ......
    #[command(subcommand)]
    pub sub_commands: Option<SubCommands>,
}

#[derive(Subcommand)]
pub enum SubCommands {
    /// Enabled all available options
    All {
        /// The path(s) you should provide
        #[arg(value_parser = check_path, value_name = "PATH", required = true)]
        paths: Vec<PathBuf>,
    },
}
```

你可以会想, 能不能让子命令复用 `Cli` 中定义的 `paths`, 减少重复代码呢?  
当然可以, 请在 `Cli` 的成员 `paths`, 头上的`#[arg]` 中添加 `global = true`, 表示该参数是全局性的, 相当于子命令中也添加了这么个参数  

但非常遗憾, 当设置 `global = true` 后, 就无法设置 `required = true` 了, 因此我们还是得定义一份相同的参数, 详见 [相关issue](https://github.com/clap-rs/clap/issues/1546)

**注意:**  
这里其实可以选择不定义 subcommand, 当没有传入 options 时默认开启所有 options, 来简化用户输入  
但本文还是定义了 subcommand 以便读者了解, 起演示作用


- - -
# 逻辑实现
根据:

```txt
   ├── wc_result.rs   # 计算并存储结果
   ├── cli.rs         # 命令行的定义
   ├── files.rs       # 读取文件
```

我们已经完成了对命令行的定义, 接下来要做的, 就是根据 Cli 的内容来实现逻辑了  
为了避免你回到前面看 `lib.rs` 的内容, 下面再贴一遍:  

<figcaption>src/lib.rs</figcaption>

```rust
use std::{collections::HashMap, path::PathBuf};

pub mod cli;
pub mod files;
pub mod wc_result;

pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;
pub type Counts = Vec<usize>;
pub type PathWithContent = HashMap<PathBuf, String>;
```

下面是对应模块的逻辑实现, 在我的博客中是以tab的形式呈现, 比较清晰, 其他平台未知:  

{% tabs 逻辑实现代码 %}

<!-- tab 读取文件 -->

<figcaption>src/files.rs</figcaption>

```rust
// 声明依赖
// 我写的时候遇见没有导入的, 也是直接用 lsp 来自动导入, 直接与后面的代码对照看会比较好
use crate::{PathWithContent, Result};
use indicatif::{MultiProgress, ProgressBar, ProgressStyle};
use rayon::prelude::*;
use std::ffi::OsStr;
use std::process;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::{
    fs::File,
    io::{BufReader, Read},
    path::PathBuf,
};


// `INPUTTED_FILE_NUMBER` 表示 INPUT 的编号, 是本文开篇的 asciinema 展示中的效果
// `BUFFER_SIZR` 表示每次读取文件时缓冲区的大小 (实现进度条)
static INPUTTED_FILE_NUMBER: AtomicUsize = AtomicUsize::new(0);
const BUFFER_SIZR: usize = 16 * 1024;


// 使用 trait 来扩展标准库中的 PathBuf 类型, 有两个函数, 一个检测是否是以点开头的, 一个加上点前缀
// 比如, 当你传入 `./build.rs` 与 `build.rs`, 前者输出时有点前缀, 后者没有, 因此统一下
// 并且当是从 stdin 读取的时候, 就显示无点前缀的 `Input/0` 会更清晰
trait PathExt {
    fn without_dotted_prefix(&self) -> bool;
    fn add_dotted_prefix(&mut self);
}

impl PathExt for PathBuf {
    fn without_dotted_prefix(&self) -> bool {
        self.is_relative() && !self.starts_with("../") && !self.starts_with("./")
    }

    fn add_dotted_prefix(&mut self) {
        *self = PathBuf::from_iter([OsStr::new("./"), self.as_os_str()]);
    }
}


// 读取文件的函数, 被暴露给其他模块, 参数是一个路径数组
pub fn read_files(paths: Vec<PathBuf>) -> Result<PathWithContent> {
    println!("Reading files / Getting content from stdin:");

    // 其实这里的 filter 不太好, 还可以判断目录与递归读取, 但暂时就这样吧
    let result = paths
        .into_par_iter()
        .filter(|path| path.is_file() || path.as_os_str() == "-")
        .map(|mut path| {
            let should_read_from_input = path.as_os_str() == "-";

            let content = get_content(&path, should_read_from_input);

            if path.without_dotted_prefix() {
                path.add_dotted_prefix();
            }

            if should_read_from_input {
                let inputted_file_number = INPUTTED_FILE_NUMBER.fetch_add(1, Ordering::SeqCst);
                path = PathBuf::from(format!("Input/{}", inputted_file_number));
            }

            let content = content.unwrap_or_else(|err| {
                eprintln!("{}: {}", path.display(), err);
                process::exit(1);
            });

            (path, content)
        })
        .collect();
    Ok(result)
}


// helper 函数, 针对单个路径
fn get_content(path: &PathBuf, should_read_from_input: bool) -> Result<String> {
    if should_read_from_input {
        read_from_stdin()
    } else {
        let bars = MultiProgress::new();
        let style =
            ProgressStyle::with_template("[{elapsed}][{percent}%] {bar:45.cyan/blue} {bytes} {wide_msg}")?
                .progress_chars(">-");
        read_file_with_progress(path, style, bars)
    }
}


// 读取对应路径的文件
fn read_file_with_progress(path: &PathBuf, style: ProgressStyle, bars: MultiProgress) -> Result<String> {
    let mut content = String::new();

    let file = File::open(path)?;
    let size = file.metadata()?.len();

    let bar = ProgressBar::new(size).with_message(format! {"Reading {}", path.display()}).with_style(style);
    let bar = bars.add(bar);

    let mut bufreader = BufReader::new(file);
    let mut buf = [0; BUFFER_SIZR];

    while let Ok(n) = bufreader.read(&mut buf) {
        if n == 0 {
            break;
        }
        bar.inc(n as u64);
        content += &String::from_utf8_lossy(&buf[..n]);
    }
    bar.finish_with_message("Done!");

    Ok(content)
}


// 从 stdin 中读取, 作为临时文件的内容
fn read_from_stdin() -> Result<String> {
    let mut content = vec![];
    std::io::stdin().read_to_end(&mut content)?;
    Ok(String::from_utf8(content)?)
}
```

<!-- endtab -->

<!-- tab  进行计算 -->

<figcaption>src/wc_result.rs</figcaption>

```rust
// 声明依赖
use crate::{
    cli::{Cli, SubCommands},
    files::read_files,
    Counts, Result,
};
use prettytable::{cell, format::consts::FORMAT_BOX_CHARS, Row, Table};
use rayon::prelude::*;
use std::{collections::HashMap, path::PathBuf, str};


// 存放被启用的 options, 与键值对
pub struct WcResult {
    enabled_options: Vec<&'static str>,
    paths_with_counts: HashMap<PathBuf, Counts>,
}


// 实例化函数
pub fn get(mut cli: Cli) -> Result<WcResult> {
    println!("Please waiting...\n");

    // 根据子命令进行相应操作
    match cli.sub_commands {
        Some(SubCommands::All { ref paths }) => {
            cli.paths = paths.clone();
            cli.enable_all_options();
        }
        None => cli.enable_all_options(),
    };

    // 进行计算
    println!("Calculating...");
    let wc_result = WcResult {
        enabled_options: cli.get_enabled_options(),
        paths_with_counts: {
            let contents = read_files(cli.paths.clone())?;
            contents.into_par_iter().map(|(path, content)| (path, calculate_counts(&cli, content))).collect()
        },
    };

    Ok(wc_result)
}


impl WcResult {
    // 将保存的信息转化为美化后的表格
    pub fn to_pretty_table(self) -> Table {
        let titles = {
            let enabled_options = self.enabled_options;
            let mut titles = Row::new(enabled_options.into_iter().map(|x| cell!(Fybi -> x)).collect());
            titles.insert_cell(0, cell!(Fybi -> "Path"));
            titles
        };

        let mut table = Table::new();
        table.set_titles(titles);
        table.set_format(*FORMAT_BOX_CHARS);

        for (path, counts) in self.paths_with_counts {
            let mut row = Row::new(counts.into_iter().map(|x| cell!(x)).collect());
            let path_cell = if path.starts_with("Input") {
                cell!(Fbb -> path.display())
            } else {
                cell!(Fmb -> path.display())
            };

            row.insert_cell(0, path_cell);
            table.add_row(row);
        }

        table
    }
}


// 不太懂 rayon, 暂时这样糊上去了
fn calculate_counts(cli: &Cli, content: String) -> Counts {
    let v: Vec<Option<usize>> = vec![None; 5];
    v.into_par_iter()
        .enumerate()
        .map(|(idx, _)| match idx {
            0 => cli.bytes.then_some(content.len()),
            1 => cli.chars.then_some(content.chars().count()),
            2 => cli.words.then_some(content.split_whitespace().count()),
            3 => cli.lines.then_some(content.lines().count()),
            4 => cli
                .longest_line
                .then_some(content.lines().map(unicode_width::UnicodeWidthStr::width).max().unwrap_or(0)),
            _ => None,
        })
        .flatten()
        .collect()
}
```

<!-- endtab -->

{% endtabs %}

然后就是 main 函数:  

<figcaption>src/main.rs</figcaption>

```rust
use clap::Parser;
use rust_wc::{cli::Cli, wc_result, Result};

fn main() -> Result<()> {
    let cli = Cli::parse();
    let pretty_table = wc_result::get(cli)?.to_pretty_table();
    pretty_table.printstd();
    Ok(())
}
```

- - -

# 自动补全
我们已经写好了命令行程序, 可以通过 -h/--help 查看帮助信息, 但能不能更方便地与 shell 集成呢?  
比如, 当你使用 bash/zsh/fish 时, 输入命令后点 Tab, 能帮你自动显示该命令的 flag/subcommand  

我们将使用 `clap_complete` 这个库, 在编译器生成特定于 shell 的自动补全文件 (也可以运行时生成, 自看 [clap_complete](https://docs.rs/clap_complete/latest/clap_complete/) 的文档)  
首先要修改 `Cargo.toml`, 在后面添加 [`build-dependencies`](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html#build-dependencies):  

<figcaption> Cargo.toml </figcaption>

```toml
[build-dependencies]
clap = {version = "4.0.29", features = ["derive"]}
clap_complete = "4.0.6"
```

在项目根目录下添加 `build.rs`, 内容如下:  

<figcaption> build.rs</figcaption>

```rust
use clap::CommandFactory;
use clap_complete::{generate_to, shells::*};
use std::error::Error;

include!("src/cli.rs");

fn main() -> Result<(), Box<dyn Error>> {
    let outdir = "completions";
    let app_name = "rwc";
    let mut cmd = Cli::command();

    generate_to(Bash, &mut cmd, app_name, outdir)?;
    generate_to(Zsh, &mut cmd, app_name, outdir)?;
    generate_to(Fish, &mut cmd, app_name, outdir)?;
    generate_to(Elvish, &mut cmd, app_name, outdir)?;
    generate_to(PowerShell, &mut cmd, app_name, outdir)?;

    Ok(())
}
```

目前, clap_complete 仅支持以上几种 shell, 更多的偏小众 shell, 一般以 `clap_complete_xxx` 的形式出现在 `crates.io` 上  
比如 `clap_complete_nushell`, 但亲测质量不佳, 不建议使用  

同时, 请确保项目根目录下存在 `completions` 目录, 随后运行 `cargo build`, 通过 `tree` 命令可以看到生成的补全文件:  

```txt
completions
├── _rwc
├── rwc.bash
├── rwc.elv
├── rwc.fish
└── _rwc.ps1
```

就酱, 本文结束啦!  
希望本文能帮到你, 让你快速了解使用 clap 的流程 :)
