'use client';

import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Settings as SettingsIcon, 
  Database, 
  Key,
  Info,
  Loader2
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { api } from '../../services/api';

interface UploadStatus {
  filename: string;
  status: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
}

export default function SettingsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const fileToUpload = selectedFile;
    setSelectedFile(null); // Clear select field
    
    // Add to status list
    const uploadItem: UploadStatus = {
      filename: fileToUpload.name,
      status: 'uploading'
    };
    
    setUploads(prev => [uploadItem, ...prev]);
    setIsUploading(true);

    try {
      const response = await api.uploadDocument(fileToUpload);
      // Update state to success
      setUploads(prev => 
        prev.map(item => 
          item.filename === fileToUpload.name 
            ? { ...item, status: 'success', message: `Indexed successfully. ID: ${response.document_id}` }
            : item
        )
      );
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || 'Failed to ingest file.';
      // Update state to error
      setUploads(prev => 
        prev.map(item => 
          item.filename === fileToUpload.name 
            ? { ...item, status: 'error', message: errorMsg }
            : item
        )
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10">
        
        {/* Page Title Header */}
        <div className="pb-6 mb-8 border-b border-slate-100 dark:border-slate-800/80">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <SettingsIcon className="h-7 w-7 text-indigo-500" />
            <span>Settings & Ingestion</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Ingest manual files into the RAG pipeline or verify environment status credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1 & 2: Ingestion panel */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* RAG Knowledge Upload Card */}
            <div className="glass-panel p-6 md:p-8 rounded-3xl">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-500" />
                <span>RAG Document Ingestion</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Upload company PDFs or plain text FAQ files. The system will extract text, break it into 500-word overlapping chunks, embed it using local vector models, and index it inside ChromaDB. The AI chatbot retrieves this context instantly when answering questions.
              </p>

              {/* Upload Form */}
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 rounded-2xl p-8 text-center transition-all duration-200 relative bg-slate-50/40 dark:bg-slate-900/10">
                  <input
                    type="file"
                    id="file-upload"
                    accept=".pdf,.txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm text-slate-400 dark:text-slate-500">
                      <Upload className="h-6 w-6" />
                    </div>
                    {selectedFile ? (
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">{selectedFile.name}</span>
                        <p className="text-slate-400 dark:text-slate-500 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div className="text-xs">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag and drop
                        <p className="text-slate-400 dark:text-slate-500 mt-1.5">PDF or TXT (Max size 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!selectedFile || isUploading}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-indigo-600/10 dark:shadow-indigo-900/10 flex items-center gap-2 cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Indexing Document...</span>
                      </>
                    ) : (
                      <span>Index Document</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Upload History list */}
            {uploads.length > 0 && (
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Ingestion Activity</h3>
                <div className="space-y-3">
                  {uploads.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/80">
                      <div className="flex gap-3">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/50 dark:border-slate-700/50 text-slate-400">
                          <FileText className="h-4.5 w-4.5 text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-950 dark:text-slate-50 leading-tight">
                            {item.filename}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                            {item.status === 'uploading' && 'Indexing text chunks...'}
                            {item.status === 'success' && (item.message ?? 'Indexed successfully')}
                            {item.status === 'error' && (item.message ?? 'Error loading file')}
                          </p>
                        </div>
                      </div>
                      <div>
                        {item.status === 'uploading' && (
                          <Loader2 className="h-4.5 w-4.5 text-indigo-500 animate-spin" />
                        )}
                        {item.status === 'success' && (
                          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                        )}
                        {item.status === 'error' && (
                          <XCircle className="h-4.5 w-4.5 text-rose-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Column 3: Configs & Details */}
          <div className="space-y-6">
            
            {/* Tech Stack status */}
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Database className="h-4 w-4 text-indigo-500" />
                <span>Backend Database Engine Status</span>
              </h3>
              <div className="space-y-3.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="font-medium">Primary Store:</span>
                  <span className="font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                    SQLite / PostgreSQL
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="font-medium">Conversation Memory:</span>
                  <span className="font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                    Redis / In-Memory Cache
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Vector Store:</span>
                  <span className="font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                    ChromaDB (Local Persistent)
                  </span>
                </div>
              </div>
            </div>

            {/* Env Key Instructions */}
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3.5 flex items-center gap-2">
                <Key className="h-4 w-4 text-indigo-500" />
                <span>OpenAI Authentication</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                To generate answers using GPT-4o-mini, AuraChat AI loads the <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">OPENAI_API_KEY</code> variable from the environment.
              </p>
              
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/35 border border-slate-200/50 dark:border-slate-800/60 rounded-xl space-y-2 text-[10px] leading-relaxed">
                <div className="flex gap-2">
                  <Info className="h-4 w-4 text-indigo-500 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">How to Set Keys:</span>
                    <ol className="list-decimal pl-3.5 mt-1 space-y-1 text-slate-500 dark:text-slate-400">
                      <li>Create a <code className="bg-slate-100 dark:bg-slate-800 px-0.5 rounded font-mono">.env</code> file in the root directory.</li>
                      <li>Add the line: <br /><code className="bg-slate-100 dark:bg-slate-800 px-0.5 rounded font-mono text-[9px]">OPENAI_API_KEY=sk-...</code></li>
                      <li>Restart the backend server.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
