import os

# Manual simple .env loader to eliminate python-dotenv dependency
def load_dotenv(dotenv_path: str):
    if os.path.exists(dotenv_path):
        with open(dotenv_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    if "=" in line:
                        key, val = line.split("=", 1)
                        # Remove quotes if present
                        val = val.strip().strip("'").strip('"')
                        os.environ.setdefault(key.strip(), val)

# Load environmental variables from .env file at the root level if present
root_dotenv = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
load_dotenv(root_dotenv)

class Settings:
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./aurachat.db")
    
    # Redis Session Memory
    REDIS_URL: str = os.getenv("REDIS_URL", "")
    
    # Vector DB
    CHROMA_SERVER_HOST: str = os.getenv("CHROMA_SERVER_HOST", "")
    CHROMA_SERVER_PORT: int = int(os.getenv("CHROMA_SERVER_PORT", "8000"))
    CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
    
    # CORS Configuration
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "")

settings = Settings()
