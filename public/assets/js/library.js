// The Library — renders the live, archive-fed catalog and wires up
// "search inside" and "Ask the Archive". Fails softly to static links.
(function () {
  "use strict";

  var shelf = document.getElementById("shelf");
  var loading = document.getElementById("loading");
  var empty = document.getElementById("empty");
  var chipsEl = document.getElementById("chips");
  var state = { works: [], categories: {}, filter: "all" };

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  fetch("/api/works")
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      state.works = data.works || [];
      state.categories = data.categories || {};
      if (!state.works.length) throw new Error("empty");
      loading.hidden = true;
      renderChips();
      render();
    })
    .catch(function () {
      loading.hidden = true;
      empty.hidden = false;
    });

  function renderChips() {
    var cats = ["all"].concat(Object.keys(state.categories));
    chipsEl.innerHTML = cats.map(function (c) {
      var label = c === "all" ? "All Books" : state.categories[c];
      return '<button class="chip" data-cat="' + esc(c) + '" aria-pressed="' + (c === "all") + '">' + esc(label) + "</button>";
    }).join("");
    chipsEl.addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      state.filter = b.getAttribute("data-cat");
      Array.prototype.forEach.call(chipsEl.children, function (c) {
        c.setAttribute("aria-pressed", c === b);
      });
      render();
    });
  }

  function render() {
    var works = state.filter === "all"
      ? state.works
      : state.works.filter(function (w) { return w.category === state.filter; });

    // Group by category, in catalog order.
    var order = Object.keys(state.categories);
    var groups = {};
    works.forEach(function (w) { (groups[w.category] = groups[w.category] || []).push(w); });

    var html = "";
    order.forEach(function (cat) {
      if (!groups[cat]) return;
      if (state.filter === "all") html += '<h2 class="cat-head">' + esc(state.categories[cat]) + "</h2>";
      html += '<div class="shelf">' + groups[cat].map(card).join("") + "</div>";
    });
    shelf.innerHTML = html;
    wireInside();
  }

  function card(w) {
    var a = w.archive || {};
    var cover = a.coverUrl
      ? '<img class="cover" loading="lazy" src="' + esc(a.coverUrl) + '" alt="Cover of ' + esc(w.title) + '" onerror="this.replaceWith(Object.assign(document.createElement(\'div\'),{className:\'cover ph\',textContent:\'' + esc(w.title.slice(0, 18)) + '\'}))">'
      : '<div class="cover ph">' + esc(w.title.slice(0, 18)) + "</div>";

    var meta = [w.year, w.award ? '<span class="pulitzer">' + esc(w.award) + "</span>" : ""].filter(Boolean).join(" · ");

    var actions = [];
    if (a.readUrl) {
      actions.push('<a href="' + esc(a.readUrl) + '" target="_blank" rel="noopener">' +
        (a.restricted ? "Borrow on the Archive" : "Read on the Archive") + "</a>");
    } else {
      actions.push('<a href="https://archive.org/search?query=' + encodeURIComponent(w.title + " Coles") + '" target="_blank" rel="noopener">Find on the Archive</a>');
    }
    if (a.identifier) actions.push('<button type="button" class="toggle-inside" data-id="' + esc(a.identifier) + '">Search inside</button>');

    var inside = a.identifier
      ? '<div class="inside" data-id="' + esc(a.identifier) + '" hidden>' +
          '<form><input type="text" placeholder="Find a word or phrase in this book…" aria-label="Search inside ' + esc(w.title) + '"><button class="chip" type="submit">Go</button></form>' +
          '<ul class="hits"></ul></div>'
      : "";

    return '<article class="book" id="' + esc(w.slug) + '">' +
      cover +
      '<div class="bk-body">' +
        "<h3>" + esc(w.title) + "</h3>" +
        (w.subtitle ? '<div class="bk-sub">' + esc(w.subtitle) + "</div>" : "") +
        '<div class="bk-meta">' + meta + "</div>" +
        '<p class="bk-blurb">' + esc(w.blurb || a.description || "") + "</p>" +
        '<div class="bk-actions">' + actions.join("") + "</div>" +
      "</div>" + inside +
    "</article>";
  }

  function wireInside() {
    Array.prototype.forEach.call(document.querySelectorAll(".toggle-inside"), function (btn) {
      btn.addEventListener("click", function () {
        var panel = btn.closest(".book").querySelector(".inside[data-id='" + btn.getAttribute("data-id") + "']");
        if (panel) { panel.hidden = !panel.hidden; if (!panel.hidden) panel.querySelector("input").focus(); }
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll(".inside form"), function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var panel = form.closest(".inside");
        var id = panel.getAttribute("data-id");
        var q = form.querySelector("input").value.trim();
        var hits = panel.querySelector(".hits");
        if (!q) return;
        hits.innerHTML = "<li>Searching…</li>";
        fetch("/api/archive/inside?id=" + encodeURIComponent(id) + "&q=" + encodeURIComponent(q))
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (!d.matches || !d.matches.length) {
              hits.innerHTML = '<li>No matches indexed. <a href="' + esc(d.readerUrl) + '" target="_blank" rel="noopener">Search inside the reader →</a></li>';
              return;
            }
            hits.innerHTML = d.matches.slice(0, 8).map(function (m) {
              return "<li>…" + esc(m.text) + "… " + (m.page ? '<span class="pg">p. ' + esc(m.page) + "</span>" : "") + "</li>";
            }).join("") + '<li><a href="' + esc(d.readerUrl) + '" target="_blank" rel="noopener">Open all results in the reader →</a></li>';
          })
          .catch(function () {
            hits.innerHTML = '<li>Search unavailable. <a href="https://archive.org/details/' + esc(id) + '" target="_blank" rel="noopener">Open the book →</a></li>';
          });
      });
    });
  }

  // ---- Ask the Archive ----
  var askForm = document.getElementById("ask-form");
  var askInput = document.getElementById("ask-input");
  var askAnswer = document.getElementById("ask-answer");
  if (askForm) {
    askForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = askInput.value.trim();
      if (!q) return;
      askAnswer.hidden = false;
      askAnswer.innerHTML = "<em>Considering his work…</em>";
      fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (!res.ok) {
            askAnswer.innerHTML = "<p>" + esc(res.d.error || "Unavailable.") +
              (res.d.hint ? '</p><p class="src">' + esc(res.d.hint) + "</p>" : "</p>");
            return;
          }
          var sources = (res.d.sources || []).map(function (s) { return esc(s.title); }).join(" · ");
          askAnswer.innerHTML = "<p>" + esc(res.d.answer).replace(/\n/g, "<br>") + "</p>" +
            (sources ? '<p class="src">Grounded in: ' + sources + "</p>" : "");
        })
        .catch(function () { askAnswer.innerHTML = "<p>Something went wrong reaching the guide.</p>"; });
    });
  }
})();
