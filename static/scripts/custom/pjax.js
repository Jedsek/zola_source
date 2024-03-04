/* global Pjax */
var pjax;



document.addEventListener("DOMContentLoaded", function() {
  pjax = new Pjax({
    // elements: 'a[target!=_blank])',   // 拦截正常带链接的 a 标签
    selectors: [".body", "title", ".content", ".toc", ".sidebar"],
    cacheBust: false,
  });
});

// function pjax_reload() {
//   //其他需要重新加载的函数也可以添加在这里
//     pjax = new Pjax({
//       selectors: [".body", "title", ".content", ".toc"],
//       cacheBust: false
//     });
//     console.log("Pjax initialized.", pjax);
// }

// // Pjax 完成后，重新加载上面的函数
// document.addEventListener("pjax:complete", function () {
//     pjax_reload();
// });
