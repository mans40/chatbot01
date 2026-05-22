import os
import shutil
import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text
import datetime

from app.database.db import get_db, SessionLocal
from app.models import models
from app.schemas import schemas
from app.services.openai_service import openai_service
from app.rag.rag_service import rag_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/chat")
async def chat_endpoint(request: schemas.ChatRequest):
    """Asynchronous streaming chat endpoint using OpenAI and RAG context."""
    session_id = request.session_id
    message = request.message
    user_id = request.user_id

    if not message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    async def event_generator():
        full_response = ""
        try:
            # Stream tokens from OpenAI / RAG Service
            async for chunk in openai_service.generate_response_stream(session_id, message, user_id):
                full_response += chunk
                yield chunk
            
            # Save the full chat interaction to the relational DB for historical records
            db = SessionLocal()
            try:
                db_chat = models.Chat(
                    session_id=session_id,
                    user_id=user_id,
                    message=message,
                    response=full_response
                )
                db.add(db_chat)
                db.commit()
                db.refresh(db_chat)
                # We yield a final delimiter that includes the database record ID for feedback links
                yield f"\n\n[CHAT_ID:{db_chat.id}]"
            except Exception as db_err:
                logger.error(f"Failed to save chat to database: {db_err}")
            finally:
                db.close()

        except Exception as e:
            logger.error(f"Error in chat streaming generator: {e}")
            yield f"\n\n[ERROR: Failed to generate response: {str(e)}]"

    return StreamingResponse(event_generator(), media_type="text/plain")

@router.get("/history", response_model=List[schemas.Chat])
def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    """Fetch all chat message history for a given session."""
    chats = db.query(models.Chat).filter(
        models.Chat.session_id == session_id
    ).order_by(models.Chat.created_at.asc()).all()
    return chats

@router.get("/sessions")
def get_chat_sessions(db: Session = Depends(get_db)):
    """Fetch distinct chat sessions with their titles and activity timestamps."""
    try:
        # Get last message date and first message as title for each unique session_id
        results = db.query(
            models.Chat.session_id,
            func.max(models.Chat.created_at).label("last_activity"),
            func.min(models.Chat.message).label("title")
        ).group_by(
            models.Chat.session_id
        ).order_by(
            desc("last_activity")
        ).all()
        
        sessions = []
        for r in results:
            title = r[2]
            if len(title) > 35:
                title = title[:35] + "..."
            sessions.append({
                "session_id": r[0],
                "last_activity": r[1],
                "title": title
            })
        return sessions
    except Exception as e:
        logger.error(f"Error retrieving sessions: {e}")
        return []

@router.post("/feedback", response_model=schemas.Feedback)
def submit_feedback(feedback: schemas.FeedbackCreate, db: Session = Depends(get_db)):
    """Submit rating and comment feedback for a specific chat message exchange."""
    chat = db.query(models.Chat).filter(models.Chat.id == feedback.chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat message not found")

    db_feedback = models.Feedback(
        chat_id=feedback.chat_id,
        rating=feedback.rating,
        comment=feedback.comment
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload PDF or TXT support documentation to index into vector search."""
    if not file.filename.endswith(('.pdf', '.txt')):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported.")

    temp_dir = "./temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, file.filename)

    try:
        # Save file locally
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        doc_id = f"doc_{int(datetime.datetime.utcnow().timestamp())}"
        
        # Ingest based on file type
        success = False
        if file.filename.endswith('.pdf'):
            success = rag_service.ingest_pdf(temp_file_path, file.filename, doc_id)
        else:
            with open(temp_file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            success = rag_service.ingest_text(content, file.filename, doc_id)

        if not success:
            raise HTTPException(status_code=500, detail="Failed to parse or index document.")

        return {"filename": file.filename, "document_id": doc_id, "status": "Indexed successfully"}

    except Exception as e:
        logger.error(f"Error indexing document {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Indexing error: {str(e)}")
    finally:
        # Clean up temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@router.get("/analytics", response_model=schemas.AnalyticsSummary)
def get_analytics(db: Session = Depends(get_db)):
    """Fetch aggregated support ticket metrics for the admin console."""
    try:
        # 1. Total chats Q&As
        total_chats = db.query(models.Chat).count()

        # 2. Total feedback entries
        feedbacks = db.query(models.Feedback).all()
        feedback_count = len(feedbacks)

        # 3. Average Rating
        avg_rating = 0.0
        satisfaction_rate = 100.0  # Percentage of 4 & 5 stars
        if feedback_count > 0:
            avg_rating = sum([f.rating for f in feedbacks]) / feedback_count
            positive_ratings = sum([1 for f in feedbacks if f.rating >= 4])
            satisfaction_rate = (positive_ratings / feedback_count) * 100

        # 4. Unresolved queries (arbitrarily flagged as ratings of 1 or 2 stars)
        unresolved_queries = db.query(models.Feedback).filter(models.Feedback.rating <= 2).count()

        # 5. Active users (determined by unique session count)
        active_users = db.query(func.count(func.distinct(models.Chat.session_id))).scalar() or 0

        # 6. Chats over time (last 7 days query)
        today = datetime.datetime.utcnow().date()
        chats_over_time = []
        for i in range(6, -1, -1):
            date_check = today - datetime.timedelta(days=i)
            # Filter chats created on this date
            count = db.query(models.Chat).filter(
                func.date(models.Chat.created_at) == date_check
            ).count()
            chats_over_time.append({
                "date": date_check.strftime("%b %d"),
                "count": count
            })

        # 7. Recent feedback comments
        recent_feedbacks_db = db.query(models.Feedback).join(models.Chat).order_by(
            models.Feedback.created_at.desc()
        ).limit(5).all()

        recent_feedback = []
        for f in recent_feedbacks_db:
            recent_feedback.append({
                "id": f.id,
                "rating": f.rating,
                "comment": f.comment,
                "chat_message": f.chat.message[:60] + "..." if len(f.chat.message) > 60 else f.chat.message,
                "created_at": f.created_at.strftime("%Y-%m-%d %H:%M")
            })

        return schemas.AnalyticsSummary(
            total_chats=total_chats,
            avg_rating=round(avg_rating, 2),
            feedback_count=feedback_count,
            satisfaction_rate=round(satisfaction_rate, 1),
            unresolved_queries=unresolved_queries,
            active_users=active_users,
            chats_over_time=chats_over_time,
            recent_feedback=recent_feedback
        )
    except Exception as e:
        logger.error(f"Error calculating analytics: {e}")
        # Return empty data structure on error
        return schemas.AnalyticsSummary(
            total_chats=0,
            avg_rating=0.0,
            feedback_count=0,
            satisfaction_rate=100.0,
            unresolved_queries=0,
            active_users=0,
            chats_over_time=[],
            recent_feedback=[]
        )
