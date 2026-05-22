import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environmental variables from .env file at the root level if present
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str = "sqlite:///./aurachat.db"
    
    # Redis Session Memory
    REDIS_URL: str = ""
    
    # Vector DB
    CHROMA_SERVER_HOST: str = ""
    CHROMA_SERVER_PORT: int = 8000
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    
    # AI Credentials
    OPENAI_API_KEY: str = ""

    class Config:
        case_sensitive = True

settings = Settings()
