<div align="center">
  <h1>🤖 AuraChat Platform</h1>
  <p><strong>Secure, Local Document AI Customer Support Suite</strong></p>
  <p>
    <a href="#about">About</a> •
    <a href="#features">Features</a> •
    <a href="#how-it-works">How It Works</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a>
  </p>
</div>

<br/>

## 🌟 About AuraChat

AuraChat is a completely local, privacy-first Document AI Support Suite. Have you ever wanted a customer support chatbot that actually knows the ins-and-outs of your specific product manuals, guidelines, and documentation without uploading your private company data to a third-party cloud? That's what AuraChat does. 

It empowers you to ingest your own proprietary PDFs and Text files and instantly spins up a secure AI assistant capable of answering questions naturally and accurately based *only* on the documents provided. Everything—from the database to the neural network vector embeddings—runs locally on your machine.

---

## ✨ Features

- **100% Local RAG Pipeline**: No data leaves your machine. Your documents are chunked and embedded using an offline, state-of-the-art neural network (`all-MiniLM-L6-v2`).
- **Zero-Latency Feel**: Engineered with Next.js, Framer Motion, and FastAPI asynchronous streaming for instantaneous character-by-character responses.
- **Smart Conversational Memory**: Chat sessions remember context. Jump back into an old thread and pick up right where you left off.
- **Fluid & Responsive Design**: Our "Liquid Glass" UI looks stunning on both 4K desktop monitors and tiny smartphone screens. 
- **Granular Analytics**: Track total conversations, monitor satisfaction rates from your users, and diagnose failed RAG hits.
- **Multiple Formats Supported**: Drag and drop `.pdf` or `.txt` manuals directly into the browser to expand the bot's knowledge in seconds.

---

## 🛠️ How It Works

AuraChat uses a technique called **Retrieval-Augmented Generation (RAG)**:
1. **Ingestion**: You upload a document. We recursively split the text into optimized 400-character chunks with overlaps so no context is lost.
2. **Embedding**: We turn those text chunks into multidimensional mathematical vectors and save them locally into **ChromaDB**.
3. **Retrieval**: When a user asks a question, we convert their question into a vector and use **Cosine L2 proximity** to find the 3 most relevant chunks from your documents in milliseconds.
4. **Response**: We seamlessly extract the best context, stitch it into a natural, conversational reply, and stream it to the UI!

---

## 💻 Tech Stack

**Frontend (Client)**
- **Framework**: Next.js 14+ (App Router, React Query)
- **Styling**: Tailwind CSS & Framer Motion
- **Icons & Charts**: Lucide React & Recharts

**Backend (Server)**
- **Framework**: FastAPI (Python 3.10+)
- **Vector Database**: ChromaDB (Local SQLite integration)
- **Standard Database**: SQLite (via SQLAlchemy for session logs)
- **AI/Embeddings**: SentenceTransformers (`all-MiniLM-L6-v2`) & PyPDF2

---

## 🚀 Getting Started

To get the AuraChat sandbox running on your local machine, follow these steps:

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Git

### 1. Clone & Set Up Backend
```bash
# Navigate to the backend
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server (runs on port 8000)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Set Up Frontend
Open a new terminal window:
```bash
# Navigate to the frontend
cd frontend

# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```

### 3. Launch
Open `http://localhost:3000` in your browser. 
To log into the console, use the demo credentials:
**Email:** `admin@aurachat.com`  
**Password:** `admin123`

---

## 🔒 Security & Sandbox Info
This project is built explicitly for offline, sandboxed university and enterprise usage. By default, it operates in simulated LLM mode using a powerful keyword-overlap heuristic to guarantee 100% offline data privacy. If you wish to connect an external LLM like OpenAI for even smarter generative summarization, simply provide your API key in a `.env` file within the backend folder.

<br/>
<div align="center">
  Built with ❤️ for secure, localized AI.
</div>
