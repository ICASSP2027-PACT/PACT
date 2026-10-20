r"""Pull the worked examples - transcript, labels, audio - out of the test split.

N_EXAMPLES dialogues: three pinned by hand, the rest chosen by pick_rest()
to spread across intervention timing, domain, tool and agent behaviour.

WHY THIS ONE IS GENERATED WHEN data.js IS NOT. data.js holds the paper's
tables, which are not a dump of anything on disk. These examples ARE: every
turn, emotion, label and argument below is read out of
dialogue_dataset_v5_260826, and the audio is the released wav re-encoded. If a
word on the page differed from the corpus the example would be worthless, so
nothing here is retyped.

WHAT IS AND IS NOT INFERRED. Turn text, speaker, emotion, the interruption and
agent flags, the reference call, the candidate tools and decision_rationale are
fields in the corpus. The Stage 1 label is derived exactly as the paper's
annotation rule says (sections/3_dataset.tex): an immediately following agent
turn makes the turn positive; among positives a turn-level interruption wins,
then the dialogue-level end_of_dialogue attribute, else NOW. The ONE derived
thing is `anchor`: the first human turn whose text contains an argument value
verbatim. It is a lower bound on when that argument became available - a value
can be established by paraphrase earlier, and one that is never said verbatim
gets no anchor at all - so the page calls it "first spoken verbatim" and not
"when the argument became known".

    source /home/jihoojo3/ENV/bin/activate
    python tools/build_examples.py
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
PROJECT = HERE.parent
SPLIT = PROJECT / "dialogue_dataset_v5_260826" / "combined" / "test" / "dataset.jsonl"
WAVS = PROJECT / "dialogue_dataset_v5_260826" / "combined_v2" / "test" / "audio"
OUT_JS = HERE / "assets" / "js" / "examples.js"
OUT_AUDIO = HERE / "assets" / "audio"

# The three that open the list, vetted by hand: one per intervention timing,
# each the clearest case of its kind. Everything after them is picked by
# pick_rest() below.
PINNED = [
    ("dlg_000124_187431",
     "Every search criterion is on the table by turn 6, and the speakers keep "
     "talking for four more turns. The agent has to notice it can act."),
    ("dlg_000623_141848",
     "Speaker 2 is about to text Marcus and give the evening away. Waiting for "
     "the turn to end would be too late, so the agent cuts in."),
    ("dlg_000079_193929",
     "The document title is settled by turn 8, but the exchange is still "
     "running. The agent holds until it closes and then speaks briefly."),
]

N_EXAMPLES = 30          # including the pinned three

AUDIO_KBPS = 48          # mono speech; ~35 min over 30 examples -> ~12 MB


def label_of(dlg, t):
    """y_t, exactly as sections/3_dataset.tex defines it."""
    turns = dlg["turns"]
    nxt = turns[t + 1] if t + 1 < len(turns) else None
    if not (nxt and nxt.get("is_agent_turn")):
        return "SILENT"
    if turns[t].get("is_interruption") or nxt.get("is_interruption"):
        return "INTERRUPT"
    return "AT_CLOSING" if dlg["act_timing"] == "end_of_dialogue" else "NOW"


def anchor_turn(value, turns):
    """First human turn containing `value` verbatim; None when never spoken."""
    if not isinstance(value, str) or len(value) < 3:
        return None
    pat = re.compile(re.escape(value), re.I)
    for i, t in enumerate(turns):
        if not t.get("is_agent_turn") and pat.search(t["text"]):
            return i
    return None


def timing_of(dlg):
    """The dialogue's intervention type, read off its single positive turn."""
    for i in range(len(dlg["turns"])):
        if not dlg["turns"][i].get("is_agent_turn"):
            lab = label_of(dlg, i)
            if lab != "SILENT":
                return lab
    return None


