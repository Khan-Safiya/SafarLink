import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.route import run_route_agent, RouteAgentOutput
from agents.fare import run_fare_agent, FareComparisonOutput
from agents.buddy import run_buddy
from agents.app_assistant import run_app_assistant
from agents.booking_agent import run_booking_agent, BookingRequest, format_whatsapp_ticket
from agents.weather import get_pune_weather
from exports.template import generate_pdf
from bot import router as whatsapp_router, send_whatsapp_message

app = FastAPI(title="Maps Buddy API")

app.include_router(whatsapp_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR   = os.path.dirname(__file__)
EXPORT_DIR = os.path.join(BASE_DIR, "exports", "output")
os.makedirs(EXPORT_DIR, exist_ok=True)


class RouteQuery(BaseModel):
    query: str


@app.get("/config")
async def config():
    return {"maps_key": os.getenv("GOOGLE_MAPS_API_KEY", "")}


@app.post("/route", response_model=RouteAgentOutput)
async def query_route(body: RouteQuery):
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="Query must not be empty.")
    return run_route_agent(body.query)


@app.post("/route/export")
async def export_route_pdf(body: RouteQuery):
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="Query must not be empty.")
    route_output = run_route_agent(body.query)
    filename = "_".join(body.query.lower().split())[:60] + ".pdf"
    filepath = os.path.join(EXPORT_DIR, filename)
    generate_pdf(route_output, filepath)
    return FileResponse(filepath, media_type="application/pdf", filename=filename)


@app.post("/fare", response_model=FareComparisonOutput)
async def compare_fares(body: RouteQuery):
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="Query must not be empty.")
    return run_fare_agent(body.query)


@app.post("/buddy")
async def maps_buddy(body: RouteQuery):
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="Query must not be empty.")
    return run_buddy(body.query)


@app.post("/agent")
async def full_analysis(body: RouteQuery):
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="Query must not be empty.")
    import asyncio
    loop = asyncio.get_event_loop()
    route_task = loop.run_in_executor(None, run_route_agent, body.query)
    fare_task  = loop.run_in_executor(None, run_fare_agent,  body.query)
    buddy_task = loop.run_in_executor(None, run_buddy,       body.query)
    route_result, fare_result, buddy_result = await asyncio.gather(route_task, fare_task, buddy_task)
    return {
        "query":  body.query,
        "routes": route_result.model_dump(),
        "fares":  fare_result.model_dump(),
        "buddy":  buddy_result,
    }


@app.post("/app-assistant")
async def app_assistant(body: RouteQuery):
    """Answer SafarLink app or travel questions. Politely refuses off-topic queries."""
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="Query must not be empty.")
    return run_app_assistant(body.query)


@app.post("/book")
async def book_journey(body: BookingRequest):
    """
    Mock-book a multi-modal transit journey.
    Returns a confirmed e-ticket with PNR and payment details.
    If the passenger's phone number is provided, the ticket is also sent via WhatsApp.
    """
    result = run_booking_agent(body)
    # Send WhatsApp ticket if phone number is available
    if body.phone:
        ticket_text = format_whatsapp_ticket(result)
        try:
            send_whatsapp_message(body.phone, ticket_text)
        except Exception:
            pass  # WhatsApp delivery is best-effort
    return result


@app.get("/weather")
async def current_weather():
    """Get current Pune weather data for monsoon-adaptive routing."""
    return get_pune_weather()


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/", response_class=HTMLResponse)
async def index():
    with open(os.path.join(BASE_DIR, "frontend", "index.html"), encoding="utf-8") as f:
        return f.read()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)