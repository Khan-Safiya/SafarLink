import os
from typing import Any
from dotenv import load_dotenv
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent

from agents.tools import ALL_TOOLS
from agents.route import run_route_agent
from agents.fare import run_fare_agent

load_dotenv()

_llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=os.getenv("GROQ_API_KEY"), temperature=0)


class _Intent(BaseModel):
    intent: str


_intent_classifier = _llm.with_structured_output(_Intent)

_GENERAL_PROMPT = """You are Maps Buddy — a Google Maps AI assistant for places, geocoding, elevation, and timezone queries.
Use the available tools to answer accurately. Be concise. For route or fare queries, you will not be called."""

_general_agent = create_react_agent(model=_llm, tools=ALL_TOOLS, prompt=_GENERAL_PROMPT)


def run_buddy(query: str) -> dict[str, Any]:
    intent_result = _intent_classifier.invoke(
        f"Classify this maps query into exactly one word: 'route' (directions/navigation/how to get/trip), "
        f"'fare' (cheapest/cost/price comparison), or 'general' (places/nearby/geocode/elevation/timezone/other). "
        f"Query: {query}"
    )
    intent = intent_result.intent.strip().lower()

    if "route" in intent:
        data = run_route_agent(query)
        return {"type": "route", "data": data.model_dump()}

    if "fare" in intent:
        data = run_fare_agent(query)
        return {"type": "fare", "data": data.model_dump()}

    result = _general_agent.invoke({"messages": [{"role": "user", "content": query}]})
    return {"type": "general", "answer": result["messages"][-1].content}
