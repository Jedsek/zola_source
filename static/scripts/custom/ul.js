function set_ul() {
	const uls = document.querySelectorAll(".navigation ul");
	uls.forEach(ul => {
		var is_todo = false;
		for (const li of ul.childNodes) {
			const children = Array.prototype.slice.call(li.childNodes, 0);
			const has_input = children.some(child => {
				return child.tagName == 'INPUT'
			})
			if (has_input && !is_todo) {
				is_todo = true
				break
			}
		}
		if (is_todo) {
			ul.classList.add("todo-list")
		}
	})

	uls.forEach(ul => {
		for (const li of ul.childNodes) {
			const children = li.childNodes

			const array = Array.prototype.slice.call(li.childNodes, 0);
			const has_input = array.some(child => {
				return child.tagName == 'INPUT'
			})
			children.forEach(child => {
				if (child.tagName == 'P') {
					const inner = child.lastChild
					console.log(inner)
					li.removeChild(child)
					li.appendChild(inner)
					if (!has_input) {
						ul.removeChild(li)
						const new_ul = document.createElement("ul");
						new_ul.innerHTML = `<li> ${inner.textContent} </li>`;
						new_ul.style = "list-style: disc;padding-left: 28px;margin-top: 54px;margin-bottom: 12px;"
						ul.parentElement.insertBefore(new_ul, ul.nextSibling)
					}
				}
			})
		}
	})
}

set_ul()
document.addEventListener("pjax:complete", () => set_ul())
