+++
title = "gleam中的use表达式"
path = "posts/gleam-use-expression"
date = 2024-05-19
template = "page.html"
+++

> 了解下 gleam 语言中的 use 表达式吧
<!-- more -->

# 背景

gleam 是一门类型安全, 高度扩展, 语法友善, 表达力强的现代编程语言  
gleam 在 v0.25 版本中引入了一种期待已久的新功能: `use`  

当我们敲代码 `open` 一个 `File` 时, 使用完毕之后就得调用对应的 `close` 方法, 保证文件正确关闭  
倘若每次都得由程序员手动保证调用 `close`, 不仅繁琐而且容易出错  

在主流语言中, 你会发现各种各样的, 管理与释放资源的不同姿势:  

- go/zig 中的 `defer` 所修饰的语句, 将在函数/代码块结束之前被调用  
- java 中的 `try-with-resource`, 让实现了 `AutoClosable` 接口的实例在 `try-catch` 后自动调用 `close()` 方法  
- c# 中的 `using`, 作用于实现了 `IDisposable` 接口的实例, 编译器将 `using` 自动转换为等价的 `try-finally` 
- cpp/rust 中的 RAII, 让资源的生存期与变量的作用域相互绑定  
- ......  
- ......  

但是在 gleam 语言中, 已经存在了一个用于解决上述问题, 并且更加泛用的语法: `use`  
(类似的概念在其他语言中也存在, 这并非是 gleam 独创的, 借鉴了 ocaml, koka, roc, ml系列, 甚至 python)  

- - -

# 缩进问题

让我们来点例子, 假设存在这么一段代码:  

```gleam
pub fn login(credentials) {
  case authenticate(credentials) {
    Error(e) -> Error(e)
    Ok(user) ->
      case fetch_profile(user) {
        Error(e) -> Error(e)
        Ok(profile) -> render_welcome(user, profile)
      }
  }
}
```

`authenticate` 与 `fetch_profile` 会返回 `Result` 类型, 用 `Ok` 与 `Error` 分别表示成功与失败时的情况, 并包裹返回的值:  

```gleam
import gleam/io

pub type Result(a, e) {
  Ok(a)
  Error(e)
}

pub fn main() {
  let a = Error("error")
  let info = case a {
    Ok(_) -> "It's ok"
    Error(_) -> "It's error"
  }
  io.println(info)
}
```

再回过头去看前面的那段代码, 意思就是当前一步成功(Ok)时, 再运行下一步(Ok), 每一步失败时就返回错误(Error)  
但这有一个烦恼: 代码的缩进问题很严重, 倘若某个函数里调用了许多个会返回 `Result` 类型的函数......  

于是 gleam 在早期的 v-0.9 版本引入了 `try` 语法, 可以将前文的代码写成如下的等价形式:  

```gleam
// 当前一步失败时直接将 Error 作为这一段落的表达式, 无视后面的代码
pub fn login(credentials) {
  try user = authenticate(credentials)
  try profile = fetch_profile(user)
  render_welcome(user, profile)
}
```

这很好, 但仍然不够好, 缩进问题被解决了, 但没被完全解决, 要知道导致缩进复杂的情况还包括 `闭包/匿名函数/回调函数`:  

```gleam
pub fn handle_request(request: HttpRequest) {
  logger.span("handle_request", fn() {
    database.connection(fn(conn) {
      case request.method {
        Post ->
          case database.insert(conn, request.body) {
            Ok(record) -> created_response(record)
            Error(exc) -> bad_request_response(exc)
          }
        _ -> method_not_allowed_response()
      }
    })
  })
}
```

显而易见, 这段代码虽然条理清晰, 但实话实说看见的第一眼并不容易阅读, 也因为缩进问题而不够美观  
当这种 `闭包/匿名函数/回调函数` 一多起来, 就会出现著名的 `回调函数地域(callback-hall)`  

gleam 团队给出的解决方案就是新的 `use` 表达式, 在保持简单概念的同时, 一口气同时处理 `错误处理/回调函数/资源管理` 时的缩进问题:  

```gleam
pub fn handle_request(request: HttpRequest) {
  use <- logger.span("handle_request")
  use <- require_method(request, Post)
  use conn <- database.connection()

  case database.insert(conn, request.body) {
    Ok(record) -> created_response(record)
    Error(exc) -> bad_request_response(exc)
  }
}
```

下面将正式介绍 `use` 表达式的一些使用例子  

- - -

# use表达式

use 仅仅是一些语法糖, 它将后续的所有表达式转换为 `闭包/匿名函数`, 将此函数作为参数传递给 use 右侧的调用  

例如, 假设有一个函数 `with_file`, 打开一个文件, 进行读写, 然后关闭该文件:  

```gleam
fn open(file) {
  todo
}

fn close(file) {
  todo
}

// Define the function
pub fn with_file(path, handler) {
  let file = open(path)
  handler(file)
  close(file)
}

// Use it
pub fn main() {
  with_file("pokemon.txt", fn(file) {
    write(file, "Oddish\n")
    write(file, "Farfetch'd\n")
  })
}
```

`Note:`  
在 gleam 语言中, 小写的参数表示泛型, 类型会根据传入的参数自动推导, 因此上面的例子是可以编译的, 并非伪代码  

使用 `use` 无需额外缩进即可调用:  

```gleam
pub fn main() {
  use file <- with_file("pokemon.txt")
  write(file, "Oddish\n")
  write(file, "Farfetch'd\n")
}
```

(而且它不仅限于单个参数, 还可用于任何参数的函数, 包括不接受参数的函数)  

