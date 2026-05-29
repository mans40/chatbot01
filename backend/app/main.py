import os

# SQLite fix for ChromaDB on platforms with older SQLite versions (like some Docker/Render environments)
try:
    __import__('pysqlite3')
    import sys
    sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')
except ImportError:
    pass

# Force CPU execution and prevent CUDA initialization
os.environ["CUDA_VISIBLE_DEVICES"] = ""
os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"

# Limit PyTorch and BLAS CPU threads to conserve memory and prevent container OOM on Render/Docker
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

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
    "https://aurachattt.vercel.app",
    "https://aurachattt.vercel.app/",
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
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app|https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Router
app.include_router(api_router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    logger.info("Pre-initializing RAG and Vector services on startup...")
    try:
        from app.rag.rag_service import rag_service
        from app.services.vector_service import vector_service
        # Pre-initialize embedding function (shared) and persistent clients
        rag_service.ensure_initialized()
        vector_service.ensure_initialized()
        logger.info("RAG and Vector services pre-initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to pre-initialize services during startup: {e}")

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
