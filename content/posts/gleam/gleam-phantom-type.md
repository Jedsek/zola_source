+++
title = "gleam中的幽灵类型(phantom-type)"
path = "posts/gleam-phantom-type"
date = 2024-05-20
template = "page.html"
+++

> 了解下 gleam 语言中的幽灵类型(phantom-type)吧  

<!-- more -->

# 什么是幽灵类型

gleam 是门 `类型安全(type-safe)` 的语言, `幽灵类型(phantom-type)` 便是构成了此概念的部分技巧之一  
`phantom-type(幽灵类型)` 是指出现在类型定义中, 但不会用任何构造器会使用到它的类型参数:  

```gleam
pub type Xxx(phantom) {
  Xxx
}
```

在 `Xxx` 类型中, 我们有一个类型参数 `phantom`, 该参数未在任何地方被使用, 但是这种幽灵类型却可用于提供额外的安全性/上下文  
幽灵类型无需支付任何运行时成本, 全都在编译期被处理!  

> 💡 在某些语言中, 当类型具有未使用的类型参数时, 编译器可能会发出警告(或直接拒绝编译)  
> 通常有特定于语言的解决方案, 例如 rust 中的 `PhantomData` 或 typeScript 中的 `impossible-fields`  

以下是一些使用到了该技巧的例子:  

- - - 

