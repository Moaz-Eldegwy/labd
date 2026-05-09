import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"

def format_prompt_chatml(messages):
    """
    Converts a list of messages into Qwen's ChatML format string.
    This simulates what the 'chat' endpoint usually does behind the scenes.
    """
    prompt = ""
    for msg in messages:
        role = msg["role"]
        content = msg["content"]
        prompt += f"<|im_start|>{role}\n{content}<|im_end|>\n"
    
    # Prepare the assistant's turn
    prompt += "<|im_start|>assistant\n"
    return prompt

def raw_chat_completion(messages, temperature=0.5, max_tokens=5120):
    """
    Takes chat messages, formats them, and hits the raw completion endpoint
    to avoid tag stripping.
    """
    # 1. Convert Chat List -> Raw String
    prompt_str = format_prompt_chatml(messages)
    
    # 2. Prepare Payload for the Raw Endpoint
    payload = {
        "prompt": prompt_str,
        "n_predict": max_tokens,
        "temperature": temperature,
        "top_p": 1.0,
        "stream": True,
        "stop": ["<|im_end|>", "<|endoftext|>"]
    }
    
    # 3. Request to /completion (The "dumb" endpoint that doesn't hide tags)
    response = requests.post(f"{BASE_URL}/completion", json=payload, stream=True)
    
    # 4. Generator to stream the content
    for line in response.iter_lines():
        if line:
            decoded_line = line.decode('utf-8').strip()
            if decoded_line.startswith("data: "):
                json_str = decoded_line[6:] # Remove "data: "
                try:
                    chunk = json.loads(json_str)
                    # The raw endpoint puts everything in 'content'
                    if "content" in chunk:
                        yield chunk["content"]
                    if chunk.get("stop", False):
                        break
                except json.JSONDecodeError:
                    pass

# ==========================================
# Usage
# ==========================================

sys_instruction_xml = """You are an autonomous Self-Correcting Python Agent. Your objective is to produce robust, correct Python code by iteratively generating, testing, and debugging solutions.

### CORE PROTOCOL
You operate in a strictly defined loop: **THOUGHT** -> **ACTION** -> **OBSERVATION**.

1. **THOUGHT (`<think>`):**
   - **Initial Phase:** Analyze the problem requirements, identify edge cases, and formulate a plan.
   - **Debugging Phase:** If previous execution failed, perform a **Forensic Analysis**. You MUST explicitly compare the "Expected" vs "Actual" outputs, identify the **Root Cause** of the logic error, and define a **Fix Strategy**.
   - **Success Phase:** If the previous execution was successful, verify the solution is complete.

2. **ACTION (`<execute>` or Code Block):**
   - **Testing/Debugging:** If the solution is unverified or failed tests, output code inside `<execute>` tags.
     - **CRITICAL:** You MUST append the user-provided `assert` statements (test cases) at the end of the code to verify correctness.
   - **Finalization:** If and ONLY IF the system feedback is "Execution Successful":
     - Output the clean, final solution inside standard Markdown ```python``` tags (without the test assertions).
     - Provide a brief explanation of the code logic after the block.

### STRICT CONSTRAINTS
- **No Hallucination:** Do not simulate `<feedback>` tags. Wait for the system to provide execution results.
- **Evidence-Based:** In debugging, base your fix *strictly* on the error message provided in the feedback.
"""

messages = [
    {"role": "system", "content": sys_instruction_xml},
    {
        "role": "user",
        "content": "Problem: Write a python function to find the largest positive number from the given list.\n  \nTest Cases:\nassert largest_pos([1,2,3,4,-1]) == 4\nassert largest_pos([0,1,2,-5,-1,6]) == 6\nassert largest_pos([0,0,1,0]) == 1"
    }
]

print("Siraj is thinking (Raw Stream)...")

# Use the wrapper instead of client.chat.completions
for content_chunk in raw_chat_completion(messages):
    print(content_chunk, end="", flush=True)