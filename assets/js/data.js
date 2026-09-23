/* Everything the page shows, transcribed from the submitted paper.
 *
 * WHY THIS IS TYPED AND NOT GENERATED. An earlier version of this page read
 * work/results/*.summary.json directly. That was wrong for a project page: the
 * paper's tables are not a straight dump of those logs - SFT + RL is averaged
 * over three seeds, several arms were re-run, and the dataset table counts
 * domains and relationship types that the split files do not carry. A page
 * whose numbers disagree with the paper is worse than no page, so the paper is
 * the single source here and every block below names the table it came from.
 *
 * WHEN THE PAPER CHANGES, change this file and nothing else. Re-check against:
 *   sections/3_dataset.tex          tab:data, fig:wer-sim-utmos, validation
 *   sections/4_preliminary.tex      tab:toolcall_invocation_diagnostic
 *   sections/5_experiments.tex      tab:all_audio_results, sec:input_analysis
 */
window.PACT_DATA = {

  /* ---- sections/3_dataset.tex, tab:data ------------------------------- */
  dataset: {
    headline: [
      ["3,007", "spoken dialogues"],
      ["15.65", "turns / dialogue"],
      ["134", "unique domains"],
      ["23", "speaker voices"]
    ],
    corpus: [
      ["Avg. turns / dialogue", "15.65"],
      ["Unique domains", "134"],
      ["Relationship types", "10"],
      ["Speaker voices", "23"],
      ["Turns with disfluency", "7,047"],
      ["Total dialogues", "3,007"]
    ],
    behavior: [
      ["Suggest & execute", "1,003"],
      ["Clarify, suggest & execute", "1,014"],
      ["Execute only", "990"]
    ],
    timing: [
      ["Post-turn response", "1,821"],
      ["End-of-dialogue", "598"],
      ["Interruption", "588"]
    ],
    /* fig:wer-sim-utmos */
    quality: [
      ["UTMOS", 4.17, 5, "4.17"],
      ["WER", 6.19, 20, "6.19%"],
      ["Speaker similarity", 91.5, 100, "91.50%"]
    ],
    /* subsec:dataset_validation - LLM-as-a-judge, 300 examples, 1-5 scale */
    judge: [
      ["Intervention appropriateness", "4.93", "99.7%"],
      ["Timing consistency", "4.33", "82.0%"],
      ["Response strategy", "4.57", "83.3%"],
      ["Argument grounding", "4.78", "96.0%"]
    ],
    judge_all: "67.0%"
  },

  /* ---- sections/4_preliminary.tex, tab:toolcall_invocation_diagnostic -- */
  diagnostic: {
    rows: [
      { model: "Gemma4-e4b",   cond: "Baseline",    tool: 95.4, jga: 5.0, slot: 23.9 },
      { model: "Gemma4-e4b",   cond: "+ Reasoning", tool: 96.7, jga: 5.2, slot: 22.2,
        reasoning: true },
      { model: "Qwen2.5-Omni", cond: "Baseline",    tool: 88.8, jga: 6.2, slot: 30.4 },
      { model: "Qwen2.5-Omni", cond: "+ Reasoning", tool: 90.2, jga: 6.0, slot: 29.6,
        reasoning: true }
    ],
    /* subsec:intervention_diagnostic, prose */
    macro_f1: [
      ["Gemma4-e4b", 0.386, 0.248],
      ["Qwen2.5-Omni", 0.170, 0.129]
    ]
  },

  /* ---- sections/5_experiments.tex, tab:all_audio_results --------------- */
  /* Full-dialogue audio input. SFT + RL is mean +- sd over three seeds. */
  main: {
    baseline: { model: "Always Silent", ckpt: "–",
                acc: "84.5", macro: "22.9", speak: "0.0",
                tool: "–", jga: "–", slot: "–", ref: true },
    rows: [
      { model: "Gemma4-e4b", ckpt: "Base",
        acc: "74.1", macro: "36.6", speak: "47.8",
        tool: "95.4", jga: "5.0", slot: "23.9" },
      { model: "Gemma4-e4b", ckpt: "SFT",
        acc: "92.7", macro: "51.1", speak: "84.1",
        tool: "97.9", jga: "61.5", slot: "72.2" },
      { model: "Gemma4-e4b", ckpt: "SFT + RL",
        acc: "93.1", macro: "53.2", speak: "81.2",
        tool: "99.0", jga: "71.1", slot: "88.0",
        sd: { acc: "0.3", macro: "1.5", speak: "0.5",
              tool: "0.1", jga: "0.9", slot: "0.8" },
        best: ["tool", "jga", "slot"] },
      { model: "Qwen2.5-Omni", ckpt: "Base",
        acc: "24.0", macro: "16.2", speak: "29.4",
        tool: "88.8", jga: "6.2", slot: "30.4" },
      { model: "Qwen2.5-Omni", ckpt: "SFT",
        acc: "92.3", macro: "58.7", speak: "84.1",
        tool: "95.4", jga: "57.4", slot: "70.3",
        best: ["macro"] },
      { model: "Qwen2.5-Omni", ckpt: "SFT + RL",
        acc: "93.6", macro: "57.7", speak: "86.2",
        tool: "98.9", jga: "66.3", slot: "87.0",
        sd: { acc: "0.5", macro: "1.2", speak: "0.2",
              tool: "0.1", jga: "0.7", slot: "0.6" },
        best: ["acc", "speak"] }
    ]
  },

  /* ---- sections/5_experiments.tex, sec:input_analysis ------------------ */
  emotion: {
    probe: [
      ["High-arousal AUC", "0.74", "0.56"],
      ["Six-way emotion accuracy", "0.31", "0.20"]
    ],
    behaviour: [
      ["Intervention recall", "−3.6 pp", "p < .01"],
      ["URGENT recall", "−8.5 pp", "p < .01"]
    ]
  }
};
