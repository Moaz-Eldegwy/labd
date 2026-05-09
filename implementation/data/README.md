---
license: apache-2.0
language:
- en
tags:
- agent
- code
- self-correction
- reinforcement-learning
- agentic-ai
size_categories:
- n<1K
task_categories:
- text-generation
pretty_name: LABD-MBPP (Loop-Driven Agentic Behavior Distillation)
---

# 📊 LABD-MBPP Dataset

This directory contains the documentation and integration scripts for the **LABD-MBPP** dataset. This dataset is a core component of the **Loop-Driven Agentic Behavior Distillation (LABD)** framework, designed to teach Small Language Models (SLMs) how to iteratively repair code using real-world execution feedback.

## 🔗 Access and Repository
The dataset is hosted on the Hugging Face Hub for version control and easy integration with the `datasets` library.
👉 **[moazeldegwy/LABD-MBPP](https://huggingface.co/datasets/moazeldegwy/LABD-MBPP)**

---

## 📝 Dataset Description

The **LABD-MBPP** dataset addresses the "Reasoning Cliff" observed in small-scale models. Unlike traditional datasets that provide only optimal solutions, this dataset preserves the organic failure modes of small models and the subsequent corrective trajectories required to reach a solution.

### Key Features
* **Trajectory-Based:** Captures the full `Plan -> Execute -> Observe -> Recover` loop.
* **Execution Grounded:** Every corrective step is informed by actual Python interpreter output (Tracebacks, Assertion Errors).
* **High Quality:** 100% of the final solutions in the trajectories are verified against hidden unit tests.

---

## 📂 Dataset Structure

The dataset follows a conversational format (ShareGPT style) to facilitate easy fine-tuning with common LLM frameworks.

### Schema Overview

| Feature | Type | Description |
| :--- | :--- | :--- |
| `task_id` | `int64` | Identifier from the MBPP benchmark. |
| `conversations` | `list` | Multi-turn dialogue between `human` (problem/feedback) and `gpt` (code/thought). |
| `category` | `string` | The CS domain (e.g., `Data Structures`, `String Manipulation`). |
| `error_type` | `string` | Classification of the initial failure (e.g., `Logical`, `Runtime`). |
| `metadata` | `struct` | Success status, number of attempts, and parent task IDs. |

### Data Example (Trajectory Fragment)
Below is an example of the agentic interaction preserved in the dataset:

```json
{
  "task_id": "612",
  "category": "Data Structures",
  "error_type": "Logical",
  "conversations": [
    {"from": "human", "value": "Problem: Write a python function to merge the first and last elements..."},
    {"from": "gpt", "value": "<execute>\ndef merge(list_of_lists):\n return [inner_list[0] + inner_list[-1] for inner_list in list_of_lists]\n</execute>"},
    {"from": "human", "value": "<feedback>\n**Execution Failed**\nActual: ['xy', 'ab', 'mn']\nExpected: [['x', 'a', 'm'], ['y', 'b', 'n']]\n</feedback>"},
    {"from": "gpt", "value": "<think>\nActual output shows string concatenation instead of element merging into new lists. I need to use zip.\n</think>\n<execute>\ndef merge(lst): \n return [list(ele) for ele in list(zip(*lst))]\n</execute>"}
  ]
}

```

---

## 🛠️ Collection Methodology

1. **Failure Induction:** A weak student policy (Qwen3-0.6B) is prompted with MBPP tasks. Natural failures are captured without artificial corruption.
2. **Execution Feedback:** Code is run in a sandboxed environment; `stdout` and `stderr` are logged as `<feedback>`.
3. **Teacher Repair:** A strong teacher (Gemini) observes the failure and generates a corrective reasoning trace (`<think>`) and updated code.
4. **Validation:** Only trajectories that successfully pass all unit tests within 3 attempts are included.

---

## ⚖️ Intended Use & Ethics

### Use Cases

* **Agentic Fine-Tuning:** Teaching models to use `<think>` and `<execute>` tags effectively.
* **Self-Correction Research:** Training models to interpret Python tracebacks.
* **Small Model Distillation:** Improving the "recovery rate" of models under 8B parameters.

### Limitations

* **Language:** Restricted to Python.
* **Domain:** Focused on competitive programming and basic logic (MBPP).
* **Scale:** Optimized for specialized distillation rather than general pre-training.

## 📜 Citation

```bibtex
@article{eldegwy2026labd,
  title={Loop-Driven Agentic Behavior Distillation for Self-Correcting Code Generation},
  author={Moaz Eldegwy},
  year={2026},
  journal={Graduation Project: Self-Correction Agent in Coding}
}

```

