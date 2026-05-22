from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Chat Schemas ---
class ChatBase(BaseModel):
    session_id: str
    message: str

class ChatCreate(ChatBase):
    user_id: Optional[int] = None
    response: str

class Chat(ChatBase):
    id: int
    user_id: Optional[int]
    response: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Feedback Schemas ---
class FeedbackCreate(BaseModel):
    chat_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class Feedback(FeedbackCreate):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- API Response Schemas ---
class ChatRequest(BaseModel):
    session_id: str
    message: str
    user_id: Optional[int] = None

class FeedbackResponse(BaseModel):
    success: bool
    message: str
    feedback: Feedback

# --- Analytics Schemas ---
class AnalyticsSummary(BaseModel):
    total_chats: int
    avg_rating: float
    feedback_count: int
    satisfaction_rate: float
    unresolved_queries: int
    active_users: int
    chats_over_time: List[dict]
    recent_feedback: List[dict]
