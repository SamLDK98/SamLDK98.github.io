// Tell the host page how tall this widget is, so its iframe never scrolls.
(function () {
  function post() {
    var el = document.querySelector(".widget");
    if (!el || window.parent === window) return;
    var h = Math.ceil(el.getBoundingClientRect().height);
    if (h > 40) window.parent.postMessage({ type: "expo-widget-height", height: h }, "*");
  }
  window.postWidgetHeight = post;
  window.addEventListener("load", function () { post(); setTimeout(post, 300); });
  var t;
  window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(post, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(post);
})();

// Sliders: fill the track up to the thumb, and pulse the thumb until the reader first uses it.
(function () {
  function fill(r) {
    var min = +r.min || 0, max = r.max === "" ? 100 : +r.max, v = +r.value;
    r.style.setProperty("--pct", ((v - min) / (max - min) * 100) + "%");
  }
  function init() {
    document.querySelectorAll('input[type="range"]').forEach(function (r) {
      fill(r);
      r.classList.add("fresh");
      var stop = function () { r.classList.remove("fresh"); };
      r.addEventListener("pointerdown", stop); r.addEventListener("keydown", stop);
      r.addEventListener("input", function () { stop(); fill(r); });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
