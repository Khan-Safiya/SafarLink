import os
import json
import requests
from fastapi import APIRouter, Request
from fastapi.responses import PlainTextResponse

from agents.route import run_route_agent, RouteAgentOutput

router = APIRouter(tags=["whatsapp"])

WHATSAPP_TOKEN     = os.getenv("WHATSAPP_TOKEN")
PHONE_NUMBER_ID    = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
VERIFY_TOKEN       = os.getenv("WHATSAPP_VERIFY_TOKEN", "route_bot_verify")
API_URL            = f"https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages"

HELP_TEXT = (
    "👋 *Route Navigator Bot*\n\n"
    "Send any travel query and I'll find routes across all transit modes.\n\n"
    "*Examples:*\n"
    "  • Mumbai to Pune by bus\n"
    "  • Directions from Delhi to Agra\n"
    "  • How do I get from Bangalore to Chennai by train?\n\n"
    "Type *help* to see this message again."
)


def _send_message(to: str, text: str) -> None:
    requests.post(
        API_URL,
        headers={"Authorization": f"Bearer {WHATSAPP_TOKEN}", "Content-Type": "application/json"},
        json={
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": text[:4096]},
        },
        timeout=10,
    )


# Public alias so main.py can import this for ticket delivery
def send_whatsapp_message(to: str, text: str) -> None:
    """Send a WhatsApp message. No-ops gracefully if token is not configured."""
    if not WHATSAPP_TOKEN or not PHONE_NUMBER_ID:
        return
    _send_message(to, text)


def _format_routes(output: RouteAgentOutput) -> str:
    lines = [f"📍 *{output.origin}* → *{output.destination}*\n"]
    for group in output.transit_options:
        if not group.available or not group.routes:
            lines.append(f"❌ *{group.mode}*: No service available\n")
            continue
        route = group.routes[0]
        lines.append(f"*{group.mode}* — {route.total_distance} · {route.total_duration}")
        for step in route.steps[:5]:
            icon = "🚶" if step.travel_mode == "WALKING" else "🚌"
            lines.append(f"  {icon} {step.step_number}. {step.instruction[:70]}")
            if step.transit_info:
                ti = step.transit_info
                lines.append(f"     _{ti.line_name}_: {ti.departure_stop} → {ti.arrival_stop} ({ti.num_stops} stops)")
        if len(route.steps) > 5:
            lines.append(f"  (...{len(route.steps) - 5} more steps)")
        lines.append("")
    return "\n".join(lines)


@router.get("/whatsapp", response_class=PlainTextResponse)
async def whatsapp_verify(request: Request):
    params = request.query_params
    if params.get("hub.verify_token") == VERIFY_TOKEN and params.get("hub.mode") == "subscribe":
        return PlainTextResponse(params.get("hub.challenge", ""))
    return PlainTextResponse("Forbidden", status_code=403)


@router.post("/whatsapp")
async def whatsapp_webhook(request: Request):
    body = await request.json()
    try:
        entry    = body["entry"][0]
        change   = entry["changes"][0]["value"]
        messages = change.get("messages")
        if not messages:
            return {"status": "no_message"}
        msg  = messages[0]
        from_ = msg["from"]
        text  = msg.get("text", {}).get("body", "").strip()
        if not text:
            return {"status": "non_text"}
        if text.lower() in ("hi", "hello", "help", "start", "/start"):
            _send_message(from_, HELP_TEXT)
            return {"status": "help_sent"}
        _send_message(from_, "🔄 Finding routes for you, please wait a moment...")
        output    = run_route_agent(text)
        formatted = _format_routes(output)
        _send_message(from_, formatted)
    except Exception as e:
        _send_message(from_, f"❌ Error: {e}")
    return {"status": "ok"}
