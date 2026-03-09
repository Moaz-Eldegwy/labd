Date of publication xxxx 00, 0000, date of current version xxxx 00, 0000.

DOI: 10.1109/ACCESS.2024.0429000

Escaping the Reasoning Cliff: Loop-Driven Agentic Behavior Distillation for Self-Correcting Small Language Models

First A. Author, Fellow, IEEE  
Second B. Author  
Third C. Author, Jr., Member, IEEE

National Institute of Standards and Technology, Boulder, CO 80305 USA (e-mail: author@boulder.nist.gov)  
Department of Physics, Colorado State University, Fort Collins, CO 80523 USA (e-mail: author@lamar.colostate.edu)  
Electrical Engineering Department, University of Colorado, Boulder, CO 80309 USA

This paragraph of the first footnote will contain support information, including sponsor and financial support acknowledgment. For example, “This work was supported in part by the U.S. Department of Commerce under Grant BS123456.”

Corresponding author: First A. Author (e-mail: author@boulder.nist.gov).

---

## Abstract

Small and mid-scale Language Models often struggle with iterative self-correction, exhibiting a pronounced reasoning cliff. While frontier models can recover from errors through prompting alone, smaller models frequently collapse into hallucination or fail to recover once an initial attempt is incorrect. We address this limitation with a two-stage post-training framework that teaches models not only what to generate, but how to behave within a closed-loop correction process.

We introduce Loop-Driven Agentic Behavior Distillation, a supervised fine-tuning paradigm that distills self-correcting trajectories rather than isolated solutions. Our data generation employs failure-induced trajectory generation, where a weak model produces error-prone candidates that are subsequently repaired by a strong teacher under explicit execution feedback. This exposes models to planning, execution, observation, and recovery, enabling them to internalize structured agentic loops.

We further apply Group Relative Policy Optimization (GRPO) to stabilize and ground this behavior using execution-based rewards. Evaluating across the Qwen-3 and OLMo-2 families on MBPP and HumanEval, we find that supervised distillation alone instills the structure of self-correction even in sub-1B models, while reinforcement learning is necessary to ground recovery behavior at scale. Crucially, the full benefits emerge above 4B parameters, where sufficient capacity allows learned agentic recovery behavior to generalize beyond pattern imitation. In our framework, reinforcement learning stabilizes pre-learned behaviors rather than discovering correction strategies from scratch.

Keywords: Agentic Behavior, Code Generation, Group Relative Policy Optimization (GRPO), Large Language Models (LLMs), Model Distillation, Self-Correction, Small Language Models (SLMs), Supervised Fine-Tuning (SFT).

---

## Introduction

The democratization of Artificial Intelligence increasingly depends on the ability of Small Language Models (SLMs) to perform complex, multi-step tasks on consumer-grade hardware. While recent SLMs have demonstrated strong performance on single-pass generation benchmarks, they continue to struggle with agentic workflows—particularly those requiring error detection, causal reasoning, and iterative recovery. This limitation manifests as a pronounced Reasoning Cliff: a sharp degradation in performance when tasks demand multi-step reasoning or feedback-driven self-correction.

Existing approaches expose a fundamental paradox. Prompting-based self-correction methods, such as Self-Refine, rely on latent self-awareness and internal critique mechanisms that smaller models often lack, frequently leading to hallucination or collapse once an initial attempt fails. Conversely, training-based approaches typically depend on reinforcement learning pipelines that are difficult to stabilize at smaller scales. Recent results on SCoRe demonstrate that standard PPO-style optimization can induce mode collapse in sub-3B models due to sparse rewards and fragile value estimates.

In this work, we propose a unified post-training recipe that enables stable, autonomous self-correction across model scales. Our central hypothesis is that self-correction is not an emergent property in small and mid-scale models, but a learnable agentic behavior that must be explicitly taught rather than elicited through prompting.

We operationalize this hypothesis through a two-stage framework:

1. Loop-Driven Agentic Behavior Distillation (LABD)  
2. Group Relative Policy Optimization (GRPO)

While we focus on self-correcting code generation as a concrete instantiation, LABD is a general post-training framework for distilling closed-loop agentic behaviors beyond correction alone, including planning, verification, and recovery under feedback.

---

## Why Scaling Beyond 4B Matters

To study the interaction between agentic behavior learning and model capacity, we intentionally expand our evaluation beyond Tiny Models (≤4B) to include Small Models (4B–40B). While Tiny Models are attractive for efficiency and deployment, they remain fundamentally constrained by representational capacity.