# 处理ID
为了理解幽灵类型的用处, 让我们先从一个常见场景开始, 假设我们正在构建像 [dev.to](https://dev.to) 或 [medium.com](https://medium.com) 这样的社交博客平台  
我们希望支持不同的用户和博客, 因此为它们分配了唯一的 ID  

我们是家斗志昂扬, 快速发展的初创公司, 因此仅实施了最简单的 ID 管理系统: 只需为 `Int` 起一个类型别名, 即可让事情顺利进行:  

```gleam
type Id = Int
```

平台支持 reddit 风格的操作对帖子进行 up-voting/liking(点赞), 我们有个函数 `upvote` , 它接受被点赞的帖子与点赞者的ID:  

```gleam
fn upvote(user_id: Id, post_id: Id) {
  // 操作数据库, 更新谁谁谁点赞了那一篇帖子
  // ...
  // ...
}

let user_id: Int = 114514
let post_id: Int = 1919810

upvote(user_id, post_id)
```

这可以工作, 不过代价非常致命, 因为这里的代码并不存在任何的类型辅助, 也可以说这是个类型不安全的问题  
我们都知道 `114514` 是 `user_id`, 而 `1919810` 是 `post_id`, 所以连起来就是 `1145141919810`......  
倘若有一天你敲代码时, 脑子不小心昏了, 把两个参数传递错了位置:  

```gleam
let user_id: Int = 114514
let post_id: Int = 1919810

upvote(post_id, user_id)
```

你让帖子对用户进行了点赞! 你让 `1145141919810` 变成了 `1919810114514` !  你真该死啊!  


解决问题的方法之一是定义两个独立的类型, 而不是依靠类型别名:  

```gleam
type PostId { PostId(Int) }
type UserId { UserId(Int) }

fn upvote(user_id: UserId, post_id: PostId) {
  // ...
  // ...
}
```

但这会导致你需要为每个类型编写重复的代码, 比如 `next`, `to_int`, `from_string`......  
实际上, 无论我们如何使用它, Id 的基本表示的形式都保持不变, 我们更希望在 Id 的上下文中进行指定, 以此检验类型的合法性  
依靠前文所述的幽灵类型, 我们可以这样做:  

```gleam
type Id(kind) {  // <--- `kind` is a phantom type
  Id(id: Int)
}

type User
type Post

fn upvote(user_id: Id(User), post_id: Id(Post)){
  // ...
  // ...
}

pub fn example() {
  let user_id: Id(User) = Id(114514)
  let post_id: Id(Post) = Id(1919810)
  upvote(user_id, post_id)
}
```

现在的操作是类型安全的了, 当你交换两个参数的位置时便会报 `Type-mismatched` 的错误  
并且, 现在我们为 `Id` 类型实现一大堆通用的方法时, `Id` 仍然是个足够通用的概念:  

```gleam
fn new() -> Id(kind) {
  Id(0)
}

fn next(id: Id(kind)) -> Id(kind) {
  Id(id.id + 1)
}

fn from_int(id) -> Id(kind) {
  Id(id)
}

fn show(id: Id(kind)) -> String {
  id.id |> int.to_string
}

let a: Id(Float) = 1
show(a)  // 1

let b: Id(String) = 2
show(b)  // 2

let c: Id(Bool) = 3
show(c)  // 3
```

我们不用再写 `UserId`/`PostId`/`IntId`/`FloatId`/`StringId`/`BoolId` 等类型了  

- - - 

# 处理货币

让我们考虑另一种情况:  
我们想要构建一个应用, 可以交易不同币种的货币(美元, 人民币, 日元, 欧元等), 且需要通过汇率, 在使用它们前转换为相同单位的货币  

```gleam
type Currency(a) {
  Currency(Float)
}

fn from_float(n: Float) -> Currency(a) {
  Currency(n)
}

type USD
type GBP

fn example() {
  let dollars: Currency(USD) = from_float(2.5)
  let pennies: Currency(GBP) = from_float(0.55)
}
```

现在我们有一些货币, 但无法对它们做些什么  
虽然数值已经被包含在 `Currency` 类型中, 但我们无法进行运算, 或将被包裹的值传递给以 `Float` 作为参数的函数  

让我们编写两个函数来解决该问题: 编写 `update` 与 `combine` 来处理被包裹的内部的 `Float` 值  
我们将用 `update` 处理一个 `Currency`, 用 `combine` 处理两个相同币种的 `Currency`  

```gleam
fn from_float(n: Float) -> Currency(kind) {
  Currency(n)
}

fn update(a: Currency(a), f: fn (Float) -> Float) -> Currency(a) {
  let Currency(x) = a
  x |> f |> from_float
}

fn combine(a: Currency(a), b: Currency(a), f: fn (Float, Float) -> Float) -> Currency(a) {
  let Currency(x) = a
  let Currency(y) = b
  f(x, y) |> from_float
}
```

因为 `Currency` 的类型参数不会改变(这些函数接受 `Currency(a)` 并返回 `Currency(a)`, 所以它们始终操作并返回相同币种的货币  
(这就是幽灵类型在这里发挥的作用)  

> 💡 对于其他数据结构, 这些函数可以叫作 `map` 与 `map2`, 意味着类型可以更改: `list.map` 可用于将 `List(a)` 转换为 `List(b)`  
> 因为我们在这里拒绝将 `Currency(USD)` 转换为 `Currency(GBP)`, 始终保持 `Currency(a)`. 所以这些函数被起了不同的名称 :)  

我们可以使用这两个函数来定义更多的函数, 比如将 `Currency` 加倍, 或将两种不同币种的 `Currency` 相加:  

```gleam
pub fn double(a: Currency(a)) -> Currency(a) {
  update(a, fn (x) { x * 2 })
}

pub fn add(a: Currency(a), b: Currency(a)) -> Currency(a) {
  combine(a, b, fn (x, y) { x + y })
}
```

上面的代码, 我们始终只对相同币种(`Currency(a)`) 进行操作, 但如果我们想将两种货币加在一起呢?  
为此, 我们需通过汇率, 将一种货币转换为另一种货币, 我们可以在这里再次使用幽灵类型  

`Exchange` 类型描述了从某种货币到另一种货币的汇率:  

```gleam
type Exchange(from, to) {
  Exchange(Float)
}

fn exchange_rate(r: Float) -> Exchange(from, to) {
  Exchange(r)
}
```

现在, 就像我们对 `Currency` 所做的那样, 我们可以定义一些 `Exchange` 的实例:  

```gleam
let gbp_to_usd: Exchange(GBP, USD) = exchange_rate(1.41)
let usd_to_gbp: Exchange(USD, GBP) = exchange_rate(0.71)
```

我们利用所知道的关于幽灵类型的信息, 可以定义一个 `convert` 函数, 它是类型安全的, 因为我们永远无法输入错误的汇率, 所有幽灵类型都必须匹配!  

```gleam
pub fn convert(a: Currency(from), e: Exchange(from, to)) -> Currency(to) {
  let Currency(x) = a
  let Exchange(r) = e
  x *. r |> from_float
}
```

我们编写的函数对所有货币都是通用的, 并且这是类型安全的  

- - -

# 验证数据  

到目前为止, 我们已经看到 `Id`, `Currency` 这两个使用了幽灵类型作为技巧的类型, 调用者只需提供类型注释即可向编译器断言某物的类型  
这样做时, 编译器将停止在错误的位置, 拒绝使用两个类型不安全的值  

我们也可以将幽灵类型用于相反的目的, 以限制用户可以创建的类型, 并通过我们的代码进行验证, 然后推动用户做些事情  

```gleam
pub opaque type Password(kind) {
  Password(String)
}

pub type Invalid
pub type Valid

pub fn from_string(s: String) -> Password(Invalid) {
  Password(s)
}
```

与前面的实例不同, 之前是由用户来指定断言类型, 比如 `Id(User)`, 而我们自然也可以在库中使用  
在这段代码中, `Password` 是个 `opaque-type(不透明类型)`, 意味着只有定义了该类型的模块(同文件下), 才能构造与模式匹配该类型的值  
因此当用户使用了这个类型想要创建密码时, 只能通过 `from_string` 函数  

由用户传入的字符串所创建的密码, 默认未经验证, 所以在类型上是非法(Invalid)的, 用户需通过我们提供的验证手段来获得合法密码  

```gleam
pub type InvalidReason{
  TooLong
  TooShort
  NoNumber
  NoLetter
  // ...
  // ...
}

pub fn validate(password: Password(Invalid)) -> Result(Password(Valid), InvalidReason) {
  // ...
}

pub fn suggest(passwor: Password(Invalid)) -> String {
  // ...
}

pub fn create_user(username: String, password: Password(Valid)) -> User {
  // ...
}
```

上面再次呈现了一段类型安全的代码, 因为 `Password` 是 `opaque` 的, 所以用户必须通过 `validate` 来获取合法的密码  
`suggest` 函数为非法密码给出了一些建议, `create_user` 只接收合法密码并创建用户  

因为只有 `validate` 检验成功才能获得 `Password(Valid)`  
所以在其他使用了 `Password(Valid)` 的地方, 接收的密码一定是合法的  

对比以下这段代码:  

```gleam
pub type Password {
  // ...
}

pub fn is_valid(Pasword) -> Bool {
  // ...
}

pub fn create_user(username: String, password: Password) -> User {
  // ...
}
```

显而易见, 这段代码不是类型安全的: 你如何确保用户就一定会乖乖调用 `is_valid`, 而不是直接传入非法的代码呢?  
因此只好由库作者多做一些工作, 由我们来为用户调用 `is_valid`, 然后设计一些其他的 api 确保工作顺利......  

相比之下, 前一段代码直接将这些暴露出来交给了用户: 你爱调不调, 反正你不调用 `validate` 函数就永远得不到类型上合法的密码  

- - -

# 提供上下文  

在 gleam 中, 可能引发错误的函数通常使用 `Result` 类型与特定的 `Error` 类型进行包装, 后者描述了所有失败的可能原因  
当两个函数(假设是 `accept` 和 `listen`)可能引发不同错误时, 我们想为这两个函数创建对应的 `Error` 类型  

但两个函数之间共享部分错误时, 就会出现一个问题, 假设存在以下代码:  

```gleam
pub type AcceptError = {
  SystemLimit       // <-- Here
  Closed
  Timeout
  Posix(inet.Posix) // <-- Here
}

pub type ListenError = {
  SystemLimit        // <-- Here
  Posix(inet.Posix)  // <-- Here
}
```

同一模块中的不同类型, 不可能具有相同名称的变体, 否则编译器怎么知道 `SystemLimit` 到底是 `AcceptError` 还是 `ListenError`  
(...嗯, 这里其他语言的读者可能会觉得有些反直觉, 建议习惯适应一下)  

我们当然可以给每个变体添加特定的前缀, 或为它们创建单独的模块  
我们亦可以放弃特定于函数的 `Error` 类型而创建整个模块下的单一 `Error` 类型  

这些解决方案要么看起来太繁琐, 要么当需要共享类型时变得复杂, 要么失去了表达特定于某个函数的错误类型的能力  
但如果我们可以使用幽灵类型, 就可以启用一个新的选项:  


```gleam
pub type Error(from) {
  SystemLimit
  Closed
  Timeout
  Posix(inet.Posix)
}

pub opaque type AcceptFn { AcceptFn }
pub opaque type ListenFn { ListenFn }

pub fn accept() -> Error(AcceptFn) {
  // ...
}

pub fn listen() -> Error(ListenFn) {
  // ...
}
```

虽然这种方法无法带来额外的安全性, 但它确实为使用此功能的开发人员提供了上下文线索  
在处理与抛出 `listen` 的错误时, 他们知道他们可以安全地忽略 `Closed` 和 `Timeout` 错误, 只关注相关的错误  

通过幽灵类型来提供上下文线索, 这可能并不总是最好的设计决策, 但它确实在某些情况下在简单性和表现力之间取得了适当的平衡  

- - -

# 并非灵丹妙药

你可能渴望将幽灵类型应用于所有代码, 并利用额外的编译时安全性, 但在代码中使用它有一个注意点:  
我们不能基于幽灵类型对函数的行为进行分支  

为了举例说明这一点，请考虑 `Currency` 类型的 `to_string` 函数的不可能实现:  

```gleam
pub fn to_string (a: Currency(a)) -> String {
  let Currency(val) = a
  case a.phantom_type {
    USD -> string.concat("$", float.to_string(val))
    GBP -> string.concat("£", float.to_string(val))
    // ...
    // ...
  }
}
```

这是不可能的, 因为 `to_string` 函数必须保证对所有 `Currency(a)` 都是通用的, 我们无法根据 `a` 的实际类型来改变行为  

- - -

# 参考资料

- <https://blog.hayleigh.dev/phantom-types-in-gleam>
- <https://www.youtube.com/watch?v=3lYHFctx2Ks>
