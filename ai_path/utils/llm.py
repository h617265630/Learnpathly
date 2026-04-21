"""
LLM provider factory.
Default: MiniMax. Supports OpenAI via LLM_PROVIDER=openai.
"""

from __future__ import annotations
import json
import os
import re
from langchain_openai import ChatOpenAI


def get_llm(temperature: float = 0.3) -> ChatOpenAI:
    provider = os.getenv("LLM_PROVIDER", "minimax").lower()

    if provider == "openai":
        return ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o"),
            api_key=os.environ["OPENAI_API_KEY"],
            temperature=temperature,
        )

    # Default: MiniMax
    # Docs: https://platform.minimaxi.com/document/ChatCompletion%20v1
    return ChatOpenAI(
        model=os.getenv("MINIMAX_MODEL", "abab6.5s-chat"),
        api_key=os.environ["MINIMAX_API_KEY"],
        base_url="https://api.minimaxi.com/v1",
        temperature=temperature,
    )


def parse_json_response(content: str) -> dict | list:
    """
    Parse JSON from LLM response content.
    Handles markdown code blocks and extracts JSON.
    """
    # Remove markdown code blocks
    content = re.sub(r"```(?:json)?\s*", "", content.strip())
    content = re.sub(r"\s*```", "", content.strip())

    # Try direct json.loads
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    # Try to extract JSON object from content
    json_match = re.search(r"\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}", content, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass

    # Try to extract JSON array
    array_match = re.search(r"\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\]", content, re.DOTALL)
    if array_match:
        try:
            return json.loads(array_match.group())
        except json.JSONDecodeError:
            pass

    # Return empty dict as fallback
    return {}
