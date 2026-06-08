// The Journeys — an interactive Mapbox map of the "Children of Crisis"
// fieldwork. Token and geography both come from the Worker (/api/config,
// /api/map). Degrades to a readable notice if no token is configured.
(function () {
  "use strict";

  var mapEl = document.getElementById("map");
  var legendEl = document.getElementById("map-legend");
  var listEl = document.getElementById("journeys-list");
  var fallback = document.getElementById("map-fallback");
  if (!mapEl) return;

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  Promise.all([
    fetch("/api/config").then(function (r) { return r.json(); }),
    fetch("/api/map").then(function (r) { return r.json(); }),
  ]).then(function (res) {
    var token = (res[0] || {}).mapboxToken;
    var data = res[1] || {};
    if (!token || typeof mapboxgl === "undefined") return showFallback(data);
    buildMap(token, data);
    buildList(data);
  }).catch(function () { showFallback({}); });

  // --- Curved arc between two [lng,lat] points (quadratic bezier) ---
  function arc(from, to, n) {
    n = n || 48;
    var mx = (from[0] + to[0]) / 2, my = (from[1] + to[1]) / 2;
    var dx = to[0] - from[0], dy = to[1] - from[1];
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    // control point offset perpendicular to the chord, bowing the arc upward
    var off = len * 0.22;
    var cx = mx + (-dy / len) * off;
    var cy = my + (dx / len) * off;
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n, u = 1 - t;
      pts.push([
        u * u * from[0] + 2 * u * t * cx + t * t * to[0],
        u * u * from[1] + 2 * u * t * cy + t * t * to[1],
      ]);
    }
    return pts;
  }

  function buildMap(token, data) {
    mapboxgl.accessToken = token;
    var map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/light-v11",
      center: [-92, 36],
      zoom: 3.1,
      cooperativeGestures: true,
      attributionControl: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", function () {
      // Migration arcs (Vol. III)
      var arcFeatures = (data.arcs || []).map(function (a) {
        return { type: "Feature", properties: { label: a.label }, geometry: { type: "LineString", coordinates: arc(a.from, a.to) } };
      });
      map.addSource("arcs", { type: "geojson", data: { type: "FeatureCollection", features: arcFeatures } });
      map.addLayer({
        id: "arcs", type: "line", source: "arcs",
        paint: { "line-color": "#3f5e7a", "line-width": 2, "line-opacity": 0.55, "line-dasharray": [1, 1.6] },
      });

      // Fieldwork points
      map.addSource("places", { type: "geojson", data: data.points });
      map.addLayer({
        id: "places", type: "circle", source: "places",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 5, 6, 9],
          "circle-color": ["get", "color"],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fbf8f1",
          "circle-opacity": 0.92,
        },
      });
      map.addLayer({
        id: "place-labels", type: "symbol", source: "places",
        layout: {
          "text-field": ["get", "place"],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
          "text-size": 11, "text-offset": [0, 1.2], "text-anchor": "top",
          "text-optional": true,
        },
        paint: { "text-color": "#4a443a", "text-halo-color": "#f4efe6", "text-halo-width": 1.4 },
      });

      if (data.bounds) {
        map.fitBounds(data.bounds, { padding: 60, duration: 0 });
      }

      var popup = new mapboxgl.Popup({ closeButton: true, maxWidth: "300px" });
      function open(feature) {
        var p = feature.properties;
        popup.setLngLat(feature.geometry.coordinates)
          .setHTML(
            "<h3>" + esc(p.place) + "</h3>" +
            '<div class="pop-meta">' + esc(p.year) + "</div>" +
            "<p>" + esc(p.blurb) + "</p>" +
            (p.work ? '<a class="pop-link" href="library.html#' + esc(p.work) + '">In the Library →</a>' : ""))
          .addTo(map);
      }
      map.on("click", "places", function (e) { open(e.features[0]); });
      map.on("mouseenter", "places", function () { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "places", function () { map.getCanvas().style.cursor = ""; });

      // expose for the list below
      window.__colesMap = { map: map, open: open, points: data.points };
    });

    // Legend
    if (legendEl && data.legend) {
      legendEl.innerHTML = "<h4>The strands of the work</h4><ul>" +
        data.legend.map(function (l) {
          return '<li><span class="dot" style="background:' + esc(l.color) + '"></span>' + esc(l.label) + "</li>";
        }).join("") + "</ul>";
      legendEl.hidden = false;
    }
  }

  function buildList(data) {
    if (!listEl || !data.points) return;
    var feats = data.points.features || [];
    listEl.innerHTML = feats.map(function (f) {
      var p = f.properties;
      return '<button data-id="' + p.id + '" style="border-left-color:' + esc(p.color) + '">' +
        '<div class="jl-place">' + esc(p.place) + "</div>" +
        '<div class="jl-meta">' + esc(p.year) + "</div></button>";
    }).join("");
    listEl.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var id = +b.getAttribute("data-id");
      var ctx = window.__colesMap; if (!ctx) return;
      var feature = ctx.points.features.find(function (f) { return f.properties.id === id; });
      if (!feature) return;
      ctx.map.flyTo({ center: feature.geometry.coordinates, zoom: 5, speed: 0.8 });
      ctx.open(feature);
      ctx.map.getContainer().scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function showFallback(data) {
    mapEl.style.display = "none";
    if (legendEl) legendEl.hidden = true;
    if (fallback) fallback.hidden = false;
    buildList(data); // the list still works as a textual itinerary
  }
})();
