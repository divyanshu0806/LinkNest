from dotenv import load_dotenv
import os
import cloudinary
import cloudinary.uploader
import secrets
from datetime import datetime, timedelta
from typing import List, Optional, Dict
import requests

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

from fastapi import FastAPI, HTTPException, Body, Request, UploadFile, File
from database import (
    users_collection, 
    hubs_collection, 
    account_settings_collection,
    analytics_collection
)
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from pydantic import BaseModel
from bson import ObjectId

app = FastAPI(title="SmartLinkX API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password Hashing
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str):
    return pwd_context.verify(plain, hashed)

# ==========================================
# REQUEST MODELS
# ==========================================

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class RuleItem(BaseModel):
    rule_id: str
    type: str
    days: Optional[List[str]] = []
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    timezone: Optional[str] = "visitor"
    devices: Optional[List[str]] = []

class LinkItem(BaseModel):
    title: str
    url: str
    rules: Optional[List[RuleItem]] = []

class HubCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    slug: str
    accentColor: str
    background: str
    theme: Optional[str] = "custom"
    font: str
    textColor: str
    links: List[LinkItem] = []

class HubCreateRequest(HubCreate):
    user_email: str

# ==========================================
# HELPER FUNCTIONS
# ==========================================

def get_country_from_ip(ip: str) -> str:
    """Get country from IP address using ipapi"""
    try:
        if ip == "127.0.0.1" or ip.startswith("192.168"):
            return "Local"
        
        r = requests.get(f"https://ipapi.co/{ip}/json/", timeout=2)
        if r.status_code == 200:
            data = r.json()
            return data.get("country_name", "Unknown")
        return "Unknown"
    except:
        return "Unknown"

def get_browser_from_ua(user_agent: str) -> str:
    """Extract browser from user agent"""
    ua_lower = user_agent.lower()
    if "edg" in ua_lower:
        return "Edge"
    elif "chrome" in ua_lower:
        return "Chrome"
    elif "safari" in ua_lower and "chrome" not in ua_lower:
        return "Safari"
    elif "firefox" in ua_lower:
        return "Firefox"
    elif "opera" in ua_lower or "opr" in ua_lower:
        return "Opera"
    return "Other"

def get_os_from_ua(user_agent: str) -> str:
    """Extract OS from user agent"""
    ua_lower = user_agent.lower()
    if "windows" in ua_lower:
        return "Windows"
    elif "mac" in ua_lower:
        return "macOS"
    elif "linux" in ua_lower:
        return "Linux"
    elif "android" in ua_lower:
        return "Android"
    elif "iphone" in ua_lower or "ipad" in ua_lower:
        return "iOS"
    return "Other"

# ==========================================
# BASIC ROUTES
# ==========================================

@app.get("/")
def root():
    return {"msg": "SmartLinkX backend is running 🚀"}

@app.get("/api/health")
def health():
    return {"status": "ok", "msg": "Backend connected!"}

# ==========================================
# AUTH ROUTES
# ==========================================

@app.post("/api/signup")
def signup(user: SignupRequest):
    existing_user = users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    users_collection.insert_one({
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "created_at": datetime.utcnow()
    })

    return {"msg": "User created successfully"}

@app.post("/api/login")
def login(user: LoginRequest):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="User not found")

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid password")

    return {
        "msg": "Login successful",
        "name": db_user["name"],
        "email": db_user["email"]
    }

# ==========================================
# HUB ROUTES
# ==========================================

