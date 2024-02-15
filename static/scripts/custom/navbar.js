const currentUrl = window.location.href; // 获取当前页面的URL
const navLinks = document.querySelectorAll('nav a'); // 获取所有导航链接

navLinks.forEach(link => {
  if (link.href === currentUrl) {
    link.classList.add('active'); // 添加active类名
  }
});
