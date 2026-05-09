import { useState, useCallback, useRef } from 'react';

export const AGENT_STATE = {
    IDLE: 'idle',
    THINKING: 'thinking',
    WRITING_CODE: 'writing_code',
    EXECUTING: 'executing',
    SUCCESS: 'success',
    FAILURE: 'failure',
    DEBUGGING: 'debugging',
    ANSWERING: 'answering'
};

const OLLAMA_ENDPOINT = 'http://localhost:11434/api/chat';
const LLAMA_CPP_ENDPOINT = 'http://localhost:8000/completion';
const EXECUTE_ENDPOINT = 'http://localhost:5000/execute';

const SYS_INSTRUCTION_XML = `You are an autonomous Self-Correcting Python Agent. Your objective is to produce robust, correct Python code by iteratively generating, testing, and debugging solutions.

### CORE PROTOCOL
You operate in a strictly defined loop: **THOUGHT** -> **ACTION** -> **OBSERVATION**.

1. **THOUGHT (\`<think>\`):**
   - **Initial Phase:** Analyze the problem requirements, identify edge cases, and formulate a plan.
   - **Debugging Phase:** If previous execution failed, perform a **Forensic Analysis**. You MUST explicitly compare the "Expected" vs "Actual" outputs, identify the **Root Cause** of the logic error, and define a **Fix Strategy**.
   - **Success Phase:** If the previous execution was successful, verify the solution is complete.

2. **ACTION (\`<execute>\` or Code Block):**
   - **Testing/Debugging:** If the solution is unverified or failed tests, output code inside \`<execute>\` tags.
     - **CRITICAL:** You MUST append the user-provided \`assert\` statements (test cases) at the end of the code to verify correctness.
   - **Finalization:** If and ONLY IF the system feedback is "Execution Successful":
     - Output the clean, final solution inside standard Markdown \`\`\`python\`\`\` tags (without the test assertions).
     - Provide a brief explanation of the code logic after the block.

### STRICT CONSTRAINTS
- **No Hallucination:** Do not simulate \`<feedback>\` tags. Wait for the system to provide execution results.
- **Evidence-Based:** In debugging, base your fix *strictly* on the error message provided in the feedback.
`;

// Helper to format prompt for Llama.cpp (ChatML style as per user example)
const formatPrompt = (messages) => {
    let prompt = "";
    for (const msg of messages) {
        prompt += `<|im_start|>${msg.role}\n${msg.content}<|im_end|>\n`;
    }
    prompt += "<|im_start|>assistant\n";
    return prompt;
};

