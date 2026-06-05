from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel, field_validator
from collections import defaultdict
from datetime import date
import os
import re
import asyncio
import stripe
from core import get_transcript, generate_content

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_PRICE_ID = os.environ.get("STRIPE_PRICE_ID", "")

LIMITS = {"free": 1}
request_counts: dict = defaultdict(lambda: defaultdict(int))

YOUTUBE_URL_RE = re.compile(
    r'^https?://(www\.)?(youtube\.com/(watch\?|shorts/|embed/)|youtu\.be/)',
    re.IGNORECASE,
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com data:; "
            "img-src 'self' data: blob: https:; "
            "media-src 'self' blob:; "
            "worker-src 'self' blob:; "
            "connect-src 'self' https://js.stripe.com https://fonts.googleapis.com"
        )
        return response


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://tryclipply.com",
        "https://www.tryclipply.com",
        "http://localhost:8000",
        "http://localhost:8001",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.mount("/static", StaticFiles(directory="static"), name="static")

_DIST = "static/dist"
_DIST_EXISTS = os.path.isdir(_DIST)

if _DIST_EXISTS:
    app.mount("/assets", StaticFiles(directory=f"{_DIST}/assets"), name="assets")


def get_ip(req: Request) -> str:
    forwarded = req.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return req.client.host


OWNER_EMAIL = os.environ.get("OWNER_EMAIL", "derinvlad@gmail.com")


def check_pro(email: str) -> bool:
    if email == OWNER_EMAIL:
        return True
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


OWNER_TOKEN = os.environ.get("OWNER_TOKEN", "")


def _spa_response():
    if _DIST_EXISTS:
        return FileResponse(f"{_DIST}/index.html")
    return FileResponse("static/index.html")


@app.get("/favicon.svg")
def favicon():
    path = f"{_DIST}/favicon.svg"
    if os.path.isfile(path):
        return FileResponse(path, media_type="image/svg+xml")
    raise HTTPException(status_code=404)


@app.get("/")
def index():
    return _spa_response()


@app.get("/app")
def app_page():
    return _spa_response()


@app.get("/plans")
def plans_page():
    return _spa_response()


@app.get("/owner-login")
def owner_login(token: str = ""):
    if not OWNER_TOKEN or token != OWNER_TOKEN:
        raise HTTPException(status_code=403, detail="Forbidden")
    return {"email": OWNER_EMAIL, "pro": True}


class RepurposeRequest(BaseModel):
    url: str
    email: str = ""

    @field_validator("url")
    @classmethod
    def validate_youtube_url(cls, v: str) -> str:
        if not YOUTUBE_URL_RE.match(v.strip()):
            raise ValueError("Only YouTube URLs are supported")
        return v.strip()


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
        transcript, title = await asyncio.to_thread(get_transcript, body.url)
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
        success_url="https://tryclipply.com/static/success.html?session_id={CHECKOUT_SESSION_ID}",
        cancel_url="https://tryclipply.com/app",
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
