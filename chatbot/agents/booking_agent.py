"""
SafarLink Booking Agent
────────────────────────
Handles mock ticket booking and payment processing for public transport.
Generates a structured e-ticket with PNR, segments, and payment confirmation.
"""

import uuid
import random
import string
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


# ── Models ───────────────────────────────────────────────────────────────────────

class BookingSegment(BaseModel):
    mode: str                       # Bus, Metro / Subway, Train, Tram
    line_name: str                  # PMPML Route 152, Purple Line, etc.
    from_stop: str
    to_stop: str
    num_stops: int
    fare_inr: float


class BookingRequest(BaseModel):
    origin: str
    destination: str
    route_type: str                 # fastest | cheapest | safest
    transit_segments: list[BookingSegment]
    passenger_name: str = "SafarLink User"
    phone: Optional[str] = None
    estimated_fare_inr: float = 0.0


class BookingResult(BaseModel):
    ticket_id: str
    pnr: str
    booking_time: str
    passenger_name: str
    phone: Optional[str]
    origin: str
    destination: str
    route_type: str
    segments: list[BookingSegment]
    total_fare_inr: float
    payment_id: str
    payment_status: str             # SUCCESS
    status: str                     # CONFIRMED
    qr_data: Optional[str] = None   # QR code URL — set for metro tickets


# ── Helpers ──────────────────────────────────────────────────────────────────────

def _gen_pnr(length: int = 6) -> str:
    """Generate a random PNR like 'XK7F2Q'."""
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


def _now_ist() -> str:
    """Current time formatted for IST display."""
    now = datetime.now(timezone.utc)
    return now.strftime("%d %b %Y, %I:%M %p UTC")


# Mode-specific fare rules (INR per segment, approximate)
_FARE_RULES: dict[str, float] = {
    "bus": 15.0,
    "metro / subway": 30.0,
    "metro": 30.0,
    "subway": 30.0,
    "train": 25.0,
    "tram": 10.0,
    "driving": 0.0,   # personal vehicle — no ticket
    "walking": 0.0,
}


def _segment_fare(mode: str, provided: float) -> float:
    """Return provided fare, or estimate from mode if zero."""
    if provided > 0:
        return provided
    return _FARE_RULES.get(mode.lower(), 20.0)


# ── Main booking function ────────────────────────────────────────────────────────

def run_booking_agent(request: BookingRequest) -> BookingResult:
    """
    Mock-book a multi-modal transit journey.
    - Assigns fare to each segment if not provided.
    - Simulates a payment transaction.
    - Returns a confirmed e-ticket.
    """
    # Assign fares per segment
    enriched_segments: list[BookingSegment] = []
    for seg in request.transit_segments:
        fare = _segment_fare(seg.mode, seg.fare_inr)
        enriched_segments.append(
            BookingSegment(
                mode=seg.mode,
                line_name=seg.line_name,
                from_stop=seg.from_stop,
                to_stop=seg.to_stop,
                num_stops=seg.num_stops,
                fare_inr=fare,
            )
        )

    # Total fare
    total = request.estimated_fare_inr if request.estimated_fare_inr > 0 else sum(
        s.fare_inr for s in enriched_segments
    )
    if total == 0:
        total = 25.0  # fallback minimum

    # Generate QR URL for metro tickets
    metro_modes = {"metro", "metro / subway", "subway"}
    has_metro = any(s.mode.lower() in metro_modes for s in enriched_segments)

    pnr = _gen_pnr()
    qr_data = None
    if has_metro:
        qr_payload = f"SAFARLINK%7CPNR%3A{pnr}%7C{request.origin}%7C{request.destination}"
        qr_data = f"https://api.qrserver.com/v1/create-qr-code/?data={qr_payload}&size=140x140&margin=6&color=07503E"

    return BookingResult(
        ticket_id=str(uuid.uuid4()),
        pnr=pnr,
        booking_time=_now_ist(),
        passenger_name=request.passenger_name,
        phone=request.phone,
        origin=request.origin,
        destination=request.destination,
        route_type=request.route_type,
        segments=enriched_segments,
        total_fare_inr=round(total, 2),
        payment_id="PAY-" + str(uuid.uuid4())[:8].upper(),
        payment_status="SUCCESS",
        status="CONFIRMED",
        qr_data=qr_data,
    )


# ── WhatsApp ticket formatter ─────────────────────────────────────────────────────

def format_whatsapp_ticket(result: BookingResult) -> str:
    """Format a BookingResult as a WhatsApp-friendly text message."""
    mode_icons = {
        "bus": "🚌", "metro / subway": "🚇", "metro": "🚇",
        "train": "🚂", "tram": "🚃", "walking": "🚶", "driving": "🚗",
    }

    lines = [
        "✅ *Booking Confirmed — SafarLink*",
        "",
        f"🎟️ *PNR:* `{result.pnr}`",
        f"📋 *Ticket ID:* {result.ticket_id[:12]}...",
        f"👤 *Passenger:* {result.passenger_name}",
        f"🕐 *Booked:* {result.booking_time}",
        "",
        f"📍 *From:* {result.origin}",
        f"📍 *To:* {result.destination}",
        f"🏷️ *Route Type:* {result.route_type.capitalize()}",
        "",
        "─────────────────",
        "*Journey Segments:*",
    ]

    for i, seg in enumerate(result.segments, 1):
        icon = mode_icons.get(seg.mode.lower(), "🚦")
        lines.append(
            f"{i}. {icon} *{seg.mode}* — {seg.line_name}\n"
            f"   {seg.from_stop} → {seg.to_stop} ({seg.num_stops} stops)\n"
            f"   Fare: ₹{seg.fare_inr:.0f}"
        )

    lines += [
        "",
        "─────────────────",
        f"💳 *Total Paid:* ₹{result.total_fare_inr:.0f}",
        f"🔖 *Payment ID:* {result.payment_id}",
        f"✅ *Payment:* {result.payment_status}",
        "",
        "Have a safe journey! 🙏",
        "_SafarLink — Smart Urban Mobility_",
    ]
    return "\n".join(lines)
