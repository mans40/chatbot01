import os
import re
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
from app.services.vector_service import vector_service
import asyncio

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/chat")
async def chat_endpoint(request: schemas.ChatRequest):
    """Smarter asynchronous local RAG chat endpoint with memory, fallback, and query context expansion."""
    session_id = request.session_id
    message = request.message
    user_id = request.user_id

    if not message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    async def event_generator():
        full_response = ""
        try:
            # 1. Store the user's message in memory_service
            from app.memory.memory_service import memory_service
            memory_service.add_message(session_id, "user", message)

            # 2. Retrieve recent message history (limit to last 4 messages to get last 2 turns)
            history = memory_service.get_history(session_id, limit=4)
            
            # 3. Smart Query Context Expansion
            # If the user uses pronouns or short queries, expand the query with terms from previous turns
            search_query = message
            words = message.lower().split()
            pronouns_or_short = {"it", "they", "this", "that", "why", "how", "cancel", "refund", "yes", "no", "them", "he", "she"}
            if len(words) < 5 or any(w in pronouns_or_short for w in words):
                # Retrieve previous exchange if available
                context_terms = []
                for hist_msg in reversed(history[:-1]): # Exclude the user message we just added
                    # Extract some keywords (nouns / verbs / words > 4 chars)
                    cleaned_hist = re.sub(r'[^\w\s]', '', hist_msg["content"])
                    context_terms.extend([w for w in cleaned_hist.split() if len(w) > 4 and w.lower() not in pronouns_or_short])
                if context_terms:
                    # Append unique context terms
                    unique_terms = list(dict.fromkeys(context_terms))[:4]
                    search_query = f"{message} {' '.join(unique_terms)}"
                    logger.info(f"Query expanded: '{message}' -> '{search_query}'")

            # 4. Search over uploaded documents in ChromaDB (RAG store)
            document_matches = []
            rag_results = rag_service.search_similar(search_query, n_results=3)
            # Retrieve ONLY top 2-3 most relevant chunks
            if rag_results:
                for res in rag_results:
                    if res["distance"] < 1.25:
                        document_matches.append(res)

            # 5. Search over FAQ collection
            faq_match = vector_service.search_faqs(search_query, distance_threshold=0.8)

            # 6. Smarter Response Formulation
            if document_matches:
                filename = document_matches[0]["metadata"].get("filename", "uploaded documentation")
                combined_content = " ".join([m["content"] for m in document_matches])
                
                # Simple AI-style summarization generator
                sentences = re.split(r'(?<=[.!?])\s+', combined_content)
                query_words = set(re.findall(r'\w+', search_query.lower()))
                stopwords = {"is", "are", "the", "a", "an", "of", "to", "in", "and", "for", "with", "on", "it", "this", "that", "how", "what", "why", "do"}
                query_words = query_words - stopwords

                scored_sentences = []
                for sentence in sentences:
                    sentence_words = set(re.findall(r'\w+', sentence.lower()))
                    overlap = len(query_words.intersection(sentence_words))
                    scored_sentences.append((overlap, sentence.strip()))
                
                scored_sentences.sort(key=lambda x: x[0], reverse=True)
                
                # Extract top most relevant concise sentences
                top_sentences = [s[1] for s in scored_sentences if s[1] and len(s[1]) > 15][:2]
                
                if not top_sentences and sentences:
                    top_sentences = [sentences[0].strip()]

                if top_sentences:
                    extracted_answer = " ".join(top_sentences)
                    if not extracted_answer.endswith(('.', '!', '?')):
                        extracted_answer += '.'
                else:
                    extracted_answer = combined_content[:200] + "..."
                
                # Make it conversational and concise
                response_text = f"Based on **{filename}**: {extracted_answer}"
                
                # If there's also a highly matching FAQ, we can enrich it as secondary info
                if faq_match and faq_match["distance"] < 0.5:
                    response_text += f"\n\n*Note: Our FAQs also state: \"{faq_match['answer']}\"*"
                    
            elif faq_match:
                response_text = (
                    f"**Answer:** {faq_match['answer']}\n\n"
                    f"*Category: {faq_match['category'].capitalize()} (FAQ Direct Match)*"
                )
            else:
                # 7. Conversational history-aware fallback
                response_text = (
                    "I'm sorry, I couldn't find a specific answer in the uploaded documents or our FAQs. "
                    "You can try uploading the relevant product manual PDF in settings, or check your query phrasing.\n\n"
                    "Alternatively, feel free to contact us at support@aurachat.com."
                )
                # If there's previous context, we can mention it
                if len(history) > 1:
                    prev_topics = [w for w in re.sub(r'[^\w\s]', '', history[-2]["content"]).split() if len(w) > 4]
                    if prev_topics:
                        response_text += f"\n\n*Reflecting on our earlier topic regarding '{' '.join(prev_topics[:2])}', please let me know if you would like me to check anything else.*"

            # Stream response chunk-by-chunk to simulate real-time AI typing
            chunk_size = 12
            for i in range(0, len(response_text), chunk_size):
                chunk = response_text[i:i+chunk_size]
                full_response += chunk
                yield chunk
                await asyncio.sleep(0.01)

            # Store assistant response in memory_service
            memory_service.add_message(session_id, "assistant", full_response)

            # Save the full chat interaction to the SQLite DB for history
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
                yield f"\n\n[CHAT_ID:{db_chat.id}]"
            except Exception as db_err:
                logger.error(f"Failed to save chat to database: {db_err}")
            finally:
                db.close()

        except Exception as e:
            logger.error(f"Error in smart chat generator: {e}", exc_info=True)
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

