# LABD: Loop-Driven Agentic Behavior Distillation

<div align="center">

[![Hugging Face Collection](https://img.shields.io/badge/%F0%9F%A4%97%20Hugging%20Face-Collection-orange)](https://huggingface.co/collections/moazeldegwy/qwen3-labd)
[![Dataset](https://img.shields.io/badge/%F0%9F%A4%97%20Dataset-LABD--MBPP-blue)](https://huggingface.co/datasets/moazeldegwy/LABD-MBPP)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-green.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/downloads/)
[![Project Page](https://img.shields.io/badge/Project-Page-blueviolet)](https://moaz-eldegwy.github.io/labd/)

**Graduation Project — Computer Science & AI**

[🌐 Project Page](https://moaz-eldegwy.github.io/labd/) • [🤗 Models](https://huggingface.co/collections/moazeldegwy/qwen3-labd) • [📊 Dataset](https://huggingface.co/datasets/moazeldegwy/LABD-MBPP)

</div>

---

## Overview

Small and mid-scale Language Models (SLMs) struggle with iterative self-correction, exhibiting a pronounced **Reasoning Cliff** — a sharp degradation when tasks require multi-step reasoning or feedback-driven recovery. Prompting-based methods fail at this scale because self-correction in small models is not emergent; it must be explicitly taught.

**LABD** is a two-stage post-training framework that teaches models *how to behave* inside a closed-loop correction process:

1. **Loop-Driven Agentic Behavior Distillation (SFT)** — distills complete self-correcting trajectories (failure → feedback → repair) rather than just correct solutions. A weak student model produces natural errors; a strong teacher repairs them under explicit execution feedback. The entire loop is distilled into the student.

2. **Group Relative Policy Optimization (GRPO)** — stabilizes and grounds the learned agentic behavior using execution-based verifiable rewards, without requiring auxiliary critics or complex reward shaping.

All training was performed on a **single consumer-grade GPU** (NVIDIA T4 / L4 / L40S).

---

## Demo

<div align="center">
  <video src="assets/video.mp4" controls autoplay muted loop width="100%">
    <p>Your browser does not support video. <a href="assets/video.mp4">Download the demo video</a>.</p>
  </video>
</div>

<video src="assets/video.mp4" controls="controls" style="max-width: 100%;">
</video>

---

## Key Results

### MBPP (500 tasks)

| Model | Base (Pass@1) | LABD (Pass@3) | LABD+GRPO (Pass@3) | CR (GRPO) |
|:------|:---:|:---:|:---:|:---:|
| Qwen3-0.6B | 36.60% | 33.94% | **36.80%** | 8.9% |
| Qwen3-1.7B | 55.40% | 46.40% | **52.60%** | 16.6% |
| Qwen3-4B | 58.20% | 69.80% | **72.40%** | 34.3% |
| Qwen3-8B | 69.80% | 74.80% | **75.80%** | 36.3% |

### HumanEval (164 tasks)

| Model | Base (Pass@1) | LABD (Pass@3) | LABD+GRPO (Pass@3) | Gain vs Base |
|:------|:---:|:---:|:---:|:---:|
| Qwen3-0.6B | 31.00% | 25.00% | **25.61%** | — |
| Qwen3-1.7B | 52.70% | 47.56% | **60.37%** | +7.7 pp |
| Qwen3-4B | 62.00% | 79.27% | **82.32%** | **+20.3 pp** |
| Qwen3-8B | 67.65% | 87.80% | **87.20%** | **+20.1 pp** |

> **CR** = Correction Rate: fraction of initially failed tasks successfully solved in later correction turns.
> The agentic loop becomes a net positive above ~4B parameters, where sufficient capacity enables effective recovery.

---

## Model Zoo

All models are fine-tuned from Qwen3 base checkpoints using LABD SFT + GRPO. Available on Hugging Face:

| Model | Parameters | Link |
|:------|:---:|:------|
| Qwen3-0.6B-LABD-GRPO | 0.6B | [🤗 View on HF](https://huggingface.co/moazeldegwy/Qwen3-0.6B-LABD-GRPO) |
| Qwen3-1.7B-LABD-GRPO | 1.7B | [🤗 View on HF](https://huggingface.co/moazeldegwy/Qwen3-1.7B-LABD-GRPO) |
| Qwen3-4B-LABD-GRPO | 4B | [🤗 View on HF](https://huggingface.co/moazeldegwy/Qwen3-4B-LABD-GRPO) |
| Qwen3-8B-LABD-GRPO | 8B | [🤗 View on HF](https://huggingface.co/moazeldegwy/Qwen3-8B-LABD-GRPO) |

**Full collection:** [moazeldegwy/qwen3-labd](https://huggingface.co/collections/moazeldegwy/qwen3-labd)

---

## Dataset

The **LABD-MBPP** dataset captures full agentic trajectories in the format:

```
Plan → Execute → Observe (feedback) → Recover
```

Each sample preserves the student's natural failures and the teacher's repair steps under real Python execution feedback. Only trajectories that ultimately pass all unit tests are retained.

📦 [moazeldegwy/LABD-MBPP on Hugging Face](https://huggingface.co/datasets/moazeldegwy/LABD-MBPP)

```python
from datasets import load_dataset
ds = load_dataset("moazeldegwy/LABD-MBPP")
```

---

## Repository Structure

```
LABD/
├── implementation/
│   ├── data/               # Dataset documentation & LABD-MBPP integration
│   ├── training/           # SFT & GRPO training notebooks (Unsloth + TRL)
│   │   ├── qwen3_LABD_SFT_finetuning.ipynb
│   │   └── labd-grpo-training.ipynb
│   ├── evaluation/         # Agentic benchmarking on MBPP & HumanEval
│   │   └── qwen3-grpo-evaluation.ipynb
│   └── web_app/            # Interactive self-correcting coding agent demo
│       ├── backend_server.py   # FastAPI code execution server
│       ├── execution_code.py   # Sandboxed Python execution engine
│       └── ui/                 # React + Vite frontend
├── assets/                 # GitHub Pages assets (CSS, JS, images)
├── index.html              # GitHub Pages project page
├── requirements.txt        # Python dependencies
└── README.md
```

---

## Quick Start

### Installation

```bash
git clone https://github.com/Moaz-Eldegwy/LABD.git
cd LABD
pip install -r requirements.txt
```

> **Note:** Training and evaluation require an NVIDIA GPU with 24 GB+ VRAM for optimal performance with vLLM.

### Run the Web Demo

The web demo lets you interact with a self-correcting coding agent locally.

**1. Start the backend (code execution server):**
```bash
cd implementation/web_app
pip install fastapi uvicorn
python backend_server.py
```

**2. Start the frontend:**
```bash
cd implementation/web_app/ui
npm install
npm run dev
```

**3. Start a local LLM server** (Ollama or Llama.cpp), then open `http://localhost:5173`.

---

## How LABD Works

```
┌─────────────────────────────────────────────────────┐
│              LABD Agentic Loop                      │
│                                                     │
│  Student fails → Execution feedback injected        │
│  → Teacher repairs → Full trajectory distilled      │
│                                                     │
│  <think> Reasoning step </think>                    │
│  <execute> Python code </execute>                   │
│  <feedback> Error trace / test results </feedback>  │
│  <think> Root cause analysis </think>               │
│  <execute> Corrected code </execute>                │
└─────────────────────────────────────────────────────┘
```

**Phase 1 — SFT:** Distills the *structure* of self-correction into the model using failure-conditioned trajectories. Even sub-1B models learn to retry, maintain coherence across turns, and respond to execution feedback.

**Phase 2 — GRPO:** Stabilizes and grounds the learned behavior using execution-based rewards (+3.0 for passing tests, −2.0 for hallucinating feedback). Operates in a *behavior refinement* regime rather than behavior discovery.

---

## Compute Efficiency

| | LABD (This Work) | MURPHY (Prior Work) |
|:--|:--|:--|
| GPUs | 1× T4 / L4 / L40S | 8× H100 |
| Training | SFT + standard GRPO | Modified multi-turn GRPO |
| Auxiliary components | None | Rollout trees, pruning, credit assignment |

---

## Citation

If you use this work, please cite:

```bibtex
@misc{eldegwy2026labd,
  title        = {Loop-Driven Agentic Behavior Distillation for Self-Correcting Code Generation},
  author       = {Moaz Eldegwy},
  year         = {2026},
  howpublished = {\url{https://github.com/Moaz-Eldegwy/LABD}},
  note         = {Graduation Project}
}
```

---

## License

This project is licensed under the [Apache 2.0 License](https://opensource.org/licenses/Apache-2.0).
