import json
import logging
import threading
from typing import List, Dict, Any
import redis
from app.core.config import settings

logger = logging.getLogger(__name__)

class MemoryService:
    _instance = None
    _lock = threading.Lock()
    
    # Local fallback storage
    _local_store: Dict[str, List[Dict[str, str]]] = {}
    _local_store_lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if not cls._instance:
                cls._instance = super(MemoryService, cls).__new__(cls, *args, **kwargs)
                cls._instance._init_redis()
            return cls._instance

    def _init_redis(self):
        self.redis_client = None
        if settings.REDIS_URL:
            try:
                self.redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
                # Test connection
                self.redis_client.ping()
                logger.info("Successfully connected to Redis.")
            except Exception as e:
                logger.warning(f"Failed to connect to Redis: {e}. Falling back to in-memory storage.")
                self.redis_client = None
        else:
            logger.info("Redis URL not provided. Using in-memory storage for session memory.")

    def add_message(self, session_id: str, role: str, content: str):
        message = {"role": role, "content": content}
        
        # Try Redis first
        if self.redis_client:
            try:
                self.redis_client.rpush(f"session:{session_id}", json.dumps(message))
                # Keep last 20 messages to prevent memory bloating
                self.redis_client.ltrim(f"session:{session_id}", -20, -1)
                return
            except Exception as e:
                logger.error(f"Redis add_message failed: {e}. Falling back to local store.")
                # Fallback to local store on failure
        
        # Local store fallback
        with self._local_store_lock:
            if session_id not in self._local_store:
                self._local_store[session_id] = []
            self._local_store[session_id].append(message)
            # Keep last 20
            if len(self._local_store[session_id]) > 20:
                self._local_store[session_id] = self._local_store[session_id][-20:]

    def get_history(self, session_id: str, limit: int = 10) -> List[Dict[str, str]]:
        if self.redis_client:
            try:
                messages = self.redis_client.lrange(f"session:{session_id}", -limit, -1)
                if messages:
                    return [json.loads(m) for m in messages]
                return []
            except Exception as e:
                logger.error(f"Redis get_history failed: {e}. Falling back to local store.")
        
        with self._local_store_lock:
            history = self._local_store.get(session_id, [])
            return history[-limit:]

    def clear_history(self, session_id: str):
        if self.redis_client:
            try:
                self.redis_client.delete(f"session:{session_id}")
                return
            except Exception as e:
                logger.error(f"Redis clear_history failed: {e}. Falling back to local store.")
        
        with self._local_store_lock:
            if session_id in self._local_store:
                del self._local_store[session_id]

memory_service = MemoryService()
