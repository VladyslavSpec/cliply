from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from collections import defaultdict
from datetime import date
import os
import asyncio
import stripe
from core import download_audio, transcribe, generate_content
import tempfile

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_PRICE_ID = os.environ.get("STRIPE_PRICE_ID", "")

LIMITS = {"free": 1}
request_counts: dict = defaultdict(lambda: defaultdict(int))

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")


def get_ip(req: Request) -> str:
    forwarded = req.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return req.client.host


def check_pro(email: str) -> bool:
    if not email or not stripe.api_key:
        return False
    try:
        customers = stripe.Customer.list(email=email, limit=1)
        if not customers.data:
            return False
        subs = stripe.Subscription.list(
            customer=customers.data[0].id, status="active", limit=1
        )
        return len(subs.data) > 0
    except Exception:
        return False


@app.get("/")
def index():
    return FileResponse("static/index.html")


@app.get("/app")
def app_page():
    return FileResponse("static/app.html")


class RepurposeRequest(BaseModel):
    url: str
    email: str = ""


@app.post("/repurpose")
async def repurpose(body: RepurposeRequest, req: Request):
    ip = get_ip(req)
    today = str(date.today())

    is_pro = check_pro(body.email)

    if not is_pro and request_counts[ip][today] >= LIMITS["free"]:
        raise HTTPException(
            status_code=429,
            detail="Daily free limit reached. Upgrade to Pro for unlimited repurposes."
        )

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API key not configured")

    try:
        with tempfile.TemporaryDirectory() as tmp_dir:
            audio_path, title = await asyncio.to_thread(download_audio, body.url, tmp_dir)
            transcript = await asyncio.to_thread(transcribe, audio_path)
            content = await asyncio.to_thread(generate_content, transcript, api_key)

        if not is_pro:
            request_counts[ip][today] += 1

        return {"title": title, "transcript": transcript, "content": content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/create-checkout-session")
async def create_checkout_session(req: Request):
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    base_url = str(req.base_url).rstrip("/")
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{"price": STRIPE_PRICE_ID, "quantity": 1}],
        mode="subscription",
        success_url=f"{base_url}/static/success.html?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{base_url}/app",
    )
    return {"url": session.url}


@app.get("/session-details/{session_id}")
def session_details(session_id: str):
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        email = session.customer_details.email if session.customer_details else ""
        return {"email": email}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


class EmailRequest(BaseModel):
    email: str


@app.post("/verify-subscription")
def verify_subscription(request: EmailRequest):
    return {"pro": check_pro(request.email)}