A sub-1B or 1.7B model may learn how to behave correctly—planning, debugging, retrying—yet still fail when required knowledge lies outside its capacity frontier.

By including Qwen3-8B and OLMo2-7B, we aim to isolate this effect and demonstrate that our recipe does not merely teach surface-level correction heuristics, but unlocks substantially greater recovery competence when sufficient model capacity is available.

This scale sweep allows us to disentangle behavioral acquisition enabled by LABD from pure knowledge and representational limits governed by model capacity.

---

## Related Work

### Self-Correction and the Reasoning Cliff in Small Language Models

Recent studies have identified a sharp degradation in multi-step reasoning and error recovery for language models below a critical parameter threshold, commonly referred to as the reasoning cliff.

While Small Language Models often achieve competitive performance on single-pass generation benchmarks, they struggle to maintain causal coherence when required to iteratively debug or revise their outputs.

This phenomenon has been further analyzed through the lens of the agentic gap, which characterizes the disparity between a model’s static knowledge and its ability to operate effectively within feedback-driven loops.

Prompting-based self-correction methods, such as Self-Refine, implicitly assume that a model already possesses latent self-critique capabilities. While this assumption holds for frontier-scale models, empirical evaluations show that it fails for SLMs, often leading to hallucination or regression after an incorrect initial attempt.

These findings suggest that self-correction in small models is not an emergent property that can be reliably elicited through prompting alone.

---

### Training-Based Approaches to Self-Correcting Code Generation

To address the limitations of prompting, several training-based approaches have been proposed.

CoCoS explicitly targets self-correction in 1B-scale models using online reinforcement learning with accumulated and finely shaped rewards across correction trajectories. While effective, this approach relies on carefully engineered reward signals to mitigate reward sparsity.

SCoRe introduces a two-stage PPO-based framework for student-centered reinforcement learning. However, subsequent analyses demonstrate that PPO-style optimization is often unstable for small models, leading to KL divergence explosion and mode collapse when rewards are sparse or binary.

Murphy extends Group Relative Policy Optimization (GRPO) to a multi-turn tree-search setting, enabling credit assignment across correction steps. While Murphy improves over vanilla GRPO, it primarily focuses on reinforcement learning dynamics and initializes from standard supervised fine-tuning.

---

### Behavior and Trajectory Distillation

Traditional Knowledge Distillation aligns student outputs with teacher logits, transferring task performance but not procedural reasoning.

Behavior Distillation and trajectory-based learning instead train models on expert action sequences rather than final answers.

For debugging and similar tasks, where intermediate decisions matter, trajectory learning is particularly important.

In contrast to prior work that focuses mainly on successful expert trajectories, our approach explicitly preserves and distills failure-conditioned recovery trajectories initiated by a weak student model and repaired by a teacher under execution feedback.

---

### Reinforcement Learning with Verifiable Rewards

Reinforcement Learning with Verifiable Rewards replaces subjective human feedback with objective execution outcomes, making it well suited for code generation tasks.

Group Relative Policy Optimization has emerged as a practical standard in this setting due to its critic-free formulation, which significantly reduces memory overhead and improves training stability.

Unlike PPO, GRPO normalizes rewards within a group of sampled outputs, providing robust learning signals even in sparse-reward regimes.

This property is particularly important for small models that are prone to instability during reinforcement learning.

---

## Proposed Methodology

### Phase 1: Loop-Driven Agentic Behavior Distillation

The goal of Phase 1 is to initialize Small Language Models with the structure of agentic self-correction before any reinforcement learning is applied.

Rather than optimizing for correctness directly, this phase teaches models how to behave inside a closed-loop interaction: planning, executing, observing feedback, and recovering from failure.

This is achieved through Loop-Driven Agentic Behavior Distillation, a supervised fine-tuning paradigm that distills failure-conditioned correction trajectories instead of isolated expert solutions.

LABD consists of three tightly coupled components:

1. Failure-induced trajectory generation initiated by a weak student model  
2. Teacher-guided repair under explicit execution feedback  
3. Supervised distillation of complete agentic loops including failures and recoveries

The key idea is to allow the student model to fail naturally, execute its outputs, capture the resulting feedback, and then allow a stronger teacher model to repair the solution.

The resulting interaction trajectory contains planning, execution, observation, and recovery steps.

These full trajectories are then used for supervised training so that the student learns how recovery processes work.

---

### Phase 2: Group Relative Policy Optimization

After LABD training provides behavioral structure, reinforcement learning is applied to stabilize and refine the learned behaviors.

Group Relative Policy Optimization computes advantages by normalizing rewards within groups of sampled outputs.

