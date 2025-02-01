+++
title = "CRDTs 如何让协作文本编辑成为 Zed 的核心"
path = "/posts/zed-blog-translation/crdts"
date = "2025-02-01"
template = "page.html"
+++

> 对博客 [How CRDTs make multiplayer text editing part of Zed's DNA](https://zed.dev/blog/crdts) 的翻译  
<!-- more -->

同系列翻译: [Zed's blog](/categories/zed-blog-translation)  

**进入翻译部分:**  

{{ img(src="https://zed.dev/img/post/crdts/preview.png" info="preview" scale=0.6) }}

<br>

程序员花费无数小时与他们的编辑器交互, 在你 commit/push 交付你的代码之前, 你必须先将手放在键盘上以将文本输入  
没有其他任何一个工具比编辑器更能影响你创建应用时的本能与触觉体验  

然而尽管编辑在程序员生涯中扮演着至关重要的角色, 但我从未找到我真正喜欢的编辑器, 所以 16 年前, 我打算自己构建一个  
一次失败的尝试, 无数惨痛的教训, 以及才华横溢的朋友们的帮助, 我一直努力构建的工具最终在 Zed 的 135 千行 rust 代码中浮现出来

Zed 的第一个目标很简单: 构建一个我们喜欢使用的编辑器, 一个始终高性能, 帮助我们而不是妨碍我们, 看起来很棒但也可能会消失的工具  
我们希望 Zed 站在文本编辑艺术的最前方, 结合其他编辑器的优势的同时, 避免它们的缺陷, 然后走得更远, 任何不足都不值得构建

但除开构建这些基础设施, 我们还看到了从根本上改变开发人员在协作方面的机会  
通过将 **协作** 集成为代码创作环境的首要关注, Zed 能更容易地将对话链接到任何文本, 无论是去年提及的还是不久前刚刚写的  
Zed 还将使 "编写代码" 和 "与其他开发人员实时讨论代码" 变得无缝!  

对多人协作开发的关注是 Zed 的关键特性之一, 因此在我们的第一篇博客中, 我们想探讨下这内置于编辑器核心的技术  

- - -

# 协作编辑的前史

在 1968 年的 12 月, Douglas Engelbart 在旧金山向只能站着的观众演示了一系列技术, 包括交互式编辑, 超文本, 鼠标, 他呈现的想法接下来塑造了现代计算  
但当第一次观看他著名的演示时, 我惊讶地发现让所有人都惊讶的系统实际上是一个 [协作文本编辑器](https://youtu.be/8UQyQ7Gvi4U?t=286)  
这正是我一直在努力构建的东西! 在 1968 年?!  

{{ img(src="https://user-images.githubusercontent.com/1789/199089574-148fdec3-7b8c-476b-b29f-7d398887907d.png" info="Bill Paxton 在交互式计算的初期与 Douglas Engelbart 视频聊天并协作编辑" scale=0.6) }}

为了构建他们的协作编辑器, Engelbart 的团队需要创建自己的编程语言/分时操作系统/阴极射线管显示器  
当着手构建 Zed 时, 我们的任务显然在几乎所有方面都比他们容易得多, 但我们确实遇到了一个他们没有的问题: 异步协调  

在 Engelbart 的系统中, 协作者通过单独的终端连接到同一台物理设备  
我不确定他们的工具是否曾支持过细粒度的并发编辑, 但至少在理论上它能用互斥锁将编辑同步到共享的缓冲区, 但这不是当今计算机的组织方式:  
我们并非通过直接连接的终端共享机器, 而是通过互联网连接个人计算机, 而且彼此间的距离要远得多  
即使以光速同步两个不同大陆间共享缓冲区的访问, 也会带来令人望而却步的编辑延迟  

- - -

# 异步协调的挑战

为了通过互联网进行协作, 我们需要一种方法: 允许某个人独立编辑自己的文本, 并在异步交换数据后让他们的文档收敛至相同内容  
事实证明, 这是个难题

下面的动画阐述了最基本的挑战的模样:  
我们从文本 `In 1968` 的两个 `replicas(副本)` 开始, 随后将不同内容插入到每个副本, 并将编的指令传输至另一个副本  
如果我们仅仅天真地远程编辑而一点不考虑并发更改, 最终可能会将其应用于无效的位置, 导致副本的内容发散  

{{ video(src="https://zed.dev/img/post/crdts/divergence.webm" info="存在并发时, 天真的复制操作会导致分歧" scale=0.6) }}  

- - -

# CRDT & 最终一致性

一种解决方案是: 用某种方式转换传入的编辑以反映并发更改  
在下面的动画中, 你能看见我们如何转换蓝色的插入，将其位置从 `8` 更改为 `20`

{{ video(src="https://zed.dev/img/post/crdts/ot.webm" info="`Operational Transformation` 侧重于转换传入的操作以考虑并发编辑" scale=0.6) }}  

这在概念上很简单, 但定义一个可以转换 `Operation` 的 "正确且高性能的函数" 并非易事  
这是计算机科学研究中的某个主题: `Operational Transformation(OT, 操作变换)`, 我们在 2017 年首次探索协作编辑时尝试了该方法  

**译者注:**  
一些文本编辑库中也存在类似的保持文本一致性的技术(Transaction), 但很多仅针对单用户场景, 不涉及冲突解决与并发操作  
如果你仅想了解单用户编辑时的正确性, 可以去读读具体代码, 比如 `helix` 的 [helix-core/src/transaction.rs](https://github.com/helix-editor/helix/blob/master/helix-core/src/transaction.rs)  
再如 `quill` 的 [delta](https://quilljs.com/docs/delta) 模型, 就将文本的转换抽象为三种指令: `insert`, `delete`, `retain`, 你可以基于此额外实现 OT  
再如 `CodeMirror` 也提供了对协作编辑的介绍: [传送门](https://codemirror.net/examples/collab/)  

但最终我们还是选择了另一个名为 `Conflict-Free Replicated Data Types(CRDTs, 无冲突复制数据类型)`的理论作为替代  
我们发现它更强大, 也更直观  

使用 `CRDT`，我们不通过变换并发的 `Operation`(以便以不同的顺序被应用), 而是去构建 "使并发操作本质上具有交换性" 的数据  
这允许我们直接将它们应用于任何副本, 而无需进行操作变换  

但是我们如何使文本编辑具有 **可交换性** 呢?  

关键是用 `logical locations(逻辑位置)` 而不是 `absolute offsets(绝对的偏移量)` 去表示编辑  
在上面的动画示例中, 当我们不用数字偏移量来描述插入位置, 而是通过 `content(上下文/内容)` 来描述它们时会发生什么?  
此时, "并发编辑是否移动了文本" 就已经变得无关紧要了, 因为我们只依赖 content 来解析 remote-edit 时的位置

{{ video(src="https://zed.dev/img/post/crdts/content-based-addresses.webm" info="如果能根据内容确定编辑位置, 那么就可以直接应用 `Operation` 而无需进行变换" scale=0.6) }}  

这种方法显然在实践中行不通, 因为文本 `68` 可能会出现多次, 并发的编辑也可能已经完全删除了这段被当作地址引用的 content  
要使用这种基于 content 的逻辑寻址, 我们需要在存在 "并发更改" 的情况下也依然持久有效的方法进行实现, 但该怎么做呢?

- - -

# 不稳定文本中的稳定引用  

根据缓冲区的当前内容表示逻辑位置的问题, 在于文本并不稳定  
但有一点是稳定的, 那就是 "编辑的历史记录"  

我们可以将每一段被插入的文本都视作不可变: 接下来的编辑可能会对文本进行拆分或删除, 但这不会改变最初插入的文本  
如果为每段插入分配一个唯一的 id, 那我们就可以将 id 与 offset(偏移量) 结合, 来明确引用插入文本中的某个 `logical-location`  
我们将这些 `(insertion id, offset)` 称为 `anchors(锚点)`  

为了确保 `insertion id` 的唯一性, 我们在创建每个副本时都分配某个唯一的 id, 然后将其与递增的序列号组合起来  
通过从副本的 id 继承唯一性, 副本可以并发地生成唯一的 `insertion id`, 避免了冲突风险  

{{ video(src="https://zed.dev/img/post/crdts/id-distribution.webm" info="将副本集中起来分配各自的 id 后, 每个副本就能独立生成唯一 id" scale=0.6) }}

当协作开始时，参与者会被分配副本的 id  
副本0 为缓冲区的初始文本分配 id `0.0`, 然后复制一份内容传输至 副本1  
这段初始文本, `0.0`, 是第一次的插入, 将在缓冲区的生命周期内保持不可变  

{{ video(src="https://zed.dev/img/post/crdts/crdt-start-collaborating.webm" info="缓冲区的初始文本总是由主机分配 id 为 `0.0`, 主机是 副本0, 它们将缓冲区复制给新加入的协作者" scale=0.6)}}

现在, 每个参与者并发地插入新文本, 通过相对于 `insertion 0.0` 的 `offset(偏移量)` 来描述新插入文本的位置  
每个新插入的文本都会被分配唯一的 id, 当 副本0 在偏移量 `3` 处插入 `insertion 0.0` 内的 `December of` 时, 标记为 `0.0` 的文本会分割为两部分  
副本1 将文本 `Douglas Engelbart` 追加至 `insertion 0.0` 的末尾(即偏移量 `8`)  
两位参与者还将他们的操作传输给另一方  

{{ video(src="https://zed.dev/img/post/crdts/crdt-concurrent-insertion-part-1.webm" info="`insertion` 被分配唯一的 id, 并描述其相对于现有 `insertion` 的位置, 本例中为初始的 `0.0`" scale=0.6) }}

现在, 副本还得应用彼此的 `operations`  
首先, 副本1 合并了 id 为 `0.1` 的红色 `insertion`, 将 `insertion 0.0` 一分为二, 如同 副本0 最初插入此文本时那样  
然后 副本0 合并了 id 为 `1.0` 的蓝色 `insertion`  

{{ video(src="https://zed.dev/img/post/crdts/crdt-concurrent-insertion-part-2.webm" info='同步远程 `operation` 时, 我们扫描本地文本以查找包含 "`parent insertion` 中指定 offset的 fragment"' scale=0.6) }}

它扫描其 `fragments(片段)`, 搜索 `insertion 0.0` 的偏移量 `8`  
第一个 fragment 属于 `0.0`, 但其长度只有 `3`, 第二个 fragment 属于不同的 `insertion 0.1` 因此跳过  
最后, 我们到达第二个包含来自 `insertion 0.0` 的 fragment, 它包含偏移量 `8`, 因此我们在其中插入蓝色文本, 副本得到收敛

该过程可以继续递归下去, `insertion` 在树中相互构建彼此  
在下面的动画中, 两个副本都在 id 为 `1.0` 的蓝色 `insertion` 中以不同偏移量插入其他文本  
为了应用这些远程的 `operation`, 我们再次扫描文本, 查找包含指定偏移量的 `insertion 1.0` 的 fragment  

{{ video(src="https://zed.dev/img/post/crdts/crdt-concurrent-insertion-part-3.webm" info="过去的 insertion 可以成为新的 `insertion` 的 parent" scale=0.6) }}  

在这些示例中, 我们一次插入多个字符, 但实践中, 协作者往往会插入单个字符, 而非直接从剪贴板上粘贴一整段文本  
以每个字符为单位跟踪所有元数据的开销似乎很大, 但实际上这在现代计算硬件上并非问题  
即使是很长的编辑历史也几乎无法与因 Zed 不使用 Electron 构建而节省的内存相提并论  

您可能还会问, 像这样扫描整个文档以应用远程 `operation` 不是会很慢吗?  
在以后的文章中, 我们将解释我们如何使用 `copy-on-write B-tree(写时复制的B树)` 来索引这些 fragments 以避免线性扫描  
以上的简化解释应该为你提供了一个基本框架, 让您了解到了协作编辑在 Zed 中是如何工作的  

- - -

# 删除

如果每个 `insertion` 都是不可变的, 那么当用户删除文本时, 我们如何从文档中删除文本?  
我们不改变插入的文本, 而是对想要删除的 fragment 添加 `tombstones(墓碑)` 的标记(即墓碑机制)  
在向用户渲染呈现文本时, 具有 `tombstones(墓碑)` 标记的 fragment 会被隐藏, 但它们仍可用于解析 `logical-anchors(逻辑锚点)` 为文档中的具体位置!

在下面的动画中, 我们在 副本1 中插入一段文本, 该位置在 副本0 中并发地被删除  
由于 "被删除的文本" 事实上仅仅被隐藏, 我们仍可以在 `insertion` 到达 副本0 时应用它

{{ video(src="https://zed.dev/img/post/crdts/insert-delete.webm" info="已删除的 fragment 其实被 `tombstones(墓碑)` 标记以进行隐藏" scale=0.6) }}

如果删除操作仅编码了一个区间, 那么在待删除区间内并发插入文本时, 就可能出现分歧  
在如下示例中, 请注意黄色的 `C`, 其在 副本0 中是可见的, 但在 副本1 中却被隐藏  

{{ video(src="https://zed.dev/img/post/crdts/delete-divergence.webm" info="如果在删除时未表示什么 `operation` 是可见的, 在待删除区间并发插入文本可能导致分歧" scale=0.6) }}  

为避免这个问题, 我们还需将 `deletion` 与 `vector timestamp(向量时间戳)` 进行关联  
该时间戳对每个副本最新观察到的序列号进行编码, 以便我们排除并发产生的的插入操作, 仅隐藏执行删除操作的用户实际可见到的文本  

下面的动画与上面的非常相似, 只是这次我们为删除操作增加了一个 `version vector(版本向量)`  
当我们在 副本1 上进行删除时, 我们会排除黄色的 `insertion`, 因为其 id 包含了未被删除操作的 `version vector` 所涵盖的序列号  
这导致黄色的 `insertion` 在两个副本上都保持可见, 从而保留了执行删除操作的用户的意图  

{{ video(src="https://zed.dev/img/post/crdts/delete-convergence.webm" info="将删除与版本向量相关联，可以让我们从逻辑删除中排除并发插入" scale=0.6) }}  

与 `insertion` 一样, `deletion` 也与唯一的 id 进行关联, 我们会将其记录在 `tombstone(墓碑)` 上  
稍后讨论 `undo(撤消)` 和 `redo(重做)` 操作时, 我们将了解这些 `deletion id` 的作用  

- - -

# 同一位置同时插入  

当插入并发地发生在同一位置上时, 我们并不关心如何对 `insertion` 进行排序的过程, 关键是它们得在所有副本中保持一致的顺序  
实现一致性的某种方法是按 `insertion id` 进行排序  

{{ video(src="https://zed.dev/img/post/crdts/order-insertions-by-id.webm" info="按 `insertion id` 对同一位置的 `insertion` 进行排序, 以实现在所有副本上保持一致顺序" scale=0.6) }}  

但该方法有个问题: 某些副本可能无法在已被观察到的 `insertion` 前插入文本  

{{ video(src="https://zed.dev/img/post/crdts/order-by-id-intention-violation.webm" info="若按 `insertion id` 在同一位置进行排序, 当插入到现有的 `insertion` 前面时, 无法保留用户的意图" scale=0.6) }}

这需要对这些 `insertion` 进行排序并尊重因果关系, 我们的解决方案是为 `insertion` 增加 `Lamport timestamps(Lamport 时间戳)`  
这些逻辑时间戳派生自在每个副本上维护的 `scalar-valued Lamport clock(标量 Lamport 时钟)`  

每当副本生成 `operation` 时, 它会通过其 `Lamport clock` 的自增来派生新的时间戳  
每当副本收到 `operation` 时, 它会将本地的 `Lamport clock` 设置为该 `clock` 的当前值与传入 `operation` 的时间戳中的较大者  

{{ video(src="https://zed.dev/img/post/crdts/lamport-clock.webm" info="如果某个 `operation` 在另一个 `operation` 被观察到后生成, 则其将具有较高的时间戳" scale=0.6) }}  

该机制保证了: 如果某个 `operation` 在另一个 `operation` 发生时已经存在, 则其将具有较低的时间戳  
换句话说: `Lamport 时间戳` 允许我们按因果顺序对 `operation` 进行排序  

但反过来并不成立: 当 `A` 的 `Lamport 时间戳` 低于 `B` 时, 不一定意味着 `A` 发生在 `B` 之前  
因为对于并发操作, 我们无法保证 `Lamport 时间戳` 之间的关系, 但我们实际上不关心并发插入是如何排序的, 只要排序是一致的就行


**译者注:**  
上述的 `一致性` 指各个副本中 `insertion` 的顺序是一样的, 要么都 `AB` 要么都 `BA`, 不会出现 副本0 中是 `AB`, 副本1 中是 `BA`  

通过按 `Lamport 时间戳` 对 `insertion` 进行降序排列, 并在时间戳相同时根据 `副本 ID` 进行区分, 我们实现了一种具有一致性且尊重因果关系的排序方案

{{ video(src="https://zed.dev/img/post/crdts/order-by-lamport.webm" info="按时间戳对在同一位置的 `insertion` 进行排序，则可以保留用户意图，且在所有副本中保持排序一致" scale=0.6) }}

- - -

# 撤销与重做

在非协作系统中，`undo(撤消)` 和 `redo(重做)` 的历史可表示为简单的记录 `operation` 的 `stack(栈)`  
当你想撤销时, 只需在 `undo stack(撤销栈)` 的顶部 pop 编辑的 `operation`, 将其逆版本的 `operation` 应用于当前文本, 然后 push 到 `redo stack(重做栈)`  
但这只允许整个文档具有单一的全局撤消历史  

历史中任何 `operation` 的 `offset` 仅在文档最初应用它时有效, 这意味着它必须严格按照发生的相反顺序进行撤销  

但在协作编辑时, 整个缓冲区使用单一的撤消历史并不可行, 您希望撤消您自己输入的文本, 因此每个参与者都需要自己的 `undo stack`  
这意味着我们需要能够以任意顺序进行 `undo/redo operation`, 一个记录编辑操作的全局共享 stack 是不够的  

相反，我们维护一个 `undo map(撤销映射表)`, 它将 `operation id` 与一个 `count(计数)` 关联起来:  
- 如果 `count` 为零, 则表示该 `operation` 尚未进行撤销  
- 如果 `count` 为奇, 则表示该 `operation` 已撤销(undo)  
- 如果 `count` 为偶, 则表示该 `operation` 已重做(redo)  

不管撤销还是重做, 都只是更新该映射表中特定 `operation id` 的 `count`  
当决定某个 fragment 的可见性时, 我们首先检查该 `insertion` 是否已撤消(`undo count` 是奇数)  
然后检查其是否被任何删除操作标记上 `tombstone(墓碑)`, 以及这些删除文本的 `undo count` 是否为偶数  

发生 `undo/redo operation` 时, 直接分配这些 `undo count` 是没有问题的, 当两个人同时 undo 了同一个 `operation`, 则最终会将 `undo count` 设置为相同的值  
这符合他们的意图，因为他们都想撤消或重做它, 事实上, 我们目前只允许用户撤销自己的 `operation`, 但最终可能可以撤销协作者的  

- - -

# 结论

显然还有更多内容值得深入探讨:  
我们现实里是如何高效地实现这个方案的?  
我们如何将 CRDT 集成到一个更广泛的系统中, 以制造共享工作区的错觉?  
我们如何使这样复杂的分布式系统可靠?
除了协作编辑, 我们还能用 CRDT 做什么呢?

然后是编辑器的其余部分, `Rope`, `gpui(我们的 gpu 加速框架)`, `tree-sitter`, 集成终端......  
我们期待着在未来能深入探讨这一切, 更重要的是, 我们期待着应用这些技术, 打造一个让您更快乐的高效编辑器  

感谢阅读!!  
