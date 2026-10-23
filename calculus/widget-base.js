// Tell the host page how tall this widget is, so its iframe never scrolls.
(function () {
  function post() {
    var el = document.querySelector(".widget");
    if (!el || window.parent === window) return;
    var h = Math.ceil(el.getBoundingClientRect().height);
    if (h > 40) window.parent.postMessage({ type: "calc-widget-height", height: h }, "*");
  }
  window.postWidgetHeight = post;
  window.addEventListener("load", function () { post(); setTimeout(post, 300); });
  var t;
  window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(post, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(post);
})();
