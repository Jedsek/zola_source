// class: fold-close && fold-open

function codeblock() {

  const codeblockElements = document.querySelectorAll('pre code')
  codeblockElements.forEach(codeblock => {    
    const dot1 = document.createElement("div");
    const dot2 = document.createElement("div");
    const dot3 = document.createElement("div");
    const copy_btn = document.createElement("button");
    copy_btn.innerHTML = "复制";

    dot1.classList.add("mac", "b1")
    dot2.classList.add("mac", "b2")
    dot3.classList.add("mac", "b3")
    copy_btn.classList.add("code-btn")
    copy_btn.onclick = function() {
      navigator.clipboard.writeText(codeblock.textContent).then(async () => {
        copy_btn.innerText = "已复制"
        console.log('Content copied to clipboard');
        setTimeout(async () => { copy_btn.innerText = "复制" }, 1300)
      },() => {
        console.error('Failed to copy');
      });
    }


    const wrapper = document.createElement("figure")

    // if (wrapper.style.display != "none" || codeblock.style.display != "none") {
    //   console.log("fuck")
    // }

    codeblock.parentNode.insertBefore(wrapper, codeblock);

    wrapper.appendChild(dot1)
    wrapper.appendChild(dot2)
    wrapper.appendChild(dot3)
    wrapper.appendChild(copy_btn)

    const br = document.createElement("br")
    wrapper.appendChild(br)

    wrapper.classList.add("mac-wrapper")


    const fileName = codeblock.parentElement.previousElementSibling;

    if (fileName.nodeName == "FIGCAPTION") {
      const innerHtml = fileName.innerHTML.trim()
      fileName.innerHTML = `<div>${"~~>"} ${innerHtml}</div>`
      fileName.classList.add("mac-text");
      fileName.firstElementChild.setAttribute(
        "style", 
        "background-color:#282a36;font-style:normal;font-size:100%;line-height:1.3em;" + 
              "border-bottom-width:2px;padding-left:4px;"
      )
      codeblock.parentNode.insertBefore(fileName, codeblock)
    }

    const is_fold_open = fileName.classList.contains("fold-open");
    const is_fold_close = fileName.classList.contains("fold-close");
    const is_fold  = is_fold_open || is_fold_close;
    if (is_fold) {
      const fold_btn = document.createElement("button");
      if (is_fold_open) {
        fold_btn.innerHTML = "隐藏";
      } else {
        fold_btn.innerHTML = "展开";
        codeblock.style.display = "none"
      }
      fold_btn.classList.add("code-btn")
      fold_btn.onclick = function() {
        if (fold_btn.innerText == "隐藏") {
          fold_btn.innerText = "展开"
          codeblock.style.display = "none"
        } else {
          fold_btn.innerText = "隐藏"
          codeblock.style.display = "block"
        }
      }
      copy_btn.parentNode.insertBefore(fold_btn, copy_btn)
    }

  })
}

codeblock()
document.addEventListener("pjax:complete", () => codeblock())
