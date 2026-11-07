/* One shared official-holiday loader for the clock and the Kansai holiday effects.
   Copies, all generated from the Cabinet Office CSV by the same Kansai importer
   (scripts/sync-japan-holidays.py):
     1) data/japan-holidays-official.json         - this site (tools/site_sync.py)
     2) assets/data/japan-holidays-official.json  - this site (Mac LaunchAgent)
     3) the Kansai site's public copy on GitHub Pages (Access-Control-Allow-Origin: *)
     4) this browser's last good copy (localStorage)
   Choice, in this order:
     a) only copies that pass validation are considered (a broken copy can never win);
     b) the copy that covers the later year wins (a newly published year);
     c) same coverage: the copy with the newer HTTP Last-Modified wins (an official correction
        inside the same years reaches the page as soon as any copy carries it);
     d) still equal or unknown: this site's copy, then the mirror, then the browser cache.
   A copy that is older or shorter than the browser's cached copy never replaces it, and when every
   request fails the cached copy is used. Years outside the official coverage are never guessed. */
(function () {
  var SOURCES = [
    { url: "https://raw.githubusercontent.com/iehovahao-web/ludwig529/main/assets/data/japan-holidays-official.json", from: "repository", rank: 4 },
    { url: "data/japan-holidays-official.json", from: "site", rank: 3 },
    { url: "assets/data/japan-holidays-official.json", from: "site", rank: 3 }
  ];
  var CACHE = "lc-holidays-official-v2";
  var DATE = /^\d{4}-\d{2}-\d{2}$/;

  function valid(d) {
    if (!d || d.schemaVersion !== 1 || !Array.isArray(d.holidays) || !d.holidays.length || !d.coverage) return false;
    var years = d.coverage.years;
    if (!Array.isArray(years) || !years.length || !DATE.test(String(d.coverage.through || ""))) return false;
    var maxYear = Math.max.apply(null, years.map(Number));
    if (String(d.coverage.through).slice(0, 4) !== String(maxYear)) return false;
    for (var i = 0; i < d.holidays.length; i++) {
      var h = d.holidays[i];
      if (!h || !DATE.test(String(h.date)) || !h.nameJa || years.indexOf(Number(String(h.date).slice(0, 4))) < 0) return false;
    }
    return true;
  }
  function stamp(lm) { var t = lm ? Date.parse(lm) : NaN; return isFinite(t) ? t : null; }
  function through(x) { return String(x.data.coverage.through); }
  // > 0 when a is better than b
  function compare(a, b) {
    if (through(a) !== through(b)) return through(a) > through(b) ? 1 : -1;
    if (a.modified != null && b.modified != null && a.modified !== b.modified) return a.modified > b.modified ? 1 : -1;
    return a.rank - b.rank;
  }
  function withTimeout(p, ms) {
    return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, ms); })]);
  }
  function get(src) {
    return withTimeout(fetch(src.url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      var modified = stamp(r.headers && r.headers.get ? r.headers.get("Last-Modified") : null);
      return r.json().then(function (d) {
        if (!valid(d)) throw new Error("invalid");
        return { data: d, from: src.from, rank: src.rank, modified: modified };
      });
    }), 8000).catch(function () { return null; });
  }
  function readCache() {
    try {
      var c = JSON.parse(localStorage.getItem(CACHE));
      if (c && valid(c.data)) return { data: c.data, from: "cache", rank: 1, modified: typeof c.modified === "number" ? c.modified : null };
    } catch (e) {}
    return null;
  }
  function publish(x, state) {
    var map = {};
    x.data.holidays.forEach(function (h) { map[h.date] = h.nameJa; });
    var years = x.data.coverage.years.map(Number);
    var out = { official: x.data, holidays: map, years: years, last_year: Math.max.apply(null, years),
      from: x.from, state: state, modified: x.modified != null ? new Date(x.modified).toISOString().slice(0, 10) : null };
    window.LC_holidayData = out;
    try { window.dispatchEvent(new CustomEvent("lc:holidays", { detail: out })); } catch (e) {}
  }

  var cached = readCache();
  Promise.all(SOURCES.map(get)).then(function (results) {
    var best = null;
    results.concat(cached ? [cached] : []).forEach(function (x) { if (x && (!best || compare(x, best) > 0)) best = x; });
    if (!best) {
      window.LC_holidayData = null;
      try { window.dispatchEvent(new CustomEvent("lc:holidays", { detail: null })); } catch (e) {}
      return;
    }
    if (best.from !== "cache") {
      try { localStorage.setItem(CACHE, JSON.stringify({ data: best.data, modified: best.modified, from: best.from })); } catch (e) {}
      publish(best, "ok");
    } else {
      publish(best, results.some(Boolean) ? "ok" : "cached");
    }
  });
})();
