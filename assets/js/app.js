/* Renders the tables in index.html from assets/js/data.js.
   Nothing here computes a metric - every value is transcribed from the paper
   in data.js. This file only decides how it is laid out. */
(function () {
  "use strict";

  var D = window.PACT_DATA;
  if (!D) { console.error("PACT: assets/js/data.js is missing"); return; }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function row(tbody, cells, opts) {
    var tr = el("tr");
    cells.forEach(function (c, i) {
      var td = el("td", i === 0 ? "l" : "num", c);
      if (opts && opts.best && opts.best.indexOf(i) > -1) td.classList.add("best");
      tr.appendChild(td);
    });
    if (opts && opts.cls) tr.className = opts.cls;
    tbody.appendChild(tr);
    return tr;
  }
  function tbody(id) { return document.querySelector("#" + id + " tbody"); }

  /* ------------------------------------------------------------- dataset */
  var sw = document.getElementById("stats");
  D.dataset.headline.forEach(function (s) {
    var d = el("div", "stat");
    d.appendChild(el("b", null, s[0]));
    d.appendChild(el("span", null, s[1]));
    sw.appendChild(d);
  });

  D.dataset.corpus.forEach(function (r, i) {
    // the last line is the corpus total, which the paper shades
    row(tbody("corpus"), r, { cls: i === D.dataset.corpus.length - 1 ? "total" : "" });
  });
  D.dataset.behavior.forEach(function (r) { row(tbody("behavior"), r); });
  D.dataset.timing.forEach(function (r) { row(tbody("timing"), r); });

  /* A bar per measure rather than a number: the paper draws these as bars
     because the scales differ (UTMOS out of 5, WER out of 20%, similarity out
     of 100%) and a bare triple of numbers invites reading them as comparable. */
  var q = document.getElementById("quality");
  D.dataset.quality.forEach(function (m) {
    var wrap = el("div", "meter");
    var head = el("div", "meter-head");
    head.appendChild(el("span", "meter-name", m[0]));
    head.appendChild(el("b", "meter-val", m[3]));
    var bar = el("div", "meter-bar");
    var fill = el("i");
    fill.style.width = (m[1] / m[2] * 100).toFixed(1) + "%";
    bar.appendChild(fill);
    var scale = el("span", "meter-scale", "0 – " + m[2] + (m[0] === "UTMOS" ? "" : "%"));
    wrap.appendChild(head); wrap.appendChild(bar); wrap.appendChild(scale);
    q.appendChild(wrap);
  });

  D.dataset.judge.forEach(function (r) { row(tbody("judge"), r); });
  document.getElementById("judgeall").textContent = D.dataset.judge_all;

  /* ---------------------------------------------------------- diagnostic */
  D.diagnostic.macro_f1.forEach(function (m) {
    var d = m[2] - m[1];
    row(tbody("macro"), [m[0], m[1].toFixed(3), m[2].toFixed(3),
                         (d > 0 ? "+" : "−") + Math.abs(d).toFixed(3)])
      .lastChild.classList.add("down");
  });

  D.diagnostic.rows.forEach(function (r) {
    var tr = row(tbody("diag"),
      [r.model, r.cond, r.tool.toFixed(1), r.jga.toFixed(1), r.slot.toFixed(1)]);
    tr.children[1].className = "l";
    if (r.reasoning) tr.classList.add("shade");   // the paper shades these rows
  });

  /* ---------------------------------------------------------------- main */
  var COLS = ["acc", "macro", "speak", "tool", "jga", "slot"];
  var mb = tbody("main");

  function mainRow(r) {
    var tr = el("tr");
    if (r.ref) tr.className = "ref";
    var m = el("td", "l");
    m.appendChild(el("i", null, r.model));
    tr.appendChild(m);
    tr.appendChild(el("td", "l", r.ckpt));
    COLS.forEach(function (k) {
      var td = el("td", "num");
      td.appendChild(document.createTextNode(r[k]));
      if (r.sd && r.sd[k]) {
        td.appendChild(el("span", "sd", " ±" + r.sd[k]));
      }
      if (r.best && r.best.indexOf(k) > -1) td.classList.add("best");
      tr.appendChild(td);
    });
    mb.appendChild(tr);
  }

  mainRow(D.main.baseline);
  D.main.rows.forEach(function (r, i) {
    // a rule before each new model block, as in the paper
    if (i > 0 && r.model !== D.main.rows[i - 1].model) {
      mb.lastChild.classList.add("blockend");
    }
    mainRow(r);
  });

  /* ------------------------------------------------------------- emotion */
  D.emotion.probe.forEach(function (r) { row(tbody("probe"), r); });
  D.emotion.behaviour.forEach(function (r) {
    row(tbody("behav"), r).children[1].classList.add("down");
  });

  /* --------------------------------------------------------------- theme */
  var root = document.documentElement, KEY = "pact-theme";
  try {
    var saved = localStorage.getItem(KEY);
    if (saved) root.setAttribute("data-theme", saved);
  } catch (err) { /* blocked storage: the OS preference is a fine default */ }

  document.getElementById("theme").addEventListener("click", function () {
    var now = root.getAttribute("data-theme");
    var dark = now === "dark" || (!now &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
    var next = dark ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem(KEY, next); } catch (err) { /* see above */ }
  });
})();
