import os
# Force CPU execution and prevent CUDA initialization
os.environ["CUDA_VISIBLE_DEVICES"] = ""
os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"

import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.database.db import engine, Base
from app.api.endpoints import router as api_router

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("aurachat")

# Initialize database schemas dynamically
try:
    logger.info("Initializing database schemas...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database schemas created successfully.")
except Exception as e:
    logger.error(f"Error initializing database tables: {e}")

# Create FastAPI app
app = FastAPI(
    title="AuraChat AI Backend",
    description="Production-grade AI-powered customer support API assistant.",
    version="1.0.0"
)

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "https://chatbot01-green.vercel.app",
    "https://chatbot01-green.vercel.app/",
]
if settings.FRONTEND_URL:
    origins.append(settings.FRONTEND_URL)
    # Normalize trailing slash
    if settings.FRONTEND_URL.endswith("/"):
        origins.append(settings.FRONTEND_URL.rstrip("/"))
    else:
        origins.append(settings.FRONTEND_URL + "/")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Router
app.include_router(api_router, prefix="/api")

@app.get("/")
@app.get("/health")
def health_check():
    """Simple API status health check route."""
    import datetime
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "environment": settings.ENVIRONMENT
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception encountered: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please check system logs."}
    )

if __name__ == "__main__":
    import uvicorn
    # Start local Uvicorn server for direct execution
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
