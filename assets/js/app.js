/* PACT project page - renders the generated tables and remembers the theme.
   All data comes from assets/js/data.js (window.PACT_DATA), which
   tools/build_data.py writes from the evaluation summaries. Nothing here
   computes a metric; if a number is wrong, the run or the builder is wrong. */
(function () {
  "use strict";

  var D = window.PACT_DATA;
  if (!D) {
    console.error("PACT: assets/js/data.js missing - run tools/build_data.py");
    return;
  }

  var fmt3 = function (v) {
    return (v === null || v === undefined) ? "–" : v.toFixed(3);
  };
  var int = function (v) { return v.toLocaleString("en-US"); };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  /* ------------------------------------------------------------- stats */
  var t = D.dataset.total;
  var stats = [
    [int(t.dialogues), "spoken dialogues"],
    [int(t.turns), "annotated turns"],
    [int(t.tools), "distinct tools"],
    [int(t.categories), "domains"]
  ];
  var sw = document.getElementById("stats");
  stats.forEach(function (s) {
    var d = el("div", "stat");
    d.appendChild(el("b", null, s[0]));
    d.appendChild(el("span", null, s[1]));
    sw.appendChild(d);
  });

  /* --------------------------------------------------------- composition */
  var body = document.querySelector("#dstable tbody");
  ["train", "test"].forEach(function (k) {
    var s = D.dataset[k], tr = el("tr");
    tr.appendChild(el("td", "l", k));
    [s.dialogues, s.turns].forEach(function (v) {
      tr.appendChild(el("td", "num", int(v)));
    });
    tr.appendChild(el("td", "num", s.turns_per_dialogue.toFixed(1)));
    tr.appendChild(el("td", "num", int(s.tools)));
    tr.appendChild(el("td", "num", int(s.categories)));
    body.appendChild(tr);
  });

  /* -------------------------------------------------------------- emotion */
  var em = document.querySelector("#emtable tbody");
  var te = D.dataset.test.emotions, tr_ = D.dataset.train.emotions;
  var total = Object.keys(te).reduce(function (a, k) { return a + te[k]; }, 0);
  Object.keys(te).forEach(function (k) {
    var row = el("tr");
    row.appendChild(el("td", "l", k));
    row.appendChild(el("td", "num", int(tr_[k] || 0)));
    row.appendChild(el("td", "num", int(te[k])));
    row.appendChild(el("td", "num", (te[k] / total * 100).toFixed(1) + "%"));
    em.appendChild(row);
  });

  /* -------------------------------------------------------------- results */
  var METRICS = ["accuracy", "speak_p", "speak_r", "speak_f1",
                 "urgent_f1", "tool_accuracy", "params_exact"];
  // Best-in-column is computed over the ADAPTED arms only. An off-the-shelf
  // model that answers "silent" to everything can top a column without doing
  // the task, and bolding that would be the figure lying on the table's behalf.
  var best = {};
  METRICS.forEach(function (m) {
    best[m] = D.results.reduce(function (acc, r) {
      return (r.family === "sft" && typeof r[m] === "number" && r[m] > acc)
        ? r[m] : acc;
    }, -Infinity);
  });

  var rbody = document.querySelector("#restable tbody");

  function render(filter) {
    rbody.textContent = "";
    D.results.forEach(function (r) {
      if (filter !== "all" && r.family !== filter) return;
      var tr = el("tr");
      tr.dataset.family = r.family;

      var name = el("td", "l");
      name.appendChild(document.createTextNode(r.label));
      var tag = el("span", "rowtag " + r.family,
                   r.family === "base" ? "off-the-shelf" : "adapted");
      name.appendChild(tag);
      tr.appendChild(name);

      tr.appendChild(el("td", "l", r.mode_text));
      tr.appendChild(el("td", "l", r.span_text));
      METRICS.forEach(function (m) {
        var td = el("td", "num", fmt3(r[m]));
        if (r.family === "sft" && r[m] === best[m]) td.classList.add("best");
        tr.appendChild(td);
      });
      rbody.appendChild(tr);
    });
  }

  render("all");

  var filters = document.getElementById("filters");
  filters.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-f]");
    if (!b) return;
    Array.prototype.forEach.call(filters.querySelectorAll("button"), function (x) {
      x.setAttribute("aria-pressed", String(x === b));
    });
    render(b.dataset.f);
  });

  /* ---------------------------------------------------------------- theme */
  var root = document.documentElement;
  var KEY = "pact-theme";
  try {
    var saved = localStorage.getItem(KEY);
    if (saved) root.setAttribute("data-theme", saved);
  } catch (err) { /* private mode, blocked storage: the OS default is fine */ }

  document.getElementById("theme").addEventListener("click", function () {
    var now = root.getAttribute("data-theme");
    var isDark = now === "dark" || (!now &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
    var next = isDark ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem(KEY, next); } catch (err) { /* see above */ }
  });
})();
