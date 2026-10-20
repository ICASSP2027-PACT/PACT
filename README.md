# When to Act, What to Call: Toward Proactive Voice Agents

Project page for the ICASSP 2027 submission. Static: no build step, no
dependencies — GitHub Pages serves `index.html` as it is.

## Publishing

Settings → Pages → Build from branch → `main` / `(root)`. `.nojekyll` is present
so `assets/` is served verbatim.

## Before it goes public

The page carries no outbound links at all — the paper / arXiv / code / dataset
button row was removed, so nothing here points anywhere that does not exist yet
and there is no placeholder left to forget. Adding the row back later means
writing it again in the `<header>`, together with `.buttons` / `.btn` rules in
the stylesheet.

**The draft's abstract points readers at the wrong page.** `sections/0_abstract.tex`
links to `tgsr-icassp2027.github.io/Timestamp-Grounded-Speech-Reasoning/`, which
is a different project. That URL should become this one — a paper edit, not a
page edit.

## Worked examples

The thirty dialogues in the Benchmark section are **generated**, not written:
`tools/build_examples.py` reads them out of
`../dialogue_dataset_v5_260826/combined/test/dataset.jsonl`, derives the
Stage 1 label with the paper's own annotation rule, and re-encodes the released
per-turn wavs to MP3.

```bash
python tools/build_examples.py     # -> assets/js/examples.js, assets/audio/
```

`PINNED` names three ids vetted by hand — one per intervention timing, each the
clearest case of its kind — and they open the list. `pick_rest()` fills the
remaining `N_EXAMPLES - 3` with a greedy score that penalises a timing, domain,
tool or behaviour pattern already represented, which is what stops the picker
filling up on the one domain with the most clean dialogues (Open Data has 367
of the 1,581 test dialogues). The pool is sorted and ties break on dialogue id,
so a re-run gives the same thirty. The current set is 10 / 10 / 10 across
timing, over 26 domains and 30 distinct tools.

To swap an example, pin it in `PINNED`; to change how many, set `N_EXAMPLES`.

`decision_rationale` and the candidate-tool list are read but **not shown**:
the rationale is annotation prose that names the agent by its alias, and the
candidate list only repeats what the tool name already says. The reference call
is rendered on the agent's own turn rather than in a footer — in the INTERRUPT
dialogues that turn is not the last one, which is the point.

One field is inferred rather than read: `anchor` / `gives`, the first human turn
whose text contains an argument value **verbatim**. It is a lower bound on when
the argument became available — a value settled by paraphrase gets no anchor,
and `open_now: true` or an ISO timestamp never will — which is why the page
labels it "first spoken verbatim" and not "when the argument became known".

Audio is 48 kbps mono MP3: 393 turns, about 35 minutes, 13 MB. It is the bulk
of the repository and it is all fetched on demand (`preload="none"` on the one
shared `<audio>`), so it costs a visitor nothing until they press play. Change
`AUDIO_KBPS` and re-run if that trade is wrong.

## Where the numbers come from

`assets/js/data.js` — and only there. Every block carries the section and table
it was transcribed from:

| Block | Source in `PACT_paper/` |
|---|---|
| `dataset.headline` | `sections/3_dataset.tex` — `tab:data` |
| `diagnostic` | `sections/4_preliminary.tex` — `tab:toolcall_invocation_diagnostic` + prose |

The page shows four headline figures from `tab:data` and nothing else from
the dataset section: the rest of that table, the speech-quality measures
(UTMOS / WER / speaker similarity) and the LLM-as-a-judge table are in the
paper, and the worked examples carry the corpus far better than a count of
relationship types does.

The page deliberately stops at the diagnosis. The method
(`sec:experiments`), the main results table (`tab:all_audio_results`), the
emotional-delivery analysis (`sec:input_analysis`) and the BibTeX block were all
removed — the page states the problem, the benchmark and what breaks, and sends
the reader to the paper for everything after that. Re-adding a results section
means restoring its `data.js` block, its `<section>` and the render call in
`app.js`; the method and citation sections were static HTML and would just be
written again.

An earlier version of this page generated the tables from
`work/results/*.summary.json`. That was wrong for a project page: the paper's
tables are not a straight dump of those logs — `SFT + RL` is averaged over three
seeds, several arms were re-run, and the dataset table counts domains and
relationship types the split files do not carry. A page whose numbers disagree
with the paper is worse than no page. **When the paper changes, edit
`data.js` and nothing else.**

## Figures

`assets/fig/` holds the three figures the paper includes, as PNG (for the page)
and PDF (to download); `emotional_delivery` is kept for the download link and
for whenever that section comes back. They are copies, so the repo is
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
index.html                the page
assets/css/style.css      palette matches the paper figures exactly
assets/js/data.js         the paper's numbers, with each source named
assets/js/examples.js     generated — the three worked dialogues
assets/js/app.js          renders the tables and the examples
assets/fig/               the paper's figures, png + pdf
assets/audio/             generated — one mp3 per example turn
tools/build_examples.py   the only thing that writes examples.js and audio/
```