这个 use 表达式是高度通用的, 不限于任何特定类型, 接口, 因此它可以应用于许多不同的事物  

`Re-Note:`  
在 gleam 语言中, 小写的参数表示泛型, 类型会根据传入的参数自动推导, 因此看见下面例子中诸如 `defer` 时, 还请不要惊讶  

下面是一些小例子:  

- 编写 http 中间件:  

```gleam
pub fn require_method(request, method, continue) {
  case request.method == method {
    True -> continue()
    False -> method_not_allowed()
  }
}

pub fn handle_request(request) {
  use <- require_method(request, Post)
  // ...
}
```

- 复制 go/zig 等语言中的 `defer` 语法:  

```gleam
pub fn defer(cleanup, body) {
  body()
  cleanup()
}

pub fn main() {
  use <- defer(fn() { io.println("Goodbye") })
  io.println("Hello!")
}
```

- 复制 elixir/haskell/scala 等语言中的 `for-comprehension`:  

```gleam
import gleam/list

pub fn main() {
  use letter <- list.flat_map(["a", "b", "c"])
  use number <- list.map([1, 2, 3])
  #(letter, number)
}

// [
//   #("a", 1), #("a", 2), #("a", 3),
//   #("b", 1), #("b", 2), #("b", 3),
//   #("c", 1), #("c", 2), #("c", 3),
// ]
```

- 或者复制 gleam 自己的 try 表达式(目前已被use取代):  

```rust
pub fn attempt(result, transformation) {
  case result {
    Ok(x) -> transformation(x)
    Error(y) -> Error(y)
  }
}

pub fn main() {
  use user <- attempt(authenticate(credentials))
  use profile <- attempt(fetch_profile(user))
  render_welcome(user, profile)
}
```

- - -

# 总结

gleam 语言中的 `use` 是支持了 `句法变换(syntactic-transformation)` 这一概念的语法  
它相比较于主流语言更加泛用, 仅仅是函数应用的语法糖, 而非诸如 defer/using 等针对特定问题的特殊支持  

这种概念在函数式编程语言中较为常见, 如 ocaml 中的 `let*`, koka 中的 `with`, `roc` 中的 `backpassing`, 与 `use` 都是十分相似的概念  

`use` 使得嵌套(nested)的函数可以被轻松地扁平化(flatten)  

为了更加直观地体现这点, 我们可以编写一个函数 `twice`, 参数是一个闭包, 让该闭包可以运行两次:  

```gleam
import gleam/io

fn twice(f) {
  f()
  f()
}

fn main() {
  twice(fn() { io.print("Message ") })
}

// Message Message
```

使用 `use` 的等价写法:  

```gleam
fn main() {
  use <- twice()
  io.print("Message ")
}

// Message Message
```

当发生嵌套时(我们想调用两次, 三次, 更多次 `twice` 时), `use` 的优势会更加明显:  

```gleam
fn main() {
  twice(fn() { twice(fn() { twice(fn() { io.print("Message") }) }) })
}

// Message Message Message Message Message Message Message Message
```

```gleam
fn main() {
  use <- twice()
  use <- twice()
  use <- twice()
  io.println("Message")
}

// Message Message Message Message Message Message Message Message
```

于此同时, 因为 gleam 是门类型安全的语言, 我们在使用 use 时也会检查是否匹配类型的, 比如:  

```gleam
fn print(self: List(String)) {
  use <- bool.guard(when: self |> list.is_empty, return: io.print("Empty list"))

  use i <- list.each(self)
  io.println(i)
}
```

倘若当我们疏忽地写成了这样:  

```gleam
fn print(self: List(String)) {
  use <- bool.guard(when: self |> list.is_empty, return: "Empty list")

  use i <- list.each(self)
  io.println(i)
}
```

就会报错:  

```txt
Expected type:
    String

Found type:
    Nil
```


这里再来一个其他语言作为 `嵌套` 被 `扁平化` 的例子吧, 来自 rock 语言的 `backpassing`, 以下两段代码等价:  

```gleam
readLicense : Filename -> Task License File.ReadErr
readLicense = \filename ->
    Task.await (File.readUtf8 settingsFilename) \settingsYaml ->
        settingsYaml
            |> Yaml.decode settingsDecoder
            |> Task.fromResult
            |> Task.mapFail InvalidFormat
            |> Task.await \settings ->
                Task.await (File.readUtf8 settings.projectFilename) \projectCsv ->
                    projectCsv
                        |> Csv.decode projectDecoder
                        |> Task.fromResult
                        |> Task.mapFail InvalidFormat
                        |> Task.await \project ->
                            Task.await (File.readUf8 project.licenseFilename) \licenseStr ->
                                License.fromStr licenseStr
                                    |> Task.fromResult
                                    |> Task.mapFail InvalidFormat
```


```gleam
readLicense : Filename -> Task License File.ReadErr
readLicense = \filename ->
    settingsYaml <- Task.await (File.readUtf8 settingsFilename)

    settings <-
        settingsYaml
            |> Yaml.decode settingsDecoder
            |> Task.fromResult
            |> Task.mapFail InvalidFormat

    projectCsv <- Task.await (File.readUtf8 settings.projectFilename)

    project <-
        projectCsv
            |> Csv.decode projectDecoder
            |> Task.fromResult
            |> Task.mapFail InvalidFormat

    licenseStr <-
        Task.await (File.readUf8 project.licenseFilename)

    License.fromStr licenseStr
        |> Task.fromResult
        |> Task.mapFail InvalidFormat
```
