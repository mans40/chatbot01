import os
import re
import csv
import logging
import datetime
from typing import List, Dict, Any, Optional
import PyPDF2
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
        
        # Meta CSV file to track ingested files using standard csv
        self.meta_filepath = os.path.join(self.docs_dir, "metadata.csv")
        if not os.path.exists(self.meta_filepath):
            with open(self.meta_filepath, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(["document_id", "filename", "file_path", "chunk_count", "ingested_at"])

    def get_ingested_documents(self) -> List[Dict[str, Any]]:
        """Return list of ingested documents metadata using standard csv, with ChromaDB fallback."""
        try:
            documents_dict = {}
            
            # 1. Load from metadata.csv if it exists and has content
            if os.path.exists(self.meta_filepath):
                try:
                    with open(self.meta_filepath, "r", newline="", encoding="utf-8") as f:
                        reader = csv.DictReader(f)
                        for row in reader:
                            doc_id = row.get("document_id")
                            if doc_id:
                                documents_dict[doc_id] = {
                                    "document_id": doc_id,
                                    "filename": row.get("filename", ""),
                                    "file_path": row.get("file_path", ""),
                                    "chunk_count": int(row.get("chunk_count", 0) or 0),
                                    "ingested_at": row.get("ingested_at", "")
                                }
                except Exception as csv_err:
                    logger.error(f"Error reading metadata.csv: {csv_err}")

            # 2. Query ChromaDB to fetch any missing or previous uploads (robust fallback recovery)
            from app.rag.rag_service import rag_service
            if rag_service.collection:
                try:
                    results = rag_service.collection.get(include=["metadatas"])
                    if results and "metadatas" in results and results["metadatas"]:
                        counts = {}
                        filenames = {}
                        for meta in results["metadatas"]:
                            if meta and ("source_id" in meta or "filename" in meta):
                                fname = str(meta.get("filename", "unknown_manual"))
                                s_id = str(meta.get("source_id", fname))
                                counts[s_id] = counts.get(s_id, 0) + 1
                                filenames[s_id] = fname
                        
                        # Merge into documents_dict
                        for s_id, count in counts.items():
                            if s_id not in documents_dict:
                                timestamp_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
                                documents_dict[s_id] = {
                                    "document_id": s_id,
                                    "filename": filenames[s_id],
                                    "file_path": "",
                                    "chunk_count": count,
                                    "ingested_at": timestamp_str
                                }
                                # Save to metadata.csv so it persists
                                self.save_metadata(s_id, filenames[s_id], "", count)
                except Exception as chroma_err:
                    logger.error(f"Error restoring documents list from ChromaDB: {chroma_err}")
            
            return list(documents_dict.values())
        except Exception as e:
            logger.error(f"Error in get_ingested_documents: {e}")
            return []

    def save_metadata(self, doc_id: str, filename: str, file_path: str, chunk_count: int):
        """Append metadata of newly ingested document using standard csv."""
        try:
            new_row = {
                "document_id": doc_id,
                "filename": filename,
                "file_path": file_path,
                "chunk_count": chunk_count,
                "ingested_at": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            }
            file_exists = os.path.exists(self.meta_filepath)
            with open(self.meta_filepath, "a" if file_exists else "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=["document_id", "filename", "file_path", "chunk_count", "ingested_at"])
                if not file_exists:
                    writer.writeheader()
                writer.writerow(new_row)
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

    def delete_document(self, doc_id: str) -> bool:
        """Delete a document from ChromaDB, local storage, and metadata.csv."""
        try:
            # 1. Read metadata to find file path and filter it out using standard csv
            if os.path.exists(self.meta_filepath):
                rows = []
                file_path = None
                with open(self.meta_filepath, "r", newline="", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for r in reader:
                        if r.get("document_id") == doc_id:
                            file_path = r.get("file_path")
                        else:
                            rows.append(r)
                
                # Delete local file if it exists
                if file_path and isinstance(file_path, str) and file_path.strip() and os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                        logger.info(f"Deleted local file: {file_path}")
                    except Exception as file_err:
                        logger.error(f"Failed to remove local file {file_path}: {file_err}")
                
                # Rewrite metadata.csv
                with open(self.meta_filepath, "w", newline="", encoding="utf-8") as f:
                    writer = csv.DictWriter(f, fieldnames=["document_id", "filename", "file_path", "chunk_count", "ingested_at"])
                    writer.writeheader()
                    writer.writerows(rows)
                logger.info(f"Removed metadata entry for document: {doc_id}")
            
            # 2. Delete from ChromaDB
            if rag_service.collection:
                # 2.1. Attempt to delete by source_id
                try:
                    rag_service.collection.delete(where={"source_id": doc_id})
                    logger.info(f"Deleted chunks for document {doc_id} by source_id.")
                except Exception as chroma_err:
                    logger.error(f"Error deleting by source_id from ChromaDB: {chroma_err}")
                
                # 2.2. Fail-safe delete by filename (for legacy documents loaded without source_id metadata)
                try:
                    # Treat the doc_id itself as a filename if it looks like one, or use doc_id
                    rag_service.collection.delete(where={"filename": doc_id})
                    logger.info(f"Deleted chunks for document {doc_id} by filename.")
                except Exception as chroma_err:
                    logger.error(f"Error deleting by filename from ChromaDB: {chroma_err}")
            
            return True
        except Exception as e:
            logger.error(f"Failed to delete document {doc_id}: {e}")
            return False

document_service = DocumentService()
