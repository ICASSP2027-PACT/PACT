# When to Act, What to Call: Toward Proactive Voice Agents

Project page for the ICASSP 2027 submission. Static: no build step, no
dependencies — GitHub Pages serves `index.html` as it is.

## Publishing

Settings → Pages → Build from branch → `main` / `(root)`. `.nojekyll` is present
so `assets/` is served verbatim.

## Before it goes public

One block in `index.html` is marked `EDIT ME (1/2)` — the paper / arXiv /
dataset URLs. Drop `aria-disabled` from each link once it resolves.

**The draft's abstract points readers at the wrong page.** `sections/0_abstract.tex`
links to `tgsr-icassp2027.github.io/Timestamp-Grounded-Speech-Reasoning/`, which
is a different project. That URL should become this one (`EDIT ME (2/2)` is the
reminder, in the same block).

## Where the numbers come from

`assets/js/data.js` — and only there. Every block carries the section and table
it was transcribed from:

| Block | Source in `PACT_paper/` |
|---|---|
| `dataset` | `sections/3_dataset.tex` — `tab:data`, `fig:wer-sim-utmos`, `subsec:dataset_validation` |
| `diagnostic` | `sections/4_preliminary.tex` — `tab:toolcall_invocation_diagnostic` + prose |
| `main` | `sections/5_experiments.tex` — `tab:all_audio_results` |
| `emotion` | `sections/5_experiments.tex` — `sec:input_analysis` |

An earlier version of this page generated the tables from
`work/results/*.summary.json`. That was wrong for a project page: the paper's
tables are not a straight dump of those logs — `SFT + RL` is averaged over three
seeds, several arms were re-run, and the dataset table counts domains and
relationship types the split files do not carry. A page whose numbers disagree
with the paper is worse than no page. **When the paper changes, edit
`data.js` and nothing else.**

## Figures

`assets/fig/` holds the three figures the paper actually includes, as PNG (for
the page) and PDF (to download). They are copies, so the repo is
self-contained. After recompiling a figure:

```bash
cd ../PACT_paper/figures
D=../../PACT/assets/fig
for f in overview_audioCA invocation_roc_v2 emotional_delivery; do
  pdftocairo -png -r 400 -singlefile "$f.pdf" "$D/$f"   # -r 200 for overview
  cp "$f.pdf" "$D/"
done
```

`dataset_configuration.png` and `overview_audio_r1.png` exist in the paper
folder but are commented out of `main.tex`, so they are deliberately not here.

## Checking it locally

```bash
python -m http.server 8000     # http://localhost:8000
```

`data.js` is a script, not a fetched `.json`, so opening `index.html` straight
off disk works too.

## Layout

```
index.html              the page
assets/css/style.css    palette matches the paper figures exactly
assets/js/data.js       every number, with its source named
assets/js/app.js        renders the tables, remembers the theme
assets/fig/             the paper's three figures, png + pdf
```