export const useAgent = (debugMode = false) => {
    const [messages, setMessages] = useState([]);
    const [agentState, setAgentState] = useState({
        status: AGENT_STATE.IDLE,
        thought: '',
        code: '',
        output: '',
        execSuccess: false,
        iteration: 0,
        steps: [], // Array of completed steps { type, content, duration }
        currentStepStartTime: null,
        currentAnswer: ''
    });

    const abortControllerRef = useRef(null);

    const resetState = () => {
        setAgentState({
            status: AGENT_STATE.IDLE,
            thought: '',
            code: '',
            output: '',
            execSuccess: false,
            iteration: 0,
            steps: [],
            currentStepStartTime: null
        });
    };

    const addStep = (type, content, duration = null) => {
        setAgentState(prev => ({
            ...prev,
            steps: [...prev.steps, { type, content, duration }]
        }));
    };

    const processStream = async (chatMessages, currentIteration = 1, model = 'Siraj-1.7B-F16:latest', existingSteps = []) => {
        // Start Thinking
        const startTime = Date.now();
        setAgentState(prev => ({
            ...prev,
            status: debugMode ? AGENT_STATE.DEBUGGING : (currentIteration > 1 ? AGENT_STATE.DEBUGGING : AGENT_STATE.THINKING),
            currentStepStartTime: startTime,
            iteration: currentIteration
        }));

        // Create new controller for this request
        const controller = new AbortController();
        abortControllerRef.current = controller;

        let localSteps = [...existingSteps]; // Track steps locally to avoid stale state issues

        try {
            let response;
            const isLlamaCpp = typeof model === 'object' ? model.provider === 'llamacpp' : false;
            const modelName = typeof model === 'object' ? model.name : model;

            // Prepare context with potential System Prompt injection for Llama.cpp
            let contextWithSystem = [...chatMessages];

            if (isLlamaCpp) {
                if (contextWithSystem.length === 0 || contextWithSystem[0].role !== 'system') {
                    contextWithSystem.unshift({
                        role: 'system',
                        content: SYS_INSTRUCTION_XML
                    });
                }
            }

            if (isLlamaCpp) {
                // Llama.cpp API Usage
                const prompt = formatPrompt(contextWithSystem);
                response = await fetch(LLAMA_CPP_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: prompt,
                        n_predict: 5120, // max_tokens from python example
                        temperature: 0.5,
                        top_p: 1.0,
                        stream: true,
                        stop: ["<|im_end|>", "<|endoftext|>"]
                    }),
                    signal: abortControllerRef.current.signal
                });
            } else {
                // Ollama API Usage
                response = await fetch(OLLAMA_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: modelName,
                        messages: chatMessages,
                        stream: true,
                    }),
                    signal: abortControllerRef.current.signal
                });
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let currentThought = '';
            let currentCode = '';
            let thoughtRecorded = false;
            let codeRecording = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    try {
                        let content = '';

                        if (isLlamaCpp) {
                            // Llama.cpp SSE format: "data: {...}"
                            if (line.startsWith("data: ")) {
                                const jsonStr = line.slice(6); // Remove "data: "
                                if (jsonStr.trim() === '[DONE]') continue;

                                const json = JSON.parse(jsonStr);
                                if (json.content) {
                                    content = json.content;
                                }
                                if (json.stop) break;
                            }
                        } else {
                            // Ollama format: JSON objects
                            const json = JSON.parse(line);
                            if (json.done) continue;
                            content = json.message?.content || '';
                        }

                        if (!content) continue;

                        fullText += content;

                        // --- DEBUG MODE ---
                        if (debugMode) {
                            // In debug mode, we just stream everything to thought/output and skip parsing
                            // We use 'thought' to hold the raw streaming text so it can be accessed by UI
                            setAgentState(prev => ({ ...prev, thought: fullText }));

                            // FIX: Also attempt to extract code so the Code Editor works
                            const execMatch = fullText.match(/<execute>([\s\S]*?)(?:<\/execute>|$)/);
                            if (execMatch) {
                                setAgentState(prev => ({ ...prev, code: execMatch[1] }));
                            }
                            continue;
                        }

                        // --- LIVE PARSING ---
                        if (fullText.includes('<think>') && !thoughtRecorded) {
                            // Ensure we are in thinking mode
                            setAgentState(prev => ({ ...prev, status: AGENT_STATE.THINKING }));
                        }

                        // Capture thought content
                        const thinkMatch = fullText.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
                        if (thinkMatch) {
                            currentThought = thinkMatch[1];
                            setAgentState(prev => ({ ...prev, thought: currentThought }));
                        }

                        // Detect end of thought
                        if (fullText.includes('</think>') && !thoughtRecorded) {
                            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
                            addStep('think', currentThought, duration);
                            localSteps.push({ type: 'think', content: currentThought, duration });
                            thoughtRecorded = true;
                            thoughtRecorded = true;
                            // Transition to next potential state? Wait for <execute>
                            setAgentState(prev => ({ ...prev, status: AGENT_STATE.ANSWERING }));
                        }

                        // Detect start of code
                        if (fullText.includes('<execute>')) {
                            if (!codeRecording) {
                                // Clear currentAnswer immediately so it doesn't show " <execute" partials
                                setAgentState(prev => ({ ...prev, status: AGENT_STATE.WRITING_CODE, currentAnswer: '' }));
                                codeRecording = true;
                            }
                            const execMatch = fullText.match(/<execute>([\s\S]*?)(?:<\/execute>|$)/);
                            if (execMatch) {
                                currentCode = execMatch[1];
                                setAgentState(prev => ({ ...prev, code: currentCode }));
                            }
                        }

                        // Streaming Answer (if in ANSWERING state and not writing code)
                        // We strictly block updating answer if we see start of code tag
                        if (thoughtRecorded && !codeRecording && !fullText.includes('<execute>')) {
                            const answerPart = fullText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

                            // Check for partial tag to avoid flicker
                            // If it starts with <e, <ex, <exe, etc., don't show it yet
                            const isPartialTag = /<e(?:x(?:e(?:c(?:u(?:t(?:e)?)?)?)?)?)?$/.test(answerPart);

                            if (answerPart && !isPartialTag) {
                                setAgentState(prev => ({ ...prev, currentAnswer: answerPart }));
                            }
                        }

                    } catch (e) {
                        // gracefully ignore parse errors for partial chunks
                    }
                }
            }

            // Stream Finished

            // If code was generated, execute it
            const execMatch = fullText.match(/<execute>([\s\S]*?)<\/execute>/);
            if (execMatch) {
                // Record Code Step
                addStep('code', currentCode);
                localSteps.push({ type: 'code', content: currentCode });

                // Start Execution
                setAgentState(prev => ({ ...prev, status: AGENT_STATE.EXECUTING }));
                const execStart = Date.now();

                let codeToRun = execMatch[1].trim();
                // Clean up markdown code blocks if present
                if (codeToRun.startsWith('```python')) {
                    codeToRun = codeToRun.replace('```python', '').trim();
                } else if (codeToRun.startsWith('```')) {
                    codeToRun = codeToRun.replace('```', '').trim();
                }
                if (codeToRun.endsWith('```')) {
                    codeToRun = codeToRun.slice(0, -3).trim();
                }
                let result;
                let execDuration;

                try {
                    const execRes = await fetch(EXECUTE_ENDPOINT, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code: codeToRun })
                    });
                    result = await execRes.json();
                    execDuration = ((Date.now() - execStart) / 1000).toFixed(1);
                } catch (execErr) {
                    console.error('Execution Server Error:', execErr);
                    // Only show detailed error in chat if in Debug Mode
                    if (debugMode) {
                        setMessages(prev => [...prev, {
                            role: 'assistant',
                            content: `**Execution Error:** Failed to connect to the Code Execution Server. Please ensure it is running at ${EXECUTE_ENDPOINT}.\n\nDetails: ${execErr.message}`
                        }]);
                    }
                    setAgentState(prev => ({
                        ...prev,
                        status: AGENT_STATE.FAILURE,
                        output: `Execution Server Error: ${execErr.message}`,
                        execSuccess: false
                    }));
                    addStep('error', `Execution Connectivity Error: ${execErr.message}`);
                    return; // Stop processing on execution system failure
                }

                setAgentState(prev => ({
                    ...prev,
                    status: result.success ? AGENT_STATE.SUCCESS : AGENT_STATE.FAILURE,
                    output: result.output,
                    execSuccess: result.success
                }));

                // Record Execution Step
                addStep(result.success ? 'success' : 'error', result.output, execDuration);
                localSteps.push({ type: result.success ? 'success' : 'error', content: result.output, duration: execDuration });

                // Feedback Loop
                if (currentIteration < 5) { // MAX
                    // Reuse system context for continued conversation so we don't injecting it multiple times if we passed it recursively?
                    // Actually processStream takes `chatMessages`.
                    // The recursive call passes `newHistory`.
                    // We need to make sure `newHistory` DOES NOT accumulate multiple system prompts if we are not careful.
                    // But `contextWithSystem` was local. `chatMessages` was the argument.
                    // `newHistory` is constructed from `chatMessages`.
                    // So `newHistory` does NOT have the system prompt if `chatMessages` didn't have it.
                    // This means `processStream` will inject it AGAIN every time.

                    // Wait, if `processStream` injects it into `contextWithSystem` which is used for FETCH...
                    // But `newHistory` is constructed for RECURSION.
                    // We should probably ensure the recursion is consistent.

                    // Construct new history for recursion
                    const feedbackMsg = `<feedback>\n${result.success ? 'Execution Success' : 'Execution Failed'}\n${result.output}\n</feedback>`;
                    const newHistory = [
                        ...chatMessages,
                        { role: 'assistant', content: fullText },
                        { role: 'user', content: feedbackMsg }
                    ];

                    if (debugMode) {
                        setMessages(prev => [
                            ...prev,
                            { role: 'assistant', content: fullText, steps: localSteps, fullContent: fullText },
                            { role: 'user', content: feedbackMsg, rawInput: newHistory }
                        ]);
                        resetState();
                    }

                    if (!result.success) {
                        await processStream(newHistory, currentIteration + 1, model, localSteps);
                    } else {
                        await processStream(newHistory, currentIteration, model, localSteps);
                    }
                }
            } else {
                // Final Answer Phase
                const finalAnswer = debugMode
                    ? fullText
                    : fullText.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<execute>[\s\S]*?<\/execute>/g, '').trim();

                const finalSteps = [...localSteps];
                if (!thoughtRecorded && currentThought) {
                    finalSteps.push({ type: 'think', content: currentThought, duration: 'Final' });
                }
                // Log final answer confirmation
                finalSteps.push({ type: 'answer', content: '' });

                if (debugMode) {
                    setMessages(prev => [
                        ...prev,
                        {
                            role: 'assistant',
                            content: finalAnswer,
                            fullContent: fullText,
                            steps: finalSteps
                        }
                    ]);
                } else {
                    // Mark intermediate messages as intermediate so UI can hide them
                    const newGeneratedMessages = chatMessages.slice(messages.length + 1).map(m => ({
                        ...m,
                        isIntermediate: true
                    }));

                    setMessages(prev => [
                        ...prev,
                        ...newGeneratedMessages,
                        {
                            role: 'assistant',
                            content: finalAnswer,
                            fullContent: fullText,
                            steps: finalSteps
                        }
                    ]);
                }

                // Do NOT reset completely. We want to keep code/output visible in the Sidebar but set status to IDLE.
                setAgentState(prev => ({
                    ...prev,
                    status: AGENT_STATE.IDLE,
                    thought: '', // Clear streaming thought buffer
                    currentAnswer: '' // Clear streaming answer
                    // code, output, execSuccess kept for Reference
                }));
            }

        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Generation stopped by user');
                if (fullText) {
                    setMessages(prev => [...prev, ...chatMessages.slice(messages.length), {
                        role: 'assistant',
                        content: fullText,
                        aborted: true
                    }]);
                }
                setAgentState(prev => ({ ...prev, status: AGENT_STATE.IDLE }));
            } else {
                console.error(err);
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `**Connection Error:** Failed to connect to AI Provider. Please ensure the service is running.\n\nDetails: ${err.message}`
                }]);
                setAgentState(prev => ({ ...prev, status: AGENT_STATE.IDLE }));
            }
        }
    };

    const sendMessage = async (text, model) => {
        resetState();

        const history = messages.map(m => ({ role: m.role, content: m.content }));
        const nextMessage = { role: 'user', content: text };
        const fullContext = [...history, nextMessage];

        setMessages(prev => [
            ...prev,
            {
                ...nextMessage,
                rawInput: debugMode ? fullContext : undefined
            }
        ]);

        await processStream(fullContext, 1, model, []);
    };

    const loadSession = (savedMessages, savedAgentState) => {
        setMessages(savedMessages);
        if (savedAgentState) {
            setAgentState(savedAgentState);
        } else {
            resetState();
        }
    };

    const clearSession = () => {
        setMessages([]);
        resetState();
    };

    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    return {
        messages,
        agentState,
        sendMessage,
        stopGeneration,
        loadSession,
        clearSession
    };
};
