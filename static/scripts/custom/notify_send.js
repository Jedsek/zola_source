let last_timeout_id = null

function notify_send(content, timeout) {
	if (last_timeout_id !== null) {
		clearTimeout(last_timeout_id)
	}
	
	const notification = document.querySelector(".notification");
	const notification_content = document.querySelector(".notification-content");

	notification.style.visibility = "visible"
  notification_content.textContent = content

  last_timeout_id = setTimeout(async () => { notification.style.visibility = "hidden" }, timeout)
}

addEventListener("copy", (_event) => {
	notify_send("喂, 文本已经复制好了", 2500)
});
