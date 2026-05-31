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


@app.get("/")
def index():
    return FileResponse("static/index.html")


@app.get("/app")
def app_page():
    return FileResponse("static/app.html")


class RepurposeRequest(BaseModel):
    url: str


@app.post("/repurpose")
async def repurpose(body: RepurposeRequest, req: Request):
    ip = get_ip(req)
    today = str(date.today())

    # Rate limit for free tier
    if request_counts[ip][today] >= LIMITS["free"]:
        raise HTTPException(status_code=429, detail="Daily free limit reached. Upgrade to Pro.")

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API key not configured")

    try:
        with tempfile.TemporaryDirectory() as tmp_dir:
            audio_path, title = await asyncio.to_thread(download_audio, body.url, tmp_dir)
            transcript = await asyncio.to_thread(transcribe, audio_path)
            content = await asyncio.to_thread(generate_content, transcript, api_key)

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


class EmailRequest(BaseModel):
    email: str


@app.post("/verify-subscription")
def verify_subscription(request: EmailRequest):
    if not stripe.api_key:
        return {"pro": False}
    customers = stripe.Customer.list(email=request.email, limit=1)
    if not customers.data:
        return {"pro": False}
    customer = customers.data[0]
    subscriptions = stripe.Subscription.list(customer=customer.id, status="active", limit=1)
    return {"pro": len(subscriptions.data) > 0}
