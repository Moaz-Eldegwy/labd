# SCA-UI — Self-Correcting Agent UI

An interactive web interface for an AI-powered self-correcting Python coding agent. The agent follows a **THOUGHT → ACTION → OBSERVATION** loop to iteratively write, execute, test, and debug Python code until a correct solution is reached.

## How It Works

1. You describe a Python problem and provide test cases (assertions)
2. The agent **thinks** through the problem, then writes code inside `<execute>` tags
3. Code is sent to a local execution server, which runs it and returns results
4. If execution fails, the agent receives the error as feedback, **debugs**, and retries
5. Once tests pass, the agent outputs the clean final solution

The entire loop is streamed live — you can watch the agent's reasoning, code writing, and execution output in real time.

## Architecture

```
SCA-UI/
├── backend_server.py       # FastAPI server — receives code, executes it, returns results
├── execution_code.py       # Code execution engine with timeout & error analysis
├── llama_api_usage.py      # Example: Llama.cpp ChatML streaming usage
├── requirements.txt        # Python dependencies
└── ui/                     # React frontend (Vite)
    ├── src/
    │   ├── App.jsx             # Main app layout
    │   ├── components/         # UI components (chat, sidebar, code editor, etc.)
    │   └── hooks/
    │       └── useAgent.js     # Core agent loop — streaming, parsing, execution
    ├── package.json
    └── vite.config.js
```

## Supported LLM Providers

The agent connects to **local** LLM inference servers — no cloud API keys required.

| Provider  | Default Endpoint               |
| --------- | ------------------------------ |
| Ollama    | `http://localhost:11434`       |
| Llama.cpp | `http://localhost:8000`        |

Switch between providers from the model selector dropdown in the UI.

## Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- A running local LLM server (Ollama or Llama.cpp)

### 1. Start the Backend

```bash
pip install -r requirements.txt
python backend_server.py
```

This starts the code execution server at `http://localhost:5000`.

### 2. Start the Frontend

```bash
cd ui
npm install
npm run dev
```

The UI will be available at `http://localhost:5173`.

### 3. Start Your LLM Server

**Ollama:**
```bash
ollama serve
ollama pull <model-name>
```

**Llama.cpp:**
```bash
./llama-server -m <model.gguf> --port 8000
```

### 4. Open the UI

Navigate to `http://localhost:5173`, select your model from the dropdown, and start chatting.

## Features

- **Live streaming** of agent thoughts, code, and execution output
- **Automatic self-correction loop** — the agent debugs and retries on failure (up to 5 iterations)
- **Syntax-highlighted code editor** panel
- **Terminal output panel** with error type classification (syntactical, runtime, logical)
- **Chat history** with folder organization
- **Dark / light theme** toggle
- **Debug mode** — view raw LLM input/output for development
- **User & agent profiles** — customizable names and avatars

## Tech Stack

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Frontend | React 19, Vite, react-markdown, react-syntax-highlighter |
| Backend  | FastAPI, uvicorn, Pydantic              |
| AI       | Ollama or Llama.cpp (local inference)   |

## License

MIT
