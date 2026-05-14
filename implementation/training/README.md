# Training Pipelines

This directory contains the core training pipelines for the **LABD (Loop-Driven Agentic Behavior Distillation)** framework. The training process is divided into two distinct stages: behavioral distillation via SFT and reasoning optimization via GRPO.

Both pipelines are optimized for efficiency using the [Unsloth](https://github.com/unslothai/unsloth) library and the [TRL](https://github.com/huggingface/trl) (Transformer Reinforcement Learning) stack.

---

# 🚀 Training Pipeline Overview


### 1. Stage One: Agentic Behavior Distillation (SFT)

**Notebook:** [`qwen3_LABD_SFT_finetuning.ipynb`](./qwen3_LABD_SFT_finetuning.ipynb)

In this stage, we distill the self-correction capabilities from a strong teacher model into the Qwen3 base models (ranging from 0.6B to 8B).

* **Objective:** Teach the model to utilize the agentic loop tags: `<think>` for reasoning, `<execute>` for code generation, and parsing the `<feedback>` from the Python interpreter.
* **Technique:** Parameter-Efficient Fine-Tuning (PEFT) using **LoRA**.
* **Key Configurations:**
* **Base Model:** `Qwen3` (referred to as Qwen3 in the project context).
* **Dataset:** [moazeldegwy/LABD-MBPP](https://huggingface.co/datasets/moazeldegwy/LABD-MBPP).
* **Optimizer:** AdamW with linear schedule.
* **Hardware:** Optimized for 16GB–24GB VRAM (e.g., T4 or L4 GPUs).



### 2. Stage Two: Reasoning Optimization (GRPO)

**Notebook:** [`labd-grpo-training.ipynb`](./labd-grpo-training.ipynb)

After the model learns the "format" of self-correction, we use **Group Relative Policy Optimization (GRPO)** to optimize its reasoning efficiency and success rate.

* **Objective:** Maximize the probability of generating a correct repair in the fewest possible steps.
* **Infrastructure:** Uses **vLLM** as the fast-inference engine for generating rollouts during training.
* **Reward System:** The model is rewarded based on:
1. **Functional Correctness:** Passing unit tests in the execution environment.
2. **Format Adherence:** Proper usage of the XML-style agent tags.


* **Technical Details:**
* **Max Sequence Length:** 6,144 tokens (to accommodate long multi-turn trajectories).
* **Dtype:** `bfloat16` for numerical stability and speed on NVIDIA Ampere+ architectures.
* **LoRA Rank:** 16 (targeting all linear layers for maximum expressivity).



---

# 🛠️ Installation & Setup

To run these notebooks, ensure you have a GPU-enabled environment with the following dependencies:

```bash
pip install unsloth vllm trl transformers accelerate peft

```

> [!NOTE]
> The GRPO notebook requires a high-performance backend (like NVIDIA L40S or A100) due to the VRAM requirements of running a training model and a vLLM inference engine simultaneously.

# 📈 Model Scaling

We applied these training scripts to scale the LABD behavior across four model sizes:

1. **Qwen3-0.6B-LABD**: The ultra-lightweight edge agent.
2. **Qwen3-1.7B-LABD**: Balanced performance and speed.
3. **Qwen3-4B-LABD**: High reasoning capability for complex logic.
4. **Qwen3-8B-LABD**: The flagship model, further optimized with GRPO.

---

### 💡 Implementation Tip

When using `labd-grpo-training.ipynb`, make sure to set the `UNSLOTH_VLLM_STANDBY=1` environment variable. This allows Unsloth to manage the GPU memory handoff between the `GRPOTrainer` and the `vLLM` rollout worker effectively.