@router.delete("/sessions/{session_id}")
def delete_chat_session(session_id: str, db: Session = Depends(get_db)):
    """Delete a chat session and all its messages."""
    try:
        db.query(models.Chat).filter(models.Chat.session_id == session_id).delete()
        db.commit()
        return {"status": "success", "message": "Session deleted"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting session: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete session")

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload PDF or TXT support documentation to index into vector search."""
    # 1. Enforce PDF and TXT only
    if not (file.filename.lower().endswith('.pdf') or file.filename.lower().endswith('.txt')):
        raise HTTPException(status_code=400, detail="Only PDF and TXT documents are supported for RAG ingestion.")

    # 2. Enforce upload size limits (e.g. 10MB)
    MAX_SIZE = 10 * 1024 * 1024 # 10MB in bytes
    
    # Read a chunk to verify size quickly
    contents = await file.read(MAX_SIZE + 1)
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the 10MB limit.")
    
    # Reset file cursor for further reading
    await file.seek(0)

    # Save to temp directory first
    temp_dir = "./temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, file.filename)

    try:
        # Save file locally
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        doc_id = f"doc_{int(datetime.datetime.utcnow().timestamp())}"
        
        # 3. Call document_service
        from app.services.document_service import document_service
        result = document_service.ingest_document(temp_file_path, file.filename, doc_id)
        
        return result

    except Exception as e:
        logger.error(f"Error indexing document {file.filename}: {e}")
        raise HTTPException(status_code=550, detail=f"Indexing error: {str(e)}")
    finally:
        # Clean up temp file
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception:
                pass

@router.get("/documents")
def get_documents():
    """Fetch list of all ingested PDF and TXT files."""
    try:
        from app.services.document_service import document_service
        return document_service.get_ingested_documents()
    except Exception as e:
        logger.error(f"Error fetching documents list: {e}")
        return []

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

        # 8. Uploaded documents count using document_service
        from app.services.document_service import document_service
        uploaded_documents = len(document_service.get_ingested_documents())

        # 9. Failed queries vs Successful responses
        fallback_chats = db.query(models.Chat).filter(
            models.Chat.response.like("%sorry%") | 
            models.Chat.response.like("%couldn't find%") |
            models.Chat.response.like("%fallback%")
        ).count()
        failed_queries = max(unresolved_queries, fallback_chats)
        successful_responses = max(0, total_chats - failed_queries)

        return schemas.AnalyticsSummary(
            total_chats=total_chats,
            avg_rating=round(avg_rating, 2),
            feedback_count=feedback_count,
            satisfaction_rate=round(satisfaction_rate, 1),
            unresolved_queries=unresolved_queries,
            active_users=active_users,
            chats_over_time=chats_over_time,
            recent_feedback=recent_feedback,
            uploaded_documents=uploaded_documents,
            successful_responses=successful_responses,
            failed_queries=failed_queries
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
            recent_feedback=[],
            uploaded_documents=0,
            successful_responses=0,
            failed_queries=0
        )

