function card() {

  const codeblockElements = document.querySelectorAll('pre code')
  codeblockElements.forEach(codeblock => {
    const dot1 = document.createElement("div");
    const dot2 = document.createElement("div");
    const dot3 = document.createElement("div");

    dot1.classList.add("mac", "b1")
    dot2.classList.add("mac", "b2")
    dot3.classList.add("mac", "b3")

    const wrapper = document.createElement("figure")

    codeblock.parentNode.insertBefore(wrapper, codeblock);

    wrapper.appendChild(dot1)
    wrapper.appendChild(dot2)
    wrapper.appendChild(dot3)

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

  })
}

card()
document.addEventListener("pjax:complete", () => card())
