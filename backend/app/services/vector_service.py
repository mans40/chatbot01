import os
import json
import logging
from typing import Dict, Any, Optional, List
import chromadb
from chromadb.utils import embedding_functions
from app.core.config import settings

logger = logging.getLogger(__name__)

class VectorService:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(VectorService, cls).__new__(cls, *args, **kwargs)
            cls._instance.client = None
            cls._instance._collection = None
            cls._instance.embedding_function = None
            cls._instance.initialized = False
            cls._instance.faqs_filepath = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                "data",
                "faqs.json"
            )
        return cls._instance

    @property
    def collection(self):
        self.ensure_initialized()
        return self._collection

    def ensure_initialized(self):
        if self.initialized:
            return
        try:
            logger.info("Lazy initializing VectorService FAQ collection (SentenceTransformer in CPU mode)...")
            # Set up the SentenceTransformer embedding function with CPU device
            self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name="all-MiniLM-L6-v2",
                device="cpu"
            )

            # Initialize local ChromaDB Persistent Client
            os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
            logger.info(f"[VectorService] Connecting to local ChromaDB with persistence at {settings.CHROMA_PERSIST_DIR}")
            self.client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)

            # Create or load the FAQ collection
            self._collection = self.client.get_or_create_collection(
                name="aurachat_faqs",
                embedding_function=self.embedding_function
            )
            logger.info("[VectorService] ChromaDB FAQ collection loaded successfully.")
            
            # Ingest FAQ dataset only if it is empty to optimize performance
            if self._collection.count() == 0:
                logger.info("[VectorService] FAQ collection is empty. Performing initial ingestion...")
                self.load_and_store_faqs()
            else:
                logger.info(f"[VectorService] FAQ collection already populated with {self._collection.count()} items. Skipping initial ingestion.")
        except Exception as e:
            logger.error(f"[VectorService] Failed to initialize Vector Service: {e}")
            self.client = None
            self._collection = None
        finally:
            self.initialized = True

    def load_and_store_faqs(self):
        """Loads FAQs from faqs.json, generates embeddings, and stores them in ChromaDB."""
        # Note: Use self._collection directly here to avoid recursion inside ensure_initialized
        if not self._collection:
            logger.warning("[VectorService] ChromaDB collection not initialized. Ingestion skipped.")
            return

        if not os.path.exists(self.faqs_filepath):
            logger.error(f"[VectorService] FAQs dataset file not found at {self.faqs_filepath}")
            return

        try:
            with open(self.faqs_filepath, "r", encoding="utf-8") as f:
                faqs = json.load(f)

            if not faqs:
                logger.warning("[VectorService] FAQs dataset is empty.")
                return

            ids = []
            documents = []
            metadatas = []

            for i, faq in enumerate(faqs):
                faq_id = faq.get("id", f"faq_{i}")
                question = faq.get("question")
                answer = faq.get("answer")
                category = faq.get("category", "general")

                if not question or not answer:
                    logger.warning(f"[VectorService] Skipping invalid FAQ record: {faq}")
                    continue

                ids.append(faq_id)
                documents.append(question)
                metadatas.append({
                    "answer": answer,
                    "question": question,
                    "category": category
                })

            if ids:
                self._collection.upsert(
                    ids=ids,
                    documents=documents,
                    metadatas=metadatas
                )
                logger.info(f"[VectorService] Successfully upserted {len(ids)} FAQs into ChromaDB.")
        except Exception as e:
            logger.error(f"[VectorService] Error loading and storing FAQs: {e}")

    def search_faqs(self, query: str, distance_threshold: float = 0.7) -> Optional[Dict[str, Any]]:
        """Searches ChromaDB FAQ collection to find the closest semantic match."""
        if not self.collection:
            logger.warning("[VectorService] ChromaDB FAQ collection not initialized.")
            return None

        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=1
            )

            if not results or not results.get("documents") or not results["documents"][0]:
                return None

            document = results["documents"][0][0]
            metadata = results["metadatas"][0][0]
            distance = results["distances"][0][0]

            logger.info(f"[VectorService] Query: '{query}' -> Best match: '{document}' (Distance: {distance:.4f})")

            # Check if match meets our distance threshold
            if distance <= distance_threshold:
                return {
                    "question": metadata.get("question", document),
                    "answer": metadata.get("answer", ""),
                    "category": metadata.get("category", "general"),
                    "distance": distance
                }
            return None
        except Exception as e:
            logger.error(f"[VectorService] Error searching FAQs in ChromaDB: {e}")
            return None

vector_service = VectorService()
