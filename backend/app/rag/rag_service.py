import os
import logging
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.utils import embedding_functions
from pypdf import PdfReader
from app.core.config import settings

logger = logging.getLogger(__name__)

class RAGService:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(RAGService, cls).__new__(cls, *args, **kwargs)
            cls._instance._init_chroma()
        return cls._instance

    def _init_chroma(self):
        self.client = None
        self.collection = None
        try:
            # Setup embedding function (downloads and runs all-MiniLM-L6-v2 locally)
            self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name="all-MiniLM-L6-v2"
            )

            # Connect to ChromaDB server if host is provided, otherwise run local persistent client
            if settings.CHROMA_SERVER_HOST:
                logger.info(f"Connecting to remote ChromaDB at {settings.CHROMA_SERVER_HOST}:{settings.CHROMA_SERVER_PORT}")
                self.client = chromadb.HttpClient(
                    host=settings.CHROMA_SERVER_HOST,
                    port=int(settings.CHROMA_SERVER_PORT)
                )
            else:
                os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
                logger.info(f"Connecting to local ChromaDB with persistence at {settings.CHROMA_PERSIST_DIR}")
                self.client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)

            # Create or get the collection
            self.collection = self.client.get_or_create_collection(
                name="aurachat_documents",
                embedding_function=self.embedding_function
            )
            logger.info("ChromaDB collection initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}. RAG features will be bypassed.")
            self.client = None
            self.collection = None

    def chunk_text(self, text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> List[str]:
        """Simple, robust text splitter with overlap."""
        if not text:
            return []
        
        words = text.split()
        chunks = []
        
        # Simple word-count based chunking
        i = 0
        while i < len(words):
            chunk = words[i:i + chunk_size]
            chunks.append(" ".join(chunk))
            i += (chunk_size - chunk_overlap)
            
        return chunks

    def ingest_text(self, text: str, filename: str, doc_id: str) -> bool:
        if not self.collection:
            logger.warning("ChromaDB is not active. Skipping text ingestion.")
            return False

        try:
            chunks = self.chunk_text(text)
            if not chunks:
                return False

            ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
            documents = chunks
            metadatas = [{"filename": filename, "source_id": doc_id} for _ in range(len(chunks))]

            self.collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )
            logger.info(f"Successfully ingested {len(chunks)} chunks from {filename}.")
            return True
        except Exception as e:
            logger.error(f"Error during text ingestion: {e}")
            return False

    def ingest_pdf(self, file_path: str, filename: str, doc_id: str) -> bool:
        if not self.collection:
            logger.warning("ChromaDB is not active. Skipping PDF ingestion.")
            return False

        try:
            reader = PdfReader(file_path)
            full_text = ""
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"

            if not full_text.strip():
                logger.warning(f"No text extracted from PDF {filename}.")
                return False

            return self.ingest_text(full_text, filename, doc_id)
        except Exception as e:
            logger.error(f"Error reading or ingesting PDF {filename}: {e}")
            return False

    def search_similar(self, query: str, n_results: int = 3) -> List[Dict[str, Any]]:
        if not self.collection:
            logger.warning("ChromaDB is not active. Skipping search.")
            return []

        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results
            )
            
            formatted_results = []
            if results and 'documents' in results and results['documents']:
                documents = results['documents'][0]
                metadatas = results['metadatas'][0] if 'metadatas' in results else [{}]*len(documents)
                distances = results['distances'][0] if 'distances' in results else [0.0]*len(documents)
                
                for i in range(len(documents)):
                    formatted_results.append({
                        "content": documents[i],
                        "metadata": metadatas[i],
                        "distance": distances[i]
                    })
            return formatted_results
        except Exception as e:
            logger.error(f"Error searching similarities in ChromaDB: {e}")
            return []

rag_service = RAGService()
