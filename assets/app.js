/*
 * app.js — rendering, scoring, storage and export.
 * No framework, no build step. Reads its model from rubric.js.
 */
(function () {
  "use strict";

  var STORE = "gender-equity-rubric";
  var THEME = "gender-equity-rubric.theme";
  var PARTS = window.RUBRIC;
  var META = window.RUBRIC_META;

  var DIMS = [];
  var INDS = [];
  PARTS.forEach(function (p) {
    p.dims.forEach(function (d) {
      d.part = p;
      DIMS.push(d);
      d.inds.forEach(function (i) { i.dim = d; INDS.push(i); });
    });
  });

  /* ----------------------------------------------------------- utilities */

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function uid() {
    return "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function today() { return new Date().toISOString().slice(0, 10); }

  function bandFor(score) {
    var out = META.bands[0].label;
    META.bands.forEach(function (b) { if (score >= b.min) out = b.label; });
    return out;
  }

  function download(name, mime, text) {
    var blob = new Blob([text], { type: mime + ";charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "assessment";
  }

  /* ------------------------------------------------------------- storage */

  var state;

  function blank(name) {
    return { id: uid(), name: name || "Untitled assessment", created: today(), updated: today(), scores: {} };
  }

  function fresh() {
    var a = blank("New assessment " + today());
    var s = { v: 1, activeId: a.id, assessments: {} };
    s.assessments[a.id] = a;
    return s;
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) return fresh();
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.assessments || !Object.keys(parsed.assessments).length) return fresh();
      if (!parsed.assessments[parsed.activeId]) parsed.activeId = Object.keys(parsed.assessments)[0];
      return parsed;
    } catch (e) {
      return fresh();
    }
  }

  function persist() {
    try {
      active().updated = today();
      localStorage.setItem(STORE, JSON.stringify(state));
    } catch (e) {
      /* private browsing or a full quota: the session still works, it just
         will not survive a reload. */
    }
  }

  function active() { return state.assessments[state.activeId]; }

  function entry(indId) {
    var s = active().scores;
    if (!s[indId]) s[indId] = {};
    return s[indId];
  }

  /* -------------------------------------------------------------- theme */

  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    $("btnTheme").textContent = t === "dark" ? "Light" : "Dark";
    try { localStorage.setItem(THEME, t); } catch (e) {}
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME); } catch (e) {}
    if (!saved) {
      saved = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    applyTheme(saved);
  }

  /* ------------------------------------------------------------ scoring */

  function results() {
    var rows = [], earned = 0, available = 0, rated = 0;

    DIMS.forEach(function (d) {
      var vals = [], nas = 0;
      d.inds.forEach(function (i) {
        var e = active().scores[i.id];
        if (!e) return;
        if (e.v === "na") nas++;
        else if (typeof e.v === "number") vals.push(e.v);
      });

      rated += vals.length;
      var allNa = nas === d.inds.length;
      var scorable = d.inds.length - nas;

      if (!allNa) available += d.weight;

      if (!vals.length) {
        rows.push({ dim: d, rated: 0, scorable: scorable, mean: null, pts: null, allNa: allNa });
        return;
      }

      var mean = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
      var pts = (mean / 4) * d.weight;
      earned += pts;
      rows.push({ dim: d, rated: vals.length, scorable: scorable, mean: mean, pts: pts, allNa: false });
    });

    var total = available > 0 ? (earned / available) * 100 : 0;
    return { rows: rows, total: total, available: available, rated: rated, any: rated > 0 };
  }

  /* ------------------------------------------------------------ rendering */

  function renderStatic() {
    $("ramp").innerHTML = META.scale.map(function (s) {
      return '<div><span class="chip"></span>' +
        '<span class="n">' + s.n + '</span>' +
        '<span class="nm">' + esc(s.name) + '</span>' +
        '<span class="gl">' + esc(s.gloss) + '</span></div>';
    }).join("");

    $("cautions").innerHTML = window.RUBRIC_CAUTIONS.map(function (c) {
      return "<li><b>" + esc(c[0]) + "</b> " + esc(c[1]) + "</li>";
    }).join("");

    $("nav").innerHTML = PARTS.map(function (p) {
      return '<div class="rail-group">' + esc(p.title) + " &middot; " + p.weight + " pts</div>" +
        p.dims.map(function (d) {
          return '<a href="#dim-' + d.id + '" data-dim="' + d.id + '">' +
            '<span class="id">' + d.id + '</span>' +
            '<span class="nm">' + esc(d.name) + "</span>" +
            '<span class="pt" id="rp-' + d.id + '">&mdash;</span></a>';
        }).join("");
    }).join("") +
      '<div class="rail-group"><a href="#summary" style="padding-left:0">Score summary</a></div>';

    $("rubric").innerHTML = PARTS.map(function (p) {
      return '<section class="part">' +
        '<div class="part-head"><h2>' + esc(p.title) + "</h2>" +
        '<span class="pts">' + p.weight + " of 100 points</span></div>" +
        '<p class="part-intro">' + esc(p.intro) + "</p>" +
        p.dims.map(dimHTML).join("") +
        "</section>";
    }).join("");
  }

  function dimHTML(d) {
    return '<article class="dim" id="dim-' + d.id + '">' +
      '<div class="dim-head">' +
        '<span class="id">' + d.id + "</span>" +
        '<div class="body"><h3>' + esc(d.name) + "</h3>" +
        '<p class="purpose">' + esc(d.purpose) + "</p></div>" +
        '<div class="dim-score"><b id="ds-' + d.id + '">&mdash;</b>' +
        "<span>of " + d.weight + " pts</span></div>" +
      "</div>" +
      d.inds.map(indHTML).join("") +
      "</article>";
  }

  function indHTML(i) {
    return '<div class="ind">' +
      '<p class="ind-title"><span class="id">' + i.id + "</span>" + esc(i.name) + "</p>" +
      '<p class="ind-metric"><b>Evidence.</b> ' + esc(i.metric) + "</p>" +
      '<div class="anchors">' +
        i.anchors.map(function (a, n) {
          return '<button type="button" class="anchor" data-ind="' + i.id + '" data-v="' + n +
            '" aria-pressed="false"><span class="dot">' + n + "</span><span>" + esc(a) + "</span></button>";
        }).join("") +
      "</div>" +
      '<div class="ind-foot">' +
        '<button type="button" class="mini" data-na="' + i.id + '" aria-pressed="false">Not applicable</button>' +
        '<button type="button" class="mini" data-note="' + i.id + '">Evidence note</button>' +
      "</div>" +
      '<textarea id="nt-' + i.id + '" hidden placeholder="Where does this rating come from? Cite the document, dataset or decision record."></textarea>' +
      "</div>";
  }

  /* ------------------------------------------------------------- painting */

  function paint() {
    // selection state
    document.querySelectorAll(".anchor").forEach(function (b) {
      var e = active().scores[b.dataset.ind];
      b.setAttribute("aria-pressed", e && e.v === Number(b.dataset.v) ? "true" : "false");
    });

    document.querySelectorAll("[data-na]").forEach(function (b) {
      var e = active().scores[b.dataset.na];
      b.setAttribute("aria-pressed", e && e.v === "na" ? "true" : "false");
    });

    document.querySelectorAll("[data-note]").forEach(function (b) {
      var e = active().scores[b.dataset.note];
      var has = !!(e && e.note && e.note.trim());
      b.classList.toggle("has-note", has);
      b.textContent = has ? "Evidence note saved" : "Evidence note";
      var ta = $("nt-" + b.dataset.note);
      if (ta && ta.hidden) ta.value = (e && e.note) || "";
    });

    var r = results();

    // per-dimension figures
    r.rows.forEach(function (row) {
      var big = $("ds-" + row.dim.id);
      var small = $("rp-" + row.dim.id);
      var text = row.allNa ? "n/a" : (row.pts === null ? "\u2014" : row.pts.toFixed(1));
      if (big) big.textContent = text;
      if (small) small.textContent = text;
    });

    // headline
    $("tNum").innerHTML = (r.any ? Math.round(r.total) : "&mdash;") + "<small>/100</small>";
    $("tBand").textContent = r.any ? bandFor(r.total) : "Not yet scored";
    $("tProg").textContent = r.rated + " of " + INDS.length + " rated";
    $("tBar").style.width = (r.any ? r.total : 0) + "%";

    // summary table
    $("sumBody").innerHTML = r.rows.map(function (row) {
      return "<tr><td>" + row.dim.id + " " + esc(row.dim.name) + "</td>" +
        '<td class="n">' + row.rated + "/" + row.scorable + "</td>" +
        '<td class="n">' + (row.mean === null ? "\u2014" : row.mean.toFixed(2)) + "</td>" +
        '<td class="n">' + (row.allNa ? "n/a" : row.dim.weight) + "</td>" +
        '<td class="n">' + (row.pts === null ? "\u2014" : row.pts.toFixed(1)) + "</td></tr>";
    }).join("") +
      '<tr class="total"><td>Total' +
      (r.available < 100 ? " (of " + r.available + " applicable)" : "") + "</td>" +
      '<td class="n">' + r.rated + "/" + INDS.length + '</td><td class="n"></td>' +
      '<td class="n">' + r.available + '</td>' +
      '<td class="n">' + (r.any ? Math.round(r.total) : "\u2014") + "</td></tr>";

    // bar chart
    $("bars").innerHTML = r.rows.map(function (row) {
      var pct = row.mean === null ? 0 : (row.mean / 4) * 100;
      return '<div class="barrow"><span class="lbl">' + row.dim.id + " " + esc(row.dim.name) + "</span>" +
        '<span class="tr"><i style="width:' + pct + '%"></i></span>' +
        '<span class="v">' + (row.mean === null ? "\u2014" : row.mean.toFixed(2) + "/4") + "</span></div>";
    }).join("");
  }

  function paintPicker() {
    var ids = Object.keys(state.assessments).sort(function (a, b) {
      return state.assessments[a].name.localeCompare(state.assessments[b].name);
    });
    $("pick").innerHTML = ids.map(function (id) {
      return '<option value="' + id + '"' + (id === state.activeId ? " selected" : "") + ">" +
        esc(state.assessments[id].name) + "</option>";
    }).join("");
    document.title = active().name + " \u2014 Gender equity rubric";
  }

  /* --------------------------------------------------------------- export */

  function exportJSON() {
    var r = results();
    var payload = {
      instrument: { title: META.title, version: META.version },
      assessment: {
        name: active().name,
        created: active().created,
        exported: today()
      },
      result: {
        total: r.any ? Math.round(r.total * 10) / 10 : null,
        band: r.any ? bandFor(r.total) : null,
        weightApplicable: r.available,
        indicatorsRated: r.rated,
        indicatorsTotal: INDS.length
      },
      dimensions: r.rows.map(function (row) {
        return {
          id: row.dim.id,
          name: row.dim.name,
          weight: row.dim.weight,
          mean: row.mean === null ? null : Math.round(row.mean * 100) / 100,
          earned: row.pts === null ? null : Math.round(row.pts * 10) / 10
        };
      }),
      indicators: INDS.map(function (i) {
        var e = active().scores[i.id] || {};
        return {
          id: i.id,
          dimension: i.dim.id,
          name: i.name,
          score: e.v === undefined ? null : e.v,
          note: e.note || ""
        };
      })
    };
    download(slug(active().name) + "-" + today() + ".json", "application/json",
      JSON.stringify(payload, null, 2));
  }

  function csvCell(v) {
    v = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  function exportCSV() {
    var lines = [["part", "dimension_id", "dimension", "dimension_weight",
      "indicator_id", "indicator", "score", "note"].join(",")];
    INDS.forEach(function (i) {
      var e = active().scores[i.id] || {};
      lines.push([
        i.dim.part.title, i.dim.id, i.dim.name, i.dim.weight,
        i.id, i.name, e.v === undefined ? "" : e.v, e.note || ""
      ].map(csvCell).join(","));
    });
    download(slug(active().name) + "-" + today() + ".csv", "text/csv", lines.join("\n"));
  }

  function importJSON(text) {
    var data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      alert("That file is not valid JSON. Export a file from this tool and try again.");
      return;
    }
    if (!data || !Array.isArray(data.indicators)) {
      alert("That JSON does not contain an indicators list, so there is nothing to import.");
      return;
    }
    var known = {};
    INDS.forEach(function (i) { known[i.id] = true; });

    var a = blank((data.assessment && data.assessment.name ? data.assessment.name : "Imported") + " (imported)");
    var kept = 0, skipped = 0;
    data.indicators.forEach(function (row) {
      if (!row || !known[row.id]) { skipped++; return; }
      var v = row.score;
      var ok = v === "na" || (typeof v === "number" && v >= 0 && v <= 4);
      if (v === null || v === undefined) { if (row.note) { a.scores[row.id] = { note: String(row.note) }; } return; }
      if (!ok) { skipped++; return; }
      a.scores[row.id] = { v: v, note: row.note ? String(row.note) : "" };
      kept++;
    });

    state.assessments[a.id] = a;
    state.activeId = a.id;
    persist();
    paintPicker();
    paint();
    alert("Imported " + kept + " ratings." + (skipped ? " " + skipped + " entries were skipped because they did not match this rubric version." : ""));
  }

  /* ---------------------------------------------------------------- wiring */

  function wire() {
    $("rubric").addEventListener("click", function (ev) {
      var anchor = ev.target.closest(".anchor");
      if (anchor) {
        var e = entry(anchor.dataset.ind);
        var v = Number(anchor.dataset.v);
        if (e.v === v) delete e.v; else e.v = v;
        persist();
        paint();
        return;
      }

      var na = ev.target.closest("[data-na]");
      if (na) {
        var en = entry(na.dataset.na);
        if (en.v === "na") delete en.v; else en.v = "na";
        persist();
        paint();
        return;
      }

      var note = ev.target.closest("[data-note]");
      if (note) {
        var ta = $("nt-" + note.dataset.note);
        var stored = active().scores[note.dataset.note];
        ta.value = (stored && stored.note) || "";
        ta.hidden = !ta.hidden;
        if (!ta.hidden) ta.focus();
      }
    });

    $("rubric").addEventListener("input", function (ev) {
      if (ev.target.tagName !== "TEXTAREA") return;
      var id = ev.target.id.slice(3);
      entry(id).note = ev.target.value;
      persist();
    });

    $("rubric").addEventListener("focusout", function (ev) {
      if (ev.target.tagName === "TEXTAREA") paint();
    });

    $("pick").addEventListener("change", function () {
      state.activeId = $("pick").value;
      persist();
      paintPicker();
      paint();
    });

    $("btnNew").addEventListener("click", function () {
      var name = prompt("Name this assessment", "Firm name " + new Date().getFullYear());
      if (name === null) return;
      var a = blank(name.trim() || "Untitled assessment");
      state.assessments[a.id] = a;
      state.activeId = a.id;
      persist();
      paintPicker();
      paint();
      window.scrollTo({ top: 0 });
    });

    $("btnTheme").addEventListener("click", function () {
      applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });

    var menu = $("menu"), btnMenu = $("btnMenu");
    function closeMenu() {
      menu.dataset.open = "false";
      btnMenu.setAttribute("aria-expanded", "false");
    }
    btnMenu.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var open = menu.dataset.open !== "true";
      menu.dataset.open = open ? "true" : "false";
      btnMenu.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", closeMenu);
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") closeMenu(); });

    menu.addEventListener("click", function (ev) {
      var b = ev.target.closest("button[data-act]");
      if (!b) return;
      ev.stopPropagation();
      closeMenu();
      var act = b.dataset.act;

      if (act === "rename") {
        var n = prompt("Rename this assessment", active().name);
        if (n === null) return;
        active().name = n.trim() || active().name;
        persist(); paintPicker();
      } else if (act === "duplicate") {
        var copy = blank(active().name + " (copy)");
        copy.scores = JSON.parse(JSON.stringify(active().scores));
        state.assessments[copy.id] = copy;
        state.activeId = copy.id;
        persist(); paintPicker(); paint();
      } else if (act === "json") {
        exportJSON();
      } else if (act === "csv") {
        exportCSV();
      } else if (act === "import") {
        $("file").click();
      } else if (act === "print") {
        window.print();
      } else if (act === "clear") {
        if (!confirm("Clear every rating and note in " + active().name + "? This cannot be undone.")) return;
        active().scores = {};
        persist(); paint();
      } else if (act === "delete") {
        if (!confirm("Delete " + active().name + " permanently?")) return;
        delete state.assessments[state.activeId];
        if (!Object.keys(state.assessments).length) {
          var a = blank("New assessment " + today());
          state.assessments[a.id] = a;
        }
        state.activeId = Object.keys(state.assessments)[0];
        persist(); paintPicker(); paint();
      }
    });

    $("file").addEventListener("change", function () {
      var f = this.files && this.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () { importJSON(String(reader.result)); };
      reader.onerror = function () { alert("That file could not be read."); };
      reader.readAsText(f);
      this.value = "";
    });

    // highlight the dimension currently in view
    if ("IntersectionObserver" in window) {
      var links = {};
      document.querySelectorAll("#nav a[data-dim]").forEach(function (a) { links[a.dataset.dim] = a; });
      var obs = new IntersectionObserver(function (items) {
        items.forEach(function (it) {
          var a = links[it.target.id.replace("dim-", "")];
          if (a && it.isIntersecting) {
            Object.keys(links).forEach(function (k) { links[k].removeAttribute("aria-current"); });
            a.setAttribute("aria-current", "true");
          }
        });
      }, { rootMargin: "-80px 0px -70% 0px" });
      document.querySelectorAll(".dim").forEach(function (d) { obs.observe(d); });
    }
  }

  /* ------------------------------------------------------------------ boot */

  function checkWeights() {
    var sum = DIMS.reduce(function (a, d) { return a + d.weight; }, 0);
    if (sum !== 100) {
      console.warn("Dimension weights sum to " + sum + ", not 100. Scores are still " +
        "normalised, but edit assets/rubric.js to restore the intended scale.");
    }
    INDS.forEach(function (i) {
      if (!i.anchors || i.anchors.length !== 5) {
        console.warn("Indicator " + i.id + " does not have exactly five anchors.");
      }
    });
  }

  function boot() {
    initTheme();
    checkWeights();
    state = load();
    renderStatic();
    paintPicker();
    wire();
    paint();
  }

  // Normally this app boots itself immediately. When a login gate is
  // present (assets/auth.js), that script defers the call to boot()
  // until sign-in succeeds, and sets window.__RUBRIC_GATED__ beforehand
  // so this file knows not to double-boot.
  if (!window.__RUBRIC_GATED__) {
    boot();
  } else {
    window.__bootRubricApp = boot;
  }
})();