@app.post("/api/hubs")
def create_hub(hub: HubCreateRequest):
    user = users_collection.find_one({"email": hub.user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = hubs_collection.find_one({"slug": hub.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")

    hub_doc = {
        "title": hub.title,
        "description": hub.description,
        "slug": hub.slug,
        "accentColor": hub.accentColor,
        "background": hub.background,
        "theme": hub.theme,
        "font": hub.font,
        "textColor": hub.textColor,
        "links": [link.dict() for link in hub.links],
        "user_email": hub.user_email,
        "created_at": datetime.utcnow()
    }

    result = hubs_collection.insert_one(hub_doc)

    return {
        "msg": "Hub created successfully",
        "hub_id": str(result.inserted_id),
        "slug": hub.slug
    }

@app.get("/api/hubs/{user_email}")
def get_user_hubs(user_email: str):
    hubs = list(hubs_collection.find({"user_email": user_email}, {"_id": 0}))
    return {"hubs": hubs}

@app.get("/api/hub/{slug}")
def get_hub_by_slug(slug: str):
    hub = hubs_collection.find_one({"slug": slug}, {"_id": 0})
    if not hub:
        raise HTTPException(status_code=404, detail="Hub not found")
    return hub

@app.put("/api/hubs/update-rules")
def update_hub_rules(data: dict = Body(...)):
    slug = data.get("slug")
    links = data.get("links")

    if not slug or not links:
        raise HTTPException(status_code=400, detail="Missing slug or links")

    hubs_collection.update_one(
        {"slug": slug},
        {"$set": {"links": links}}
    )

    return {"msg": "Rules updated"}

@app.get("/api/my-stats")
def my_stats(email: str):
    hubs = list(hubs_collection.find({"user_email": email}))
    total_hubs = len(hubs)
    total_links = sum(len(hub.get("links", [])) for hub in hubs)

    return {
        "total_hubs": total_hubs,
        "total_links": total_links
    }

# ==========================================
# ANALYTICS TRACKING ROUTES
# ==========================================

@app.post("/api/track/view")
async def track_view(payload: dict, request: Request):
    """Track page view with detailed visitor information"""
    ip = request.client.host
    country = get_country_from_ip(ip)
    
    user_agent = payload.get("user_agent", "")
    browser = get_browser_from_ua(user_agent)
    os = get_os_from_ua(user_agent)

    doc = {
        "type": "view",
        "hub_slug": payload["hub_slug"],
        "timestamp": datetime.utcnow(),
        "device": payload.get("device", "unknown"),
        "country": country,
        "ip": ip,
        "user_agent": user_agent,
        "browser": browser,
        "os": os,
        "referrer": payload.get("referrer", "direct"),
        "screen_width": payload.get("screen_width"),
        "screen_height": payload.get("screen_height")
    }

    analytics_collection.insert_one(doc)
    return {"msg": "view tracked"}

@app.post("/api/track/click")
async def track_click(payload: dict, request: Request):
    """Track link click with detailed information"""
    ip = request.client.host
    country = get_country_from_ip(ip)
    
    user_agent = payload.get("user_agent", "")
    browser = get_browser_from_ua(user_agent)
    os = get_os_from_ua(user_agent)

    doc = {
        "type": "click",
        "hub_slug": payload["hub_slug"],
        "link_title": payload.get("link_title", ""),
        "link_url": payload.get("link_url", ""),
        "timestamp": datetime.utcnow(),
        "device": payload.get("device", "unknown"),
        "country": country,
        "ip": ip,
        "user_agent": user_agent,
        "browser": browser,
        "os": os,
        "referrer": payload.get("referrer", "direct")
    }

    analytics_collection.insert_one(doc)
    return {"msg": "click tracked"}

# ==========================================
# ANALYTICS RETRIEVAL ROUTES
# ==========================================

@app.get("/api/analytics/{slug}")
def get_analytics(slug: str, days: int = 7):
    """Get comprehensive analytics for a hub"""
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Fetch all records for this hub in date range
    records = list(analytics_collection.find({
        "hub_slug": slug,
        "timestamp": {"$gte": start_date, "$lte": end_date}
    }))

    # Basic metrics
    total_views = sum(1 for r in records if r["type"] == "view")
    total_clicks = sum(1 for r in records if r["type"] == "click")
    ctr = (total_clicks / total_views * 100) if total_views > 0 else 0

    # Device breakdown
    devices = {"mobile": 0, "desktop": 0, "tablet": 0}
    for r in records:
        device = r.get("device", "unknown")
        if device in devices:
            devices[device] += 1

    # Country breakdown
    countries = {}
    for r in records:
        country = r.get("country", "Unknown")
        countries[country] = countries.get(country, 0) + 1

    # Browser breakdown
    browsers = {}
    for r in records:
        browser = r.get("browser", "Other")
        browsers[browser] = browsers.get(browser, 0) + 1

    # OS breakdown
    operating_systems = {}
    for r in records:
        os = r.get("os", "Other")
        operating_systems[os] = operating_systems.get(os, 0) + 1

    # Referrer breakdown
    referrers = {}
    for r in records:
        ref = r.get("referrer", "direct")
        referrers[ref] = referrers.get(ref, 0) + 1

    # Link performance
    link_stats = {}
    for r in records:
        if r["type"] == "click":
            title = r.get("link_title", "Unknown")
            if title not in link_stats:
                link_stats[title] = {"clicks": 0, "url": r.get("link_url", "")}
            link_stats[title]["clicks"] += 1

    # Sort links by clicks
    top_links = sorted(
        [{"title": k, "clicks": v["clicks"], "url": v["url"]} 
         for k, v in link_stats.items()],
        key=lambda x: x["clicks"],
        reverse=True
    )[:10]

    # Traffic over time (daily)
    traffic_by_day = {}
    for r in records:
        day = r["timestamp"].strftime("%Y-%m-%d")
        if day not in traffic_by_day:
            traffic_by_day[day] = {"views": 0, "clicks": 0}
        
        if r["type"] == "view":
            traffic_by_day[day]["views"] += 1
        elif r["type"] == "click":
            traffic_by_day[day]["clicks"] += 1

    # Peak hours analysis
    hours_activity = {str(h): 0 for h in range(24)}
    for r in records:
        hour = str(r["timestamp"].hour)
        hours_activity[hour] += 1

    # Recent activity
    recent_records = sorted(records, key=lambda x: x["timestamp"], reverse=True)[:20]
    recent_activity = []
    for r in recent_records:
        recent_activity.append({
            "type": r["type"],
            "timestamp": r["timestamp"].isoformat(),
            "device": r.get("device", "unknown"),
            "country": r.get("country", "Unknown"),
            "link_title": r.get("link_title", ""),
            "browser": r.get("browser", "Other")
        })

    return {
        "total_views": total_views,
        "total_clicks": total_clicks,
        "ctr": round(ctr, 2),
        "devices": devices,
        "countries": countries,
        "browsers": browsers,
        "operating_systems": operating_systems,
        "referrers": referrers,
        "top_links": top_links,
        "traffic_by_day": traffic_by_day,
        "hours_activity": hours_activity,
        "recent_activity": recent_activity
    }

# ==========================================
# ACCOUNT SETTINGS
# ==========================================

@app.get("/api/account-settings/{email}")
def get_account_settings(email: str):
    settings = account_settings_collection.find_one({"user_email": email}, {"_id": 0})

    if not settings:
        settings = {
            "user_email": email,
            "profile": {"name": "", "bio": "", "email": email},
            "preferences": {
                "timezone": "Asia/Kolkata (IST)",
                "date_format": "DD/MM/YYYY",
                "language": "English"
            },
            "notifications": {
                "weekly_report": True,
                "traffic_alert": True,
                "country_alert": False
            },
            "api": {"api_key": "sk_live_" + secrets.token_hex(16)},
            "created_at": datetime.utcnow()
        }
        account_settings_collection.insert_one(settings)

    return settings

@app.put("/api/account-settings/{email}")
def update_account_settings(email: str, data: dict):
    new_email = data.get("profile", {}).get("email", email)
    data["user_email"] = new_email
    data["updated_at"] = datetime.utcnow()

    account_settings_collection.update_one(
        {"user_email": email},
        {"$set": data, "$setOnInsert": {"created_at": datetime.utcnow()}},
        upsert=True
    )

    if new_email != email:
        users_collection.update_one(
            {"email": email},
            {"$set": {"email": new_email}}
        )
        hubs_collection.update_many(
            {"user_email": email},
            {"$set": {"user_email": new_email}}
        )

    return {"msg": "Account settings saved", "email": new_email}

@app.post("/api/account-settings/{email}/api-key")
def regenerate_api_key(email: str):
    new_key = "sk_live_" + secrets.token_hex(16)
    account_settings_collection.update_one(
        {"user_email": email},
        {"$set": {"api.api_key": new_key}}
    )
    return {"api_key": new_key}

@app.delete("/api/account-settings/{email}")
def delete_account(email: str):
    users_collection.delete_one({"email": email})
    account_settings_collection.delete_one({"user_email": email})
    hubs_collection.delete_many({"user_email": email})
    return {"msg": "Account deleted"}

@app.post("/api/account-settings/{email}/avatar")
async def upload_avatar(email: str, file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only images allowed")

    result = cloudinary.uploader.upload(
        file.file,
        folder="smartlinkx/avatars",
        public_id=email.replace("@", "_"),
        overwrite=True
    )

    avatar_url = result["secure_url"]

    account_settings_collection.update_one(
        {"user_email": email},
        {"$set": {"profile.avatar": avatar_url}},
        upsert=True
    )

    return {"msg": "Profile picture updated", "avatar": avatar_url}