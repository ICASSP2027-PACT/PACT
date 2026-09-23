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
  }
};
