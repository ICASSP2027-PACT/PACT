r"""Regenerate the project page's data files from the runs themselves.

The page never carries a number that was typed by a person. Everything in
data/*.json is read here out of work/results/*.summary.json and the dataset
splits, so a re-run of an arm changes the site by re-running this script and
nothing else. If a number on the page looks wrong, fix the run, not the HTML.

    source /home/jihoojo3/ENV/bin/activate
    python tools/build_data.py
"""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
PROJECT = HERE.parent                       # .../SpeechDialogue
RESULTS = PROJECT / "work" / "results" / "exp4_v5t2"
SPLITS = PROJECT / "dialogue_dataset_v5_260826" / "combined"
OUT = HERE / "data"

# How each evaluated checkpoint is named on the page. The key is the stem of
# the summary file; anything not listed is skipped, so adding an arm to the
# site is one line here rather than an edit to the HTML.
#   label, family, note
ARMS = {
    "audio-flamingo-3-hf_all_wfull":
        ("Audio Flamingo 3", "base", "instruction-following only"),
    "Qwen2.5-Omni-7B_none_wfull":
        ("Qwen2.5-Omni-7B", "base", "transcript only"),
    "Qwen2.5-Omni-7B_all_wfull":
        ("Qwen2.5-Omni-7B", "base", ""),
    "gemma-4-E4B-it_all_w8":
        ("Gemma-4-E4B-it", "base", ""),
    "gemma-4-E4B-it_all_wfull":
        ("Gemma-4-E4B-it", "base", ""),
    "sd_v5t2_t1_gemma4-e4b_none_w8_checkpoint-2234_none_w8":
        ("Gemma-4-E4B", "sft", ""),
    "sd_v5t2_t2_gemma4-e4b_last_w8_checkpoint-2234_last_w8":
        ("Gemma-4-E4B", "sft", ""),
    "sd_v5t2_t3_gemma4-e4b_all_w8_checkpoint-3351_all_w8":
        ("Gemma-4-E4B", "sft", ""),
    "sd_v5t2_t4_gemma4-e4b_none_wfull_checkpoint-3351_none_wfull":
        ("Gemma-4-E4B", "sft", "transcript only"),
    "sd_v5t2_t5_gemma4-e4b_last_wfull_checkpoint-2234_last_wfull":
        ("Gemma-4-E4B", "sft", ""),
    "sd_v5t2_t6_gemma4-e4b_all_wfull_checkpoint-3351_all_wfull":
        ("Gemma-4-E4B", "sft", ""),
    "sd_v5t2_t10_qwen25-omni_none_wfull_checkpoint-3351_none_wfull":
        ("Qwen2.5-Omni-7B", "sft", "transcript only"),
    "sd_v5t2_t12_qwen25-omni_all_wfull_checkpoint-3351_all_wfull":
        ("Qwen2.5-Omni-7B", "sft", ""),
}

# What the three audio conditions mean, in the page's words.
MODES = {"none": "transcript", "last": "judged turn", "all": "full audio"}
SPANS = {"w8": "8 turns", "wfull": "full history"}


def dig(o, *path):
    for k in path:
        if not isinstance(o, dict) or k not in o:
            return None
        o = o[k]
    return o


def results():
    rows = []
    for f in sorted(RESULTS.glob("*decision.summary.json")):
        # strip the engine tag too: "..._vllm_decision.summary.json"
        stem = f.name.replace("_decision.summary.json", "")
        for engine in ("_vllm", "_hf"):
            if stem.endswith(engine):
                stem = stem[: -len(engine)]
                break
        if stem not in ARMS:
            print(f"  [skip] {stem}")
            continue
        label, family, note = ARMS[stem]
        d = json.loads(f.read_text())
        t = f.with_name(f.name.replace("decision", "toolcall"))
        td = json.loads(t.read_text()) if t.is_file() else {}
        D = dig(d, "decision", "FULL") or {}
        T = dig(td, "toolcall", "FULL") or dig(td, "toolcall") or {}
        mode, span = dig(d, "mode"), dig(d, "context_span")
        rows.append(dict(
            key=stem, label=label, family=family, note=note,
            mode=mode, span=span,
            mode_text=MODES.get(mode, mode), span_text=SPANS.get(span, span),
            n=dig(D, "n"),
            accuracy=dig(D, "accuracy"),
            macro_f1=dig(D, "macro_f1"),
            speak_p=dig(D, "speak_vs_silent", "precision"),
            speak_r=dig(D, "speak_vs_silent", "recall"),
            speak_f1=dig(D, "speak_vs_silent", "f1"),
            urgent_f1=dig(D, "per_class", "URGENT", "f1"),
            tool_accuracy=dig(T, "tool_accuracy"),
            params_exact=dig(T, "params_exact"),
        ))
    rows.sort(key=lambda r: (r["family"] != "base", r["label"], r["mode"], r["span"]))
    return rows


def dataset():
    out = {}
    all_tools, all_cats = set(), set()
    for split in ("train", "test"):
        f = SPLITS / split / "dataset.jsonl"
        rows = [json.loads(l) for l in f.open(encoding="utf-8") if l.strip()]
        turns = sum(r["num_turns"] for r in rows)
        all_tools |= {r["tool_name"] for r in rows if r.get("tool_name")}
        all_cats |= {r["category"] for r in rows}
        out[split] = dict(
            dialogues=len(rows),
            turns=turns,
            turns_per_dialogue=round(turns / len(rows), 1),
            tools=len({r["tool_name"] for r in rows if r.get("tool_name")}),
            categories=len({r["category"] for r in rows}),
            act_timing=dict(Counter(r["act_timing"] for r in rows).most_common()),
            behavior=dict(Counter(r["agent_behavior_pattern"] for r in rows).most_common()),
            emotions=dict(Counter(t["emotion"] for r in rows
                                  for t in r["turns"]).most_common()),
        )
    out["total"] = dict(
        dialogues=out["train"]["dialogues"] + out["test"]["dialogues"],
        turns=out["train"]["turns"] + out["test"]["turns"],
        tools=len(all_tools),
        categories=len(all_cats),
    )
    return out


def main():
    OUT.mkdir(exist_ok=True)
    r = results()
    d = dataset()
    (OUT / "results.json").write_text(json.dumps(r, indent=2) + "\n")
    (OUT / "dataset.json").write_text(json.dumps(d, indent=2) + "\n")
    # The page reads this one. fetch() of a sibling .json is blocked under
    # file://, and a project page is opened off disk often enough - by whoever
    # is checking it before it is pushed - that it has to work there too.
    js = HERE / "assets" / "js" / "data.js"
    js.parent.mkdir(parents=True, exist_ok=True)
    js.write_text("// generated by tools/build_data.py - do not edit\n"
                  "window.PACT_DATA = "
                  + json.dumps({"results": r, "dataset": d}, indent=2)
                  + ";\n")
    print(f"[data] results.json  {len(r)} arms")
    print(f"[data] dataset.json  "
          f"{d['train']['dialogues']} train / {d['test']['dialogues']} test dialogues")


if __name__ == "__main__":
    main()
