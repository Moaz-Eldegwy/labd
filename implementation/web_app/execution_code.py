import os
import re
import ast
import json
import sys
import time
import io
import signal
import contextlib
import traceback
from copy import deepcopy


# --- Definitions for Timeout Handling ---
class TimeoutException(Exception):
    pass

import threading

def run_with_timeout(func, args, kwargs, timeout_duration):
    class Result:
        val = None
        exc = None
    
    res = Result()
    
    def target():
        try:
            res.val = func(*args, **kwargs)
        except Exception as e:
            res.exc = e

    t = threading.Thread(target=target)
    t.daemon = True # Allow main program to exit if this thread hangs
    t.start()
    t.join(timeout_duration)

    if t.is_alive():
        raise TimeoutException("Execution timed out")
    
    if res.exc:
        raise res.exc
    return res.val

# --- NEW: Forensic Assertion Analyzer ---
def analyze_assertion_failure(line_code, context):
    """
    Parses the failing line to extract and evaluate Actual vs Expected values.
    """
    try:
        # Parse the single line of code into an AST
        tree = ast.parse(line_code.strip())

        # We look for an 'Assert' node
        if not isinstance(tree.body[0], ast.Assert):
            return None

        assert_node = tree.body[0]
        test_node = assert_node.test

        # We specifically target Comparisons (e.g., func(x) == y)
        if isinstance(test_node, ast.Compare):
            left_node = test_node.left
            right_node = test_node.comparators[0] # Focus on first comparator

            # Compile and Evaluate the Left Side (Actual) and Right Side (Expected)
            # We use the 'context' (local_scope) from the execution to access variables/functions
            left_val = eval(compile(ast.Expression(body=left_node), filename="<string>", mode="eval"), context)
            right_val = eval(compile(ast.Expression(body=right_node), filename="<string>", mode="eval"), context)

            return {
                "actual": left_val,
                "expected": right_val,
                "actual_repr": ast.unparse(left_node),  # e.g., "merge([...])"
                "expected_repr": ast.unparse(right_node) # e.g., "[['x', ...]]"
            }
    except Exception:
        # If AST parsing or evaluation fails (e.g., side effects), fall back gracefully
        return None
    return None

# --- Updated Execution Function ---
def execute_code_with_feedback(code_str, test_cases=None, timeout_seconds=5):
    if test_cases is None:
        test_cases = []

    stdout_capture = io.StringIO()
    stderr_capture = io.StringIO()

    # Combine code and test cases
    full_execution_script = f"{code_str}\n\n" + "\n".join(test_cases)

    # Internal execution wrapper
    def _exec_script():
        with contextlib.redirect_stdout(stdout_capture), contextlib.redirect_stderr(stderr_capture):
            local_scope = {}
            exec(full_execution_script, local_scope)
            return local_scope

    try:
        # Use threading timeout instead of signal
        run_with_timeout(_exec_script, (), {}, timeout_seconds)
        
        output = stdout_capture.getvalue()
        return True, f"Execution Successful. Stdout:\n{output}", "None"

    except TimeoutException:
        return False, "Execution Failed: Time Limit Exceeded (Possible Infinite Loop)", "Runtime"

    except Exception:
        # Get detailed error info
        exc_type, exc_value, exc_traceback = sys.exc_info()
        exc_name = exc_type.__name__

        # Extract specific line number
        tb_frames = traceback.extract_tb(exc_traceback)
        error_line_num = "Unknown"
        offending_line_code = "Could not extract line."

        # Logic to find the exact line in the string script
        if hasattr(exc_value, 'lineno'):
            error_line_num = exc_value.lineno
        elif tb_frames:
            for frame in reversed(tb_frames):
                if frame.filename == "<string>":
                    error_line_num = frame.lineno
                    break

        if isinstance(error_line_num, int):
            script_lines = full_execution_script.splitlines()
            if 0 <= error_line_num - 1 < len(script_lines):
                offending_line_code = script_lines[error_line_num - 1].strip()

        # --- Enhanced Error Analysis ---
        details = str(exc_value)
        rich_feedback = ""

        if exc_name == 'AssertionError':
            # Run the forensic analysis
            # Access local_scope from the thread? Not easily possible if it failed inside.
            # But the forensic analysis runs on the SOURCE CODE and uses `eval` which needs context.
            # Since the execution failed, we might not have the full context if it crashed early.
            # However, for assertion error, the context DOES exist at the point of failure.
            # But we can't easily retrieve `local_scope` from the crashed thread function unless we passed it out.
            # But `_exec_script` returns `local_scope` only on success.
            # Fix: We can't do deep forensic analysis if we can't inspect the frame.
            # But in `except Exception`, we are in the exception context.
            # Wait, `run_with_timeout` re-raises the exception. The stack trace *might* be preserved?
            # Actually, the exception from thread is re-raised. The local variables of the thread function are lost unless attached to exception.
            # `sys.exc_info()` here corresponds to the re-raised exception.
            # We skip forensic analysis that requires live context for this limited refactor to ensure stability.
            pass

            # Alternative: Retry basic analysis?
            # For now, let's keep it simple to ensure it runs on Windows.
            
        # Determine Category
        if exc_name in ['IndentationError', 'SyntaxError']:
            error_type = 'Syntactical'
        elif exc_name == 'AssertionError':
            error_type = 'Logical'
        else:
            error_type = 'Runtime'

        error_msg = (
            f"Error Type: {exc_name}\n"
            f"Line {error_line_num}: {offending_line_code}\n"
            f"Details: {details}"
            f"{rich_feedback}"
        )

        return False, error_msg, error_type

# --- Extraction Helper ---
def extract_code(text):
    if not text: return None
    match = re.search(r"<execute>\s*(.*?)\s*</execute>", text, re.DOTALL)
    if match:
        code = match.group(1).strip()
        if code.startswith("```python"): code = code.replace("```python", "", 1)
        if code.startswith("```"): code = code.replace("```", "", 1)
        if code.endswith("```"): code = code[: -3]
        return code.strip()
    return None


### How to use:
code_content = '''
## put extracted code here
'''
test_cases = [
    '''
    ## put test case here
    '''
]

success, output, error_type = execute_code_with_feedback(code_content, test_cases)
feedback_header = "Execution Successful" if success else "Execution Failed"
feedback_msg = f"<feedback>\n**{feedback_header}**\nOutput:\n{output}\n</feedback>" ## this is the feedback message format needed by the agent
