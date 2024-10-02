function image() {

	var imgElements = document.getElementsByTagName('img');

	for (var i = 0; i < imgElements.length; i++) {
		var imgElement = imgElements[i];
		var alt = imgElement.alt;

		if (alt.length != 0) {
			var caption = document.createElement('caption');

			caption.innerHTML = alt;
			caption.style.textAlign = "center";
			caption.style.display = "flow"
			caption.style.marginBottom = "1em"
			caption.style.color = "#bbb"
			caption.style.opacity = "0.9"
			caption.style.lineHeight = "1.1em"

			var fancybox = document.createElement('a');
			// fancybox.setAttribute("data-lightbox", "gallery");
			// fancybox.setAttribute("data-capation", alt);

			imgElement.parentNode.replaceChild(fancybox, imgElement);
			fancybox.appendChild(imgElement);

			fancybox.parentNode.insertBefore(caption, fancybox.nextSibling);
		}
	}
}

image()

document.addEventListener("pjax:complete", image)
