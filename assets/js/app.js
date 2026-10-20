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

  /* ------------------------------------------------------------ examples */
  /* Nothing in this block is prose about the corpus - it IS the corpus.
     tools/build_examples.py writes examples.js straight out of the split,
     audio included. */
  var EX = window.PACT_EXAMPLES || [];
  var player = document.getElementById("player");
  var exbox = document.getElementById("example");
  var exgrid = document.getElementById("exgrid");
  var exfilter = document.getElementById("exfilter");
  var excount = document.getElementById("excount");

  var TIMING_TEXT = {
    "NOW": "immediate post-turn response",
    "INTERRUPT": "interrupts the conversation",
    "AT_CLOSING": "brief response at closure"
  };
  var ORDER = ["NOW", "INTERRUPT", "AT_CLOSING"];

  var filter = "all";
  var current = 0;                       // index into EX, not into the view

  function view() {
    return EX.filter(function (e) { return filter === "all" || e.timing === filter; });
  }

  function stopAll() {
    if (player) { player.pause(); }
    Array.prototype.forEach.call(exbox.querySelectorAll(".play"), function (b) {
      b.setAttribute("aria-pressed", "false");
    });
  }

  function playClip(btn, file) {
    if (!file) return;
    var same = player.dataset.file === file && !player.paused;
    stopAll();
    if (same) return;                    // second click on a playing turn stops it
    player.src = "assets/audio/" + file;
    player.dataset.file = file;
    btn.setAttribute("aria-pressed", "true");
    player.play().catch(function () {
      // autoplay policy, missing file, codec: fail quiet, the transcript stands
      btn.setAttribute("aria-pressed", "false");
    });
  }
  if (player) player.addEventListener("ended", stopAll);

  function renderExample(e) {
    stopAll();
    exbox.textContent = "";

    var head = el("div", "exhead");
    if (e.why) head.appendChild(el("div", "exwhy", e.why));
    var meta = el("div", "exmeta");
    meta.appendChild(el("code", "cand right", e.tool));
    meta.appendChild(document.createTextNode(" \u00b7 " + e.category));
    head.appendChild(meta);
    head.appendChild(el("p", "exscen", e.summary));
    exbox.appendChild(head);

    var list = el("ol", "turns");
    e.turns.forEach(function (t) {
      var li = el("li", t.agent ? "turn agent" : "turn");
      if (t.label && t.label !== "SILENT") li.classList.add("act");

      var side = el("div", "tside");
      var b = el("button", "play", "\u25b6");
      b.type = "button";
      b.setAttribute("aria-pressed", "false");
      b.setAttribute("aria-label", "Play turn " + t.i);
      if (!t.audio) { b.disabled = true; b.title = "no audio for this turn"; }
      b.addEventListener("click", function () { playClip(b, t.audio); });
      side.appendChild(b);
      side.appendChild(el("span", "who", t.speaker));
      if (!t.agent) side.appendChild(el("span", "emo emo-" + t.emotion, t.emotion));
      li.appendChild(side);

      var body = el("div", "tbody2");
      body.appendChild(el("p", "ttext", t.text));
      if (t.gives.length) {
        var g = el("div", "gives");
        g.appendChild(el("span", "giveslab", "first spoken verbatim:"));
        t.gives.forEach(function (k) { g.appendChild(el("code", "slot", k)); });
        body.appendChild(g);
      }
      li.appendChild(body);

      var lab = el("div", "tlabel");
      lab.appendChild(el("span", "lab lab-" + (t.label || "AGENT"),
                        t.label || "agent acts"));
      li.appendChild(lab);
      list.appendChild(li);
    });
    exbox.appendChild(list);

    var foot = el("div", "exfoot");
    var call = el("div", "excall");
    call.appendChild(el("div", "exlab", "Reference tool call"));
    var pre = el("pre", "calljson");
    pre.textContent = e.tool + "(\n" + Object.keys(e.params).map(function (k) {
      return "  " + k + " = " + JSON.stringify(e.params[k]);
    }).join(",\n") + "\n)";
    call.appendChild(pre);
    var cand = el("div", "excand");
    cand.appendChild(el("span", "exlab", "Candidates offered: "));
    e.candidates.forEach(function (c) {
      cand.appendChild(el("code", c === e.tool ? "cand right" : "cand", c));
    });
    call.appendChild(cand);
    foot.appendChild(call);

    var rat = el("div", "exrat");
    rat.appendChild(el("div", "exlab", "Why the agent waits"));
    rat.appendChild(el("p", "small", e.rationale));
    foot.appendChild(rat);
    exbox.appendChild(foot);
  }

  function select(i) {
    current = i;
    Array.prototype.forEach.call(exgrid.children, function (b) {
      b.setAttribute("aria-current", String(Number(b.dataset.i) === i));
    });
    var v = view(), at = v.indexOf(EX[i]);
    excount.textContent = (at + 1) + " / " + v.length +
      (filter === "all" ? "" : " \u00b7 " + filter);
    renderExample(EX[i]);
    // keep the chosen chip visible when the grid is scrolled
    var chip = exgrid.querySelector('[data-i="' + i + '"]');
    if (chip && chip.scrollIntoView) {
      chip.scrollIntoView({ block: "nearest" });
    }
  }

  function step(d) {
    var v = view();
    if (!v.length) return;
    var at = v.indexOf(EX[current]);
    at = (at < 0 ? 0 : (at + d + v.length) % v.length);
    select(EX.indexOf(v[at]));
  }

  function buildGrid() {
    exgrid.textContent = "";
    EX.forEach(function (e, i) {
      if (filter !== "all" && e.timing !== filter) return;
      var b = el("button", "exitem");
      b.type = "button";
      b.dataset.i = String(i);
      b.setAttribute("aria-current", "false");
      b.appendChild(el("span", "dot dot-" + e.timing));
      var txt = el("span", "exitext");
      txt.appendChild(el("b", null, e.tool));
      txt.appendChild(el("span", null, e.category));
      b.appendChild(txt);
      b.addEventListener("click", function () { select(i); });
      exgrid.appendChild(b);
    });
  }

  if (EX.length && exbox && exgrid && exfilter) {
    var counts = { all: EX.length };
    ORDER.forEach(function (t) {
      counts[t] = EX.filter(function (e) { return e.timing === t; }).length;
    });
    ["all"].concat(ORDER).forEach(function (t) {
      var b = el("button", "exfbtn");
      b.type = "button";
      b.setAttribute("aria-pressed", String(t === "all"));
      b.appendChild(el("b", null, t === "all" ? "All" : t));
      b.appendChild(el("span", null, " " + counts[t]));
      if (t !== "all") b.title = TIMING_TEXT[t];
      b.addEventListener("click", function () {
        filter = t;
        Array.prototype.forEach.call(exfilter.children, function (x) {
          x.setAttribute("aria-pressed", String(x === b));
        });
        buildGrid();
        var v = view();
        select(v.indexOf(EX[current]) >= 0 ? current : EX.indexOf(v[0]));
      });
      exfilter.appendChild(b);
    });
    document.getElementById("exprev").addEventListener("click", function () { step(-1); });
    document.getElementById("exnext").addEventListener("click", function () { step(1); });
    buildGrid();
    select(0);
  }

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
