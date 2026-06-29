# Loop-Driven Agentic Behavior Distillation: Teaching Small Language Models to Self-Correct from Their Own Failures

<div align="center">

[![Hugging Face Models](https://img.shields.io/badge/%F0%9F%A4%97%20Models-8%20Checkpoints-orange)](https://huggingface.co/collections/moazeldegwy/qwen3-labd)
[![Hugging Face Datasets](https://img.shields.io/badge/%F0%9F%A4%97%20Datasets-LABD-blue)](https://huggingface.co/collections/moazeldegwy/labd-datasets)
[![Project Page](https://img.shields.io/badge/Project-Page-blueviolet)](https://moaz-eldegwy.github.io/labd/)
[![Status](https://img.shields.io/badge/status-under%20review-lightgrey)]()

**Authors:** Moaz Eldegwy<sup>1</sup> · *additional authors to be announced*
<br/><sup>1</sup> Corresponding author

[🌐 Project Page](https://moaz-eldegwy.github.io/labd/) • [🤗 Models](https://huggingface.co/collections/moazeldegwy/qwen3-labd) • [📊 Datasets](https://huggingface.co/collections/moazeldegwy/labd-datasets)

</div>

---

> 🔬 **This work is currently under review.** The full implementation — data generation, training, and evaluation notebooks — is available in this repository (see [Repository Structure](#repository-structure)). The trained **model checkpoints and datasets** will be released on Hugging Face **upon publication.**

---

## Overview

Small and mid-scale Language Models (SLMs) struggle with iterative self-correction, exhibiting a pronounced **Reasoning Cliff** — a sharp degradation when tasks require multi-step reasoning or feedback-driven recovery. Prompting-based methods fail at this scale because self-correction in small models is not emergent; it must be explicitly taught.

**LABD** is a two-stage post-training framework that teaches models *how to behave* inside a closed-loop correction process — to self-correct from their own failures:

1. **Loop-Driven Agentic Behavior Distillation (SFT)** — distills complete self-correcting trajectories (failure → feedback → repair) rather than just correct solutions. A weak student model produces natural errors; a strong teacher repairs them under explicit execution feedback. The entire loop is distilled into the student.

2. **Group Relative Policy Optimization (GRPO)** — stabilizes and grounds the learned agentic behavior using execution-based verifiable rewards, without requiring auxiliary critics or complex reward shaping.

All training was performed on a **single consumer-grade GPU** (NVIDIA T4 / L4 / L40S).

---

## How LABD Works

```
┌─────────────────────────────────────────────────────┐
│              LABD Agentic Loop                       │
│                                                      │
│  Student fails → Execution feedback injected         │
│  → Teacher repairs → Full trajectory distilled       │
│                                                      │
│  <think> Reasoning step </think>                     │
│  <execute> Python code </execute>                    │
│  <feedback> Error trace / test results </feedback>   │
│  <think> Root cause analysis </think>                │
│  <execute> Corrected code </execute>                 │
└─────────────────────────────────────────────────────┘
```

**Phase 1 — SFT:** Distills the *structure* of self-correction into the model using failure-conditioned trajectories. Even sub-1B models learn to retry, maintain coherence across turns, and respond to execution feedback.

**Phase 2 — GRPO:** Stabilizes and grounds the learned behavior using execution-based rewards (+3.0 for passing tests, −2.0 for hallucinating feedback). Operates in a *behavior refinement* regime rather than behavior discovery.

---

## Repository Structure

The `implementation/` directory contains the full pipeline as Jupyter notebooks, organized by stage. Each notebook runs end-to-end on a single GPU; the examples are configured for the Qwen3-0.6B student and scale up by swapping the model id.

```
implementation/
├── data_generation/
│   ├── sft_self_correction_dataset_generation.ipynb   # Stage 1: student fails, teacher repairs → SFT trajectories
│   └── grpo_rollout_generation_and_dataset_creation.ipynb  # Stage 3: roll out the SFT model → recovery-only GRPO data
├── training/
│   ├── labd_sft_training.ipynb                         # Stage 2: distill trajectories back into the student (SFT)
│   └── labd_grpo_training.ipynb                        # Stage 4: GRPO with execution-based rewards
└── evaluation/
    ├── agentic_loop_evaluation.ipynb                   # Stage 5: closed-loop eval on MBPP / HumanEval
    └── evaluation_analysis.ipynb                       # Stage 6: aggregate pass@k, Δbase, and correction rate
```

The agent operates over a structured loop — `<think>` reasoning, `<execute>` code, and `<tool_response>` execution feedback from the sandbox — across up to three iterations.

---

## Results

Models are evaluated as autonomous self-correcting agents under a closed-loop protocol: `THOUGHT → EXECUTE → FEEDBACK → REPAIR`. Base is single-pass; LABD and LABD+GRPO are evaluated in the agentic loop (up to three iterations). **Δ<sub>base</sub>** = Iter-3 − Base; **CR** is the Correction Rate.

|  | MBPP | | | | | HumanEval | | | | |
|:--|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **Model** | Base | Iter-1 | Iter-3 | Δ<sub>base</sub> | CR (%) | Base | Iter-1 | Iter-3 | Δ<sub>base</sub> | CR (%) |
| *Full results available upon publication.* | | | | | | | | | | |

---

## Model Zoo

Eight models are fine-tuned from Qwen3 base checkpoints — four with **LABD** SFT and four with **LABD+GRPO**. They will be released on Hugging Face upon publication.

| Model | Parameters | Availability |
|:------|:---:|:---:|
| Qwen3-0.6B + LABD | 0.6B | 🔒 Upon publication |
| Qwen3-0.6B + LABD+GRPO | 0.6B | 🔒 Upon publication |
| Qwen3-1.7B + LABD | 1.7B | 🔒 Upon publication |
| Qwen3-1.7B + LABD+GRPO | 1.7B | 🔒 Upon publication |
| Qwen3-4B + LABD | 4B | 🔒 Upon publication |
| Qwen3-4B + LABD+GRPO | 4B | 🔒 Upon publication |
| Qwen3-8B + LABD | 8B | 🔒 Upon publication |
| Qwen3-8B + LABD+GRPO | 8B | 🔒 Upon publication |

**Collection:** [moazeldegwy/qwen3-labd](https://huggingface.co/collections/moazeldegwy/qwen3-labd)

---

## Datasets

The **LABD** datasets capture full agentic trajectories in the format:

```
Plan → Execute → Observe (feedback) → Recover
```

Each sample preserves the student's natural failures and the teacher's repair steps under real Python execution feedback. Only trajectories that ultimately pass all unit tests are retained.

📦 [LABD datasets collection on Hugging Face](https://huggingface.co/collections/moazeldegwy/labd-datasets) *(released upon publication)*

---

## Compute Efficiency

| | LABD (This Work) | MURPHY (Prior Work) |
|:--|:--|:--|
| GPUs | 1× T4 / L4 / L40S | 8× H100 |
| Training | SFT + standard GRPO | Modified multi-turn GRPO |
| Auxiliary components | None | Rollout trees, pruning, credit assignment |

---

## Citation

If you find this work useful, please cite:

```bibtex
@misc{eldegwy2026labd,
  title        = {Loop-Driven Agentic Behavior Distillation: Teaching Small Language Models to Self-Correct from Their Own Failures},
  author       = {Moaz Eldegwy and others},
  year         = {2026}
}
```

---

## License

The code in this repository is shared for review and reproducibility. A final open-source license will be applied to the code, model checkpoints, and datasets upon publication.
