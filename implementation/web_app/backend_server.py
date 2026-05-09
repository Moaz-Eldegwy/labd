from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from execution_code import execute_code_with_feedback
import uvicorn
import sys

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExecuteRequest(BaseModel):
    code: str
    test_cases: list[str] = []

@app.post("/execute")
async def execute_code(request: ExecuteRequest):
    try:
        success, output, error_type = execute_code_with_feedback(request.code, request.test_cases)
        return {
            "success": success,
            "output": output,
            "error_type": error_type
        }
    except Exception as e:
        return {
            "success": False,
            "output": f"Server Error: {str(e)}",
            "error_type": "Server"
        }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5000)
