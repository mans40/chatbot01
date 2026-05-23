import os
import re
import logging
import datetime
from typing import List, Dict, Any, Optional
import PyPDF2
import pandas as pd
from app.rag.rag_service import rag_service

logger = logging.getLogger(__name__)

class DocumentService:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(DocumentService, cls).__new__(cls, *args, **kwargs)
            cls._instance._init_service()
        return cls._instance

    def _init_service(self):
        # Create documents data directory
        self.docs_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "data",
            "documents"
        )
        os.makedirs(self.docs_dir, exist_ok=True)
        
        # Meta CSV file to track ingested files using pandas
        self.meta_filepath = os.path.join(self.docs_dir, "metadata.csv")
        if not os.path.exists(self.meta_filepath):
            df = pd.DataFrame(columns=["document_id", "filename", "file_path", "chunk_count", "ingested_at"])
            df.to_csv(self.meta_filepath, index=False)

    def get_ingested_documents(self) -> List[Dict[str, Any]]:
        """Return list of ingested documents metadata using pandas."""
        try:
            if os.path.exists(self.meta_filepath):
                df = pd.read_csv(self.meta_filepath)
                # Fill NaNs and convert to dict list
                df = df.fillna("")
                return df.to_dict(orient="records")
        except Exception as e:
            logger.error(f"Error reading metadata.csv: {e}")
        return []

    def save_metadata(self, doc_id: str, filename: str, file_path: str, chunk_count: int):
        """Append metadata of newly ingested document using pandas."""
        try:
            new_row = {
                "document_id": doc_id,
                "filename": filename,
                "file_path": file_path,
                "chunk_count": chunk_count,
                "ingested_at": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            }
            if os.path.exists(self.meta_filepath):
                df = pd.read_csv(self.meta_filepath)
                df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
            else:
                df = pd.DataFrame([new_row])
            df.to_csv(self.meta_filepath, index=False)
        except Exception as e:
            logger.error(f"Error saving metadata: {e}")

    def clean_text(self, text: str) -> str:
        """Clean extracted text from PDFs by removing excessive spaces, newlines and weird symbols."""
        if not text:
            return ""
        
        # Replace multiple spaces with a single space
        text = re.sub(r'[ \t]+', ' ', text)
        
        # Clean weird control characters but keep printable ones and punctuation
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\xff]', '', text)
        
        # Remove repeated lines (Context cleaning)
        lines = text.split('\n')
        seen_lines = set()
        unique_lines = []
        for line in lines:
            line_stripped = line.strip()
            if line_stripped and line_stripped not in seen_lines:
                seen_lines.add(line_stripped)
                unique_lines.append(line_stripped)
            elif not line_stripped:
                unique_lines.append("")
        
        text = '\n'.join(unique_lines)
        
        # Replace 3 or more consecutive newlines with exactly 2 newlines (preserves paragraph separation)
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        return text.strip()

    def chunk_text(self, text: str, chunk_size: int = 400, chunk_overlap: int = 80) -> List[str]:
        """Split cleaned text into robust overlapping character chunks (300-500 chars)."""
        cleaned = self.clean_text(text)
        if not cleaned:
            return []
            
        chunks = []
        i = 0
        while i < len(cleaned):
            chunk = cleaned[i:i + chunk_size]
            if chunk.strip():
                chunks.append(chunk.strip())
            i += (chunk_size - chunk_overlap)
            
        return chunks

    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract all text contents from a PDF file using PyPDF2."""
        full_text = []
        try:
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                num_pages = len(reader.pages)
                logger.info(f"Extracting text from PDF '{file_path}' containing {num_pages} pages.")
                
                for i in range(num_pages):
                    page = reader.pages[i]
                    text = page.extract_text()
                    if text:
                        full_text.append(text)
            
            return "\n\n".join(full_text)
        except Exception as e:
            logger.error(f"PyPDF2 failed to parse PDF {file_path}: {e}")
            raise Exception(f"Failed to parse PDF document: {str(e)}")

    def extract_text_from_txt(self, file_path: str) -> str:
        """Extract all text contents from a TXT file."""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                logger.info(f"Extracting text from TXT '{file_path}'.")
                return f.read()
        except Exception as e:
            logger.error(f"Failed to read TXT {file_path}: {e}")
            raise Exception(f"Failed to parse TXT document: {str(e)}")

    def ingest_document(self, temp_file_path: str, filename: str, doc_id: str) -> Dict[str, Any]:
        """
        Handle PDF or TXT upload:
        - Store file permanently in data/documents
        - Extract text using PyPDF2 or directly for TXT
        - Clean text
        - Chunk text
        - Index chunks into ChromaDB
        - Save metadata to metadata.csv
        """
        try:
            # 1. Store file permanently
            permanent_path = os.path.join(self.docs_dir, f"{doc_id}_{filename}")
            import shutil
            shutil.copy(temp_file_path, permanent_path)
            
            # 2. Extract text based on file type
            if filename.lower().endswith('.pdf'):
                raw_text = self.extract_text_from_pdf(permanent_path)
            elif filename.lower().endswith('.txt'):
                raw_text = self.extract_text_from_txt(permanent_path)
            else:
                raise Exception("Unsupported file format. Only PDF and TXT are supported.")

            if not raw_text.strip():
                raise Exception("No readable text found or extracted from the file.")
            
            # 3. Clean and Chunk text
            chunks = self.chunk_text(raw_text, chunk_size=400, chunk_overlap=80)
            if not chunks:
                raise Exception("Text extraction succeeded, but no valid chunks could be created.")
            
            # 4. Save vectors to ChromaDB using rag_service
            # Delete old chunks if document ID is somehow duplicated (overwrite prevention)
            if rag_service.collection:
                try:
                    rag_service.collection.delete(where={"source_id": doc_id})
                except Exception:
                    pass
                
                ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
                metadatas = [{"filename": filename, "source_id": doc_id, "chunk_index": i} for i in range(len(chunks))]
                
                rag_service.collection.add(
                    ids=ids,
                    documents=chunks,
                    metadatas=metadatas
                )
                logger.info(f"Indexed {len(chunks)} chunks for document {filename} inside ChromaDB.")
            else:
                raise Exception("ChromaDB is not active or collection not initialized.")
            
            # 5. Save metadata
            self.save_metadata(doc_id, filename, permanent_path, len(chunks))
            
            return {
                "document_id": doc_id,
                "filename": filename,
                "chunk_count": len(chunks),
                "status": "success",
                "message": f"Successfully ingested {len(chunks)} chunks into ChromaDB RAG store."
            }
            
        except Exception as e:
            logger.error(f"Error ingesting PDF document: {e}")
            raise e

document_service = DocumentService()