def pick_rest(corpus, taken, n):
    """Fill the list out to `n`, spreading over timing, domain and tool.

    Deterministic: the pool is sorted and the choice is a greedy argmax with
    ties broken by dialogue id, so re-running gives the same thirty. The score
    rewards a timing/category/tool/behaviour that is under-represented SO FAR,
    which is what keeps the picker from filling up on the one domain that
    happens to have the most clean dialogues (Open Data has 367 of 1,581).
    """
    pool = []
    for d in corpus.values():
        if d["dialogue_id"] in taken:
            continue
        turns = d["turns"]
        human = [i for i, t in enumerate(turns) if not t.get("is_agent_turn")]
        pos = [i for i in human if label_of(d, i) != "SILENT"]
        if len(pos) != 1:                      # one intervention reads cleanly
            continue
        if not (8 <= len(turns) <= 16):
            continue
        if not (d.get("tool_call") or {}).get("call_parameters"):
            continue
        pool.append(d)
    pool.sort(key=lambda d: d["dialogue_id"])

    seen = {"timing": {}, "category": {}, "tool": {}, "beh": {}}
    for did in taken:
        d = corpus[did]
        for k, v in (("timing", timing_of(d)), ("category", d["category"]),
                     ("tool", d["tool_name"]), ("beh", d["agent_behavior_pattern"])):
            seen[k][v] = seen[k].get(v, 0) + 1

    out = []
    while pool and len(taken) + len(out) < n:
        def score(d):
            emo = len({t["emotion"] for t in d["turns"]
                       if not t.get("is_agent_turn")} - {"neutral"})
            nslot = len(d["tool_call"]["call_parameters"])
            return (-6 * seen["timing"].get(timing_of(d), 0)
                    - 3 * seen["category"].get(d["category"], 0)
                    - 4 * seen["tool"].get(d["tool_name"], 0)
                    - 2 * seen["beh"].get(d["agent_behavior_pattern"], 0)
                    + emo + min(nslot, 4))
        best = max(pool, key=lambda d: (score(d), d["dialogue_id"]))
        pool.remove(best)
        out.append(best)
        for k, v in (("timing", timing_of(best)), ("category", best["category"]),
                     ("tool", best["tool_name"]),
                     ("beh", best["agent_behavior_pattern"])):
            seen[k][v] = seen[k].get(v, 0) + 1
    return out


def encode(dialogue_id, turn_id, dst_dir):
    src = WAVS / f"{dialogue_id}_turn_{turn_id}.wav"
    if not src.is_file():
        return None
    dst = dst_dir / f"{dialogue_id}_t{turn_id}.mp3"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src),
                    "-ac", "1", "-b:a", f"{AUDIO_KBPS}k", str(dst)], check=True)
    return dst.name


def main():
    corpus = {}
    for line in SPLIT.open(encoding="utf-8"):
        if line.strip():
            r = json.loads(line)
            corpus[r["dialogue_id"]] = r

    if OUT_AUDIO.exists():
        shutil.rmtree(OUT_AUDIO)
    OUT_AUDIO.mkdir(parents=True)

    order = [did for did, _ in PINNED]
    why_of = dict(PINNED)
    for d in pick_rest(corpus, order, N_EXAMPLES):
        order.append(d["dialogue_id"])

    out, total = [], 0
    for did in order:
        d = corpus[did]
        timing = timing_of(d)
        why = why_of.get(did, "")
        turns = d["turns"]
        params = d["tool_call"]["call_parameters"] or {}
        anchors = {k: anchor_turn(v, turns) for k, v in params.items()}

        rows = []
        for i, t in enumerate(turns):
            agent = bool(t.get("is_agent_turn"))
            clip = encode(did, i, OUT_AUDIO)
            if clip:
                total += (OUT_AUDIO / clip).stat().st_size
            rows.append(dict(
                i=i, speaker="Agent" if agent else t["speaker"],
                agent=agent, text=t["text"], emotion=t.get("emotion", "neutral"),
                label=None if agent else label_of(d, i),
                gives=sorted(k for k, a in anchors.items() if a == i),
                audio=clip))

        out.append(dict(
            id=did, timing=timing, why=why,
            category=d["category"], summary=d["scenario_summary"],
            rationale=d["decision_rationale"],
            candidates=[c["tool_name"] for c in d["candidate_tools"]],
            tool=d["tool_call"]["tool_name"], params=params,
            anchors={k: a for k, a in anchors.items() if a is not None},
            turns=rows))

        n_anchor = sum(1 for a in anchors.values() if a is not None)
        print(f"  {did} {timing:11s} turns={len(turns):2d} args={len(params)} "
              f"anchored={n_anchor}  {d['category'][:18]:18s} {d['tool_name'][:34]}")

    OUT_JS.write_text(
        "// generated by tools/build_examples.py - do not edit\n"
        "window.PACT_EXAMPLES = " + json.dumps(out, indent=1, ensure_ascii=False)
        + ";\n", encoding="utf-8")
    from collections import Counter
    print(f"\n[examples] {len(out)} dialogues, "
          f"{sum(len(e['turns']) for e in out)} turns")
    print("  timing    :", dict(Counter(e["timing"] for e in out)))
    # "domain" the way tab:data counts it: the service before the dot, which
    # is the field that gives the paper its 134 over the whole corpus. The
    # `category` field is a different and coarser thing (40 values) - do not
    # report it as a domain count on the page.
    print("  domains   :", len({e["tool"].split(".")[0] for e in out}),
          "distinct /", len(out), "  (categories:",
          len({e["category"] for e in out}), ")")
    print("  tools     :", len({e["tool"] for e in out}), "distinct")
    print(f"  {OUT_JS.name} {OUT_JS.stat().st_size // 1024} KB, "
          f"audio {total // 1024 // 1024} MB ({total // 1024} KB)")


if __name__ == "__main__":
    main()
