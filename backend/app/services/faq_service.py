import os
import json
import logging
from typing import Dict, Any, Optional, List
import chromadb
from chromadb.utils import embedding_functions
from app.core.config import settings

logger = logging.getLogger(__name__)

class FAQService:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(FAQService, cls).__new__(cls, *args, **kwargs)
            cls._instance._init_service()
        return cls._instance

    def _init_service(self):
        self.client = None
        self.collection = None
        self.faqs_filepath = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "data",
            "faqs.json"
        )
        
        try:
            # Set up the same local SentenceTransformer embedding function
            self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name="all-MiniLM-L6-v2"
            )

            # Initialize ChromaDB client pointing to persistence directory
            os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
            logger.info(f"[FAQService] Connecting to ChromaDB persistent storage at {settings.CHROMA_PERSIST_DIR}")
            self.client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)

            # Get or create the FAQ collection
            self.collection = self.client.get_or_create_collection(
                name="aurachat_faqs",
                embedding_function=self.embedding_function
            )
            logger.info("[FAQService] ChromaDB FAQ collection loaded successfully.")
            
            # Ingest FAQ dataset
            self.ingest_faqs_from_json()
        except Exception as e:
            logger.error(f"[FAQService] Failed to initialize FAQ system: {e}")
            self.client = None
            self.collection = None

    def ingest_faqs_from_json(self):
        """Reads FAQs from the JSON file and adds/updates them in the ChromaDB collection."""
        if not self.collection:
            logger.warning("[FAQService] ChromaDB collection not initialized. Ingestion skipped.")
            return

        if not os.path.exists(self.faqs_filepath):
            logger.error(f"[FAQService] FAQs dataset file not found at {self.faqs_filepath}")
            return

        try:
            with open(self.faqs_filepath, "r", encoding="utf-8") as f:
                faqs = json.load(f)

            if not faqs:
                logger.warning("[FAQService] FAQs dataset is empty.")
                return

            ids = []
            documents = []
            metadatas = []

            for faq in faqs:
                faq_id = faq.get("id")
                question = faq.get("question")
                answer = faq.get("answer")
                category = faq.get("category", "general")

                if not faq_id or not question or not answer:
                    logger.warning(f"[FAQService] Skipping invalid FAQ record: {faq}")
                    continue

                ids.append(faq_id)
                # We embed the question to perform semantic query matching against what the user typed
                documents.append(question)
                metadatas.append({
                    "answer": answer,
                    "question": question,
                    "category": category
                })

            if ids:
                # Upsert updates existing ids and adds new ones
                self.collection.upsert(
                    ids=ids,
                    documents=documents,
                    metadatas=metadatas
                )
                logger.info(f"[FAQService] Successfully upserted {len(ids)} FAQs into ChromaDB.")
        except Exception as e:
            logger.error(f"[FAQService] Error ingesting FAQs: {e}")

    def find_best_match(self, query: str, distance_threshold: float = 1.2) -> Optional[Dict[str, Any]]:
        """
        Searches ChromaDB for the closest semantic FAQ match.
        ChromaDB uses L2 distance by default (squared L2, lower is closer).
        """
        if not self.collection:
            logger.warning("[FAQService] ChromaDB collection not initialized. Cannot perform search.")
            return None

        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=1
            )

            if not results or not results.get("documents") or not results["documents"][0]:
                return None

            # Retrieve top match
            document = results["documents"][0][0]
            metadata = results["metadatas"][0][0]
            distance = results["distances"][0][0]

            logger.info(f"[FAQService] Query: '{query}' -> Best match: '{document}' (Distance: {distance:.4f})")

            # Check if match meets threshold
            if distance <= distance_threshold:
                return {
                    "question": metadata.get("question", document),
                    "answer": metadata.get("answer", ""),
                    "category": metadata.get("category", "general"),
                    "distance": distance
                }
            else:
                logger.info(f"[FAQService] Best match distance {distance:.4f} exceeded threshold of {distance_threshold}")
                return None
        except Exception as e:
            logger.error(f"[FAQService] Error performing FAQ semantic search: {e}")
            return None

faq_service = FAQService()