This approach removes the need for a learned value function and provides stable learning signals even with sparse rewards.

Rewards are based on three signals:

1. Correctness reward based on unit test success  
2. Structural adherence reward for maintaining the agentic output format  
3. Efficiency penalty to discourage unnecessary verbosity

Training uses low-rank adaptation on quantized models to enable reinforcement learning on consumer hardware.

---

## Experimental Framework

### Evaluation Paradigm

Models are evaluated as autonomous self-correcting agents operating within a closed loop:

THOUGHT → EXECUTE → FEEDBACK → REPAIR

Failures are preserved rather than filtered, enabling direct measurement of recovery behavior.

---

### Benchmarks

Two standard code-generation benchmarks are used:

MBPP (Mostly Basic Python Problems)  
HumanEval

Correctness is determined exclusively through execution against benchmark unit tests.

---

### Metrics

Metrics derived from full trajectories include:

Pass@1  
Pass@2  
Pass@3  
Correction Rate (CR)

Correction Rate measures the probability that an initially failed task is later recovered during correction attempts.

---

## Results and Analysis

LABD consistently improves Pass@2 and Pass@3 across models, indicating stronger recovery behavior even when initial Pass@1 accuracy remains unchanged.

This demonstrates that the primary benefit of LABD lies in improving recovery rather than initial generation.

Across models below 4B parameters, the structure of self-correction emerges reliably.

However, the ability to recover successfully depends strongly on model capacity.

Above 4B parameters, models begin to use feedback much more effectively, leading to stronger recovery performance.

Reinforcement learning with GRPO further stabilizes these behaviors, reducing oscillations and hallucinations during correction loops.

---

## Discussion

Our findings suggest that the reasoning cliff in Small Language Models arises from the interaction between behavior and capacity.

LABD addresses the behavioral side by explicitly teaching closed-loop reasoning and correction.

Model scale determines how effectively these behaviors can translate into correct outcomes.

The transition observed between 4B and 8B parameters indicates that behavioral competence alone is insufficient without sufficient representational capacity.

Reinforcement learning then plays a calibration role, grounding these behaviors through execution feedback.

---

## Conclusion

This work demonstrates that self-correction in small and mid-scale language models is a trainable agentic behavior.

Loop-Driven Agentic Behavior Distillation teaches models how to operate within closed-loop reasoning and correction processes by distilling failure-conditioned trajectories.

Supervised distillation teaches the structure of self-correction, while GRPO reinforcement learning stabilizes and grounds the behavior.

The results show that effective self-correction emerges from the interaction between learned behavior and model capacity.

LABD therefore reveals existing capability rather than creating new knowledge.

---

## Future Work

Future work will extend LABD beyond code execution tasks to domains where failures arise from missing knowledge rather than incorrect reasoning.

One promising direction is combining LABD with retrieval-augmented generation systems.

In such settings, recovery may involve recognizing knowledge gaps, issuing retrieval queries, and integrating retrieved evidence into reasoning processes.

More broadly, LABD may serve as a general framework for teaching agentic skills such as tool usage, planning, verification, and adaptive strategy selection.

---

## References

[1] T. Zhang et al., “The Illusion of Thinking: Measuring the Reasoning Cliff,” ICLR, 2025.  
[2] Y. Zhang et al., “Reframing the Reasoning Cliff as an Agentic Gap,” arXiv:2506.18957, 2025.  
[3] J. Cho et al., “Self-Correcting Code Generation Using Small Language Models,” EMNLP Findings, 2025.  
[4] A. Kumar et al., “SCoRe: Student-Centered One-step Reinforcement,” arXiv, 2025.  
[5] S. Ekbote et al., “Murphy: Multi-Turn GRPO for Self-Correcting Code Generation,” arXiv:2511.07833, 2025.  
[6] G. Hinton, O. Vinyals, and J. Dean, “Distilling the Knowledge in a Neural Network,” NeurIPS DL Workshop, 2015.  
[7] P. Florence et al., “Offline Behavior Distillation,” Emergent Mind Survey, 2024.  
[8] Z. Shao et al., “DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models,” arXiv, 2024.  
[9] TRL Contributors, “GRPO Trainer Documentation,” Hugging Face, 2025.  
[10] Oxen.ai, “Why GRPO is Important and How it Works,” Technical Blog, 2025.  
[11] H. Li et al., “G2RPO-A: Guided Group Relative Policy Optimization,” arXiv, 2025.  
[12] X. Wang et al., “Multi-Layer GRPO: Enhancing Reasoning and Self-Correction in LLMs,” ICML Workshop, 2025.