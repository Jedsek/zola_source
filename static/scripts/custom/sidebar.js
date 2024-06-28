function toggle_sidebar() {
  const sidebar = document.getElementsByClassName('sidebar')[0];
  if (sidebar.style.display == 'flex') {
    sidebar.style.display = 'none'
    console.log('hide sidebar')
  } else {
    sidebar.style.display = 'flex'
    console.log('show sidebar')
  }
}

const sidebar_button = document.querySelector(".float-botton-toggle-sidebar")
sidebar_button.addEventListener("click", () => {
  toggle_sidebar()
})
