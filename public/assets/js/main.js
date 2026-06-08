/* Small progressive-enhancement script: mobile nav + scroll reveal.
   The site is fully readable with JavaScript disabled. */
(function () {
  "use strict";

  // --- Mobile navigation toggle ---
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // --- Scroll reveal ---
  var revealEls = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || revealEls.length === 0) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  revealEls.forEach(function (el) { io.observe(el); });
})();
