"""Quick test gen_path LLM speed."""
import time
import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(_PROJECT_ROOT / "gen_path"))

from dotenv import load_dotenv
load_dotenv(_PROJECT_ROOT / "gen_path" / ".env")

import os
print(f"LLM_PROVIDER: {os.getenv('LLM_PROVIDER')}")
print(f"MINIMAX_MODEL: {os.getenv('MINIMAX_MODEL')}")

from gen_path.utils.llm import get_llm

llm = get_llm(temperature=0.3)
print(f"LLM model: {llm.model_name}")

print("\nTesting LLM invoke...")
start = time.time()
response = llm.invoke("Return JSON with one key 'test' set to 'hello'")
elapsed = time.time() - start

print(f"Response time: {elapsed:.2f}s")
print(f"Response: {response.content[:200]}")