function throttled(fn, delay) {
  let timer = null
  let starttime = Date.now()
  return function() {
    let curTime = Date.now() // 当前时间
    let remaining = delay - (curTime - starttime)  // 从上一次到现在，还剩下多少多余时间
    let context = this
    let args = arguments
    clearTimeout(timer)
    if (remaining <= 0) {
      fn.apply(context, args)
      starttime = Date.now()
    } else {
      timer = setTimeout(fn, remaining);
    }
  }
}

function select_toc() {
  var toc = Array.from(document.querySelectorAll("h1,h2,h3,h4"));
  if (toc.length == 0) {
    return
  }

  var a;
  toc.forEach(anchor => {
    if (this.scrollY + 100 >= anchor.offsetTop) {
      a = anchor
      return
    }
  })

  if (a != undefined) {
    const href = "#" + a.id;
    a = document.querySelector(`.toc a[href='${href}']`)
  } else {
    a = document.querySelector(`.toc a`)
  }

  toc = Array.from(document.querySelectorAll(".toc a"))
  toc.forEach(anchor => { anchor.classList.remove("select-anchor") })
  a?.classList.add("select-anchor")

}

select_toc()
window.addEventListener("scroll", throttled( select_toc, 200))
