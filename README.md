# PACT — project page

Static project page for the ICASSP 2027 submission. No build step, no
dependencies: GitHub Pages serves `index.html` as it is.

## Publishing

Settings → Pages → Build from branch → `main` / `(root)`. `.nojekyll` is
present so `assets/` is served verbatim.

## Before it goes public

Four blocks in `index.html` are marked `EDIT ME (n/4)` and every unfilled value
is wrapped in `<span class="todo">`, so they are visible on the rendered page
rather than hidden in the source. Search for `todo` to find them all.

| # | What | Where |
|---|------|-------|
| 1 | Title and the PACT expansion | `<header>` |
| 2 | Paper / arXiv / dataset URLs — and drop `aria-disabled` from each link that now works | `.buttons` |
| 3 | Abstract, verbatim from the submission | `.notice` |
| 4 | Release links for data and audio samples | `#resources` |

Also fill the title in the BibTeX block under `#cite`.

**Anonymity.** The page is written for double-blind review: no names,
affiliations, contact addresses, or links to personal accounts. A personal
Drive folder or a named Hugging Face account in the release links would
de-anonymise the submission just as effectively as a byline.

## Regenerating the numbers

Nothing on the page is a hand-typed metric. `tools/build_data.py` reads
`../work/results/exp4_v5t2/*.summary.json` and the dataset splits, and writes:

- `data/results.json`, `data/dataset.json` — for anything that wants the data
- `assets/js/data.js` — what the page actually reads (a sibling `.json` cannot
  be fetched under `file://`, and this page gets opened off disk)

```bash
source /home/jihoojo3/ENV/bin/activate
python tools/build_data.py
python -m http.server 8000      # http://localhost:8000
```

To put a new evaluation arm on the page, add one line to `ARMS` in
`tools/build_data.py` and re-run it. Arms not listed there are skipped, which is
how the aligner ablation stays off the table.

## Figures

`assets/fig/` holds a PNG and a PDF for each figure, copied from
`../work/figures/`. They are copies, not symlinks, so the repo is
self-contained — re-copy after regenerating a figure:

```bash
cp ../work/figures/{fig1_overview,rq1_calibration,invocation_roc_v4,\
intervention_errors,implicit_toolcall,emotional_delivery}.{png,pdf} assets/fig/
```

## Layout

```
index.html              the page
assets/css/style.css    palette matches the paper figures exactly
assets/js/app.js        renders the tables, remembers the theme
assets/js/data.js       generated — do not edit
assets/fig/             figures (png for the page, pdf to download)
data/*.json             generated
tools/build_data.py     the only place a number enters the site
```
