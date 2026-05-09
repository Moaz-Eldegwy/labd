# Implementation Guide

This folder contains the full implementation of the **LABD** framework: data, training, evaluation, and the interactive web demo.

## Structure

```
implementation/
├── data/          # LABD-MBPP dataset documentation
├── training/      # SFT & GRPO training notebooks
├── evaluation/    # Agentic benchmarking notebooks
└── web_app/       # Interactive self-correcting coding agent demo
```

## Quick Start

**Install dependencies** (from the repo root):
```bash
pip install -r requirements.txt
```

> Training and evaluation require a GPU with **24 GB+ VRAM** for optimal performance with vLLM.

## Folder Overview

### [`data/`](./data)
Documentation and integration scripts for the **LABD-MBPP** dataset.

- Dataset hosted on Hugging Face: [moazeldegwy/LABD-MBPP](https://huggingface.co/datasets/moazeldegwy/LABD-MBPP)
- Format: ShareGPT-style conversational trajectories preserving full `Plan → Execute → Observe → Recover` loops

### [`training/`](./training)
Two-stage training pipeline using [Unsloth](https://github.com/unslothai/unsloth) and [TRL](https://github.com/huggingface/trl):

| Notebook | Stage | Description |
|:---------|:------|:------------|
| `qwen3_LABD_SFT_finetuning.ipynb` | Phase 1 — SFT | Distills self-correcting trajectories into Qwen3 models (0.6B–8B) using LoRA |
| `labd-grpo-training.ipynb` | Phase 2 — GRPO | Grounds learned behavior using execution-based rewards via vLLM rollouts |

### [`evaluation/`](./evaluation)
Automated agentic benchmarking on MBPP and HumanEval:

- **Notebook:** `qwen3-grpo-evaluation.ipynb`
- Evaluates models as closed-loop agents with up to 3 self-correction attempts
- Reports Iter-1/2/3 accuracy and Correction Rate (CR)

### [`web_app/`](./web_app)
An interactive UI for running the self-correcting agent locally:

- **Backend:** FastAPI + Python code execution sandbox (`backend_server.py`)
- **Frontend:** React 19 + Vite (`ui/`)
- Supports local LLM servers (Ollama, Llama.cpp)

See [`web_app/README.md`](./web_app/README.md) for setup instructions.
