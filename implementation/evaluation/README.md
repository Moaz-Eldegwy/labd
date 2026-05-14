# Evaluation Pipeline

This directory contains the scripts and logic for measuring the performance of the **LABD-tuned** models. The evaluation process is designed to test the model's ability to act as an autonomous agent—specifically its capacity to reason, generate code, and recover from execution errors.

---

# 📊 Evaluation Pipeline

The primary evaluation tool in this directory is the [`qwen3-grpo-evaluation.ipynb`](./qwen3-grpo-evaluation.ipynb) notebook. Unlike standard "pass@1" benchmarks that only check the first code generation, this pipeline evaluates the **Multi-Turn Recovery Rate**.


## 🛠️ Key Components

### 1. Batched Self-Correction Agent

The evaluation uses a custom `BatchedSelfCorrectionAgent` class designed for high-throughput testing:

* **Agentic Loop:** Implements a strict `THOUGHT` -> `ACTION` -> `OBSERVATION` protocol.
* **Batched Inference:** Optimized for Unsloth and vLLM to process multiple programming tasks in parallel.
* **State Management:** Tracks conversation history, attempt counts, and success status for every task in the batch.

### 2. Execution Sandbox (Safe Evaluation)

To safely evaluate model-generated code, the script includes a robust execution environment:

* **Timeout Protection:** Uses `signal.SIGALRM` to terminate infinite loops.
* **Memory Limits:** Uses `resource.setrlimit` to prevent the model from crashing the host system with memory-intensive operations.
* **Rich Feedback:** An AST-based (Abstract Syntax Tree) analyzer that provides detailed "Expected vs. Actual" comparisons for `AssertionError` failures, which is then fed back to the model as a prompt for the next turn.

---

## 🧪 Benchmarks

We evaluated the fine-tuned and GRPO-optimized models across two industry-standard benchmarks:

### 1. MBPP (Mostly Basic Python Problems)
* **Dataset:** `google-research-datasets/mbpp`
* **Focus:** Core programming logic and common Python tasks.
* **Process:** Models are given the task description and 3 test cases. If the first generation fails, the agent enters the LABD loop to repair the code.

### 2. HumanEval
* **Dataset:** `openai/human-eval`
* **Focus:** Algorithmic complexity and zero-shot problem-solving.
* **Significance:** This benchmark tests the **generalization** of the self-correction behavior. Success here proves that the LABD framework taught the model *how to debug*, not just how to solve MBPP-specific problems.
---
## 📈 Metric: Pass@3 (Agentic)

We define a task as **"Solved"** if the agent achieves functional correctness within a maximum of **3 turns**. 

| Model | HumanEval (Pass@1) | HumanEval (Pass@3 w/ LABD) | MBPP (Pass@3 w/ LABD) |
| :--- | :---: | :---: | :---: |
| Qwen3-0.6B-LABD | 12.8% | **24.4%** | 58.2% |
| Qwen3-1.7B-LABD | 28.6% | **41.2%** | 67.5% |
| Qwen3-8B-LABD-GRPO | 44.5% | **64.6% (+20.1%)** | 82.1% |

---

## 📈 Evaluation Workflow

1. **Initialization:** Load the model (e.g., `Qwen3-8B-LABD-GRPO`) and the MBPP dataset.
2. **Prompting:** The agent is given a System Instruction defining the LABD protocol and the coding problem.
3. **The Loop:**
* **Generate:** Model produces reasoning (`<think>`) and code (`<execute>`).
* **Execute:** The sandbox runs the code and returns the result.
* **Feedback:** If the code fails, the error message is appended to the conversation.
* **Retry:** The model attempts a fix based on the feedback (up to 3 times).


4. **Logging:** Results are saved line-by-line in a `.jsonl` file for final metric calculation.

---

## 📂 Output Format

The results are stored in JSONL format, preserving the full "thought process" of the agent:

```json
{
  "task_id": 612,
  "solved": true,
  "attempts_used": 2,
  "conversation": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "Problem: ..."},
    {"role": "assistant", "content": "<think>...</think><execute>...</execute>"},
    {"role": "user", "content": "<feedback>Execution Failed...</feedback>"},
    {"role": "assistant", "content": "<think>Fixed logic...</think><execute>...</execute>"}
  ]
}

```

---

## 🚀 How to Run

1. Ensure you have an NVIDIA GPU (24GB+ VRAM recommended for 8B models).
2. Install dependencies: `pip install unsloth datasets`.
3. Open `qwen3-grpo-evaluation.ipynb` and update the `drive_output_path` to your desired results directory.
4. Run all cells to start the automated evaluation.
