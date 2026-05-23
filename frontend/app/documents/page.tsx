'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Database, 
  Loader2,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { api } from '../../services/api';

interface UploadStatus {
  filename: string;
  status: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
  chunkCount?: number;
}

export default function DocumentIngestionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [localUploads, setLocalUploads] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Authenticate validation check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('user_authenticated');
      if (auth !== 'true') {
        router.push('/login');
      }
    }
  }, [router]);

  // Query database documents list
  const { data: dbDocuments = [], isLoading: isLoadingDocs, refetch: refetchDocs } = useQuery({
    queryKey: ['ragDocuments'],
    queryFn: api.getDocuments,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.txt') || file.type === 'text/plain') {
        setSelectedFile(file);
      } else {
        alert('AuraChat currently only supports PDF and TXT manuals for context extraction.');
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.txt')) {
        setSelectedFile(file);
      } else {
        alert('AuraChat currently only supports PDF and TXT manuals for context extraction.');
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || isUploading) return;

    const fileToUpload = selectedFile;
    setSelectedFile(null);
    setIsUploading(true);

    const newUpload: UploadStatus = {
      filename: fileToUpload.name,
      status: 'uploading'
    };

    setLocalUploads(prev => [newUpload, ...prev]);

    try {
      const response = await api.uploadDocument(fileToUpload);
      
      setLocalUploads(prev => 
        prev.map(item => 
          item.filename === fileToUpload.name 
            ? { 
                ...item, 
                status: 'success', 
                message: 'Successfully indexed manual content.', 
                chunkCount: Number((response as any).chunk_count) 
              }
            : item
        )
      );

      queryClient.invalidateQueries({ queryKey: ['ragDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsData'] });
      refetchDocs();

    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || 'Failed to clean and split document content.';
      
      setLocalUploads(prev => 
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
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-white text-slate-800">
      
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content scroll window */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 no-scrollbar bg-slate-50/20">
        
        {/* Title Header */}
        <div className="pb-6 mb-8 border-b border-sky-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-xl md:text-2xl font-display font-black tracking-tight text-slate-900 flex items-center gap-3">
              <Database className="h-6 w-6 text-sky-500" />
              <span>Document RAG Knowledge Base</span>
            </h1>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-medium">
              Upload product guides, APIs manuals, and documentation to build an instant contextual retrieval map for the support bot.
            </p>
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 text-[10px] font-bold shadow-sm">
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-sky-500" />
            <span>LOCAL VECTOR CHUNKING</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Ingestion controllers (Column 1 & 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Upload Panel */}
            <div className="liquid-glass p-6 sm:p-8 rounded-3xl border border-sky-100 shadow-md relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="mb-6">
                <span className="text-[9px] font-extrabold text-sky-650 uppercase tracking-widest bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">Knowledge Ingestion</span>
                <h3 className="text-sm font-bold text-slate-900 font-display uppercase tracking-wider mt-4">Upload Support Documentation</h3>
                <p className="text-[10px] text-slate-500 mt-1.5 leading-normal font-medium">
                  Our system splits files into 300-word segments, tracks index statistics in ChromaDB, and returns source mapping info.
                </p>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                
                {/* Drag zone container */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 relative ${
                    isDragActive 
                      ? 'border-sky-500 bg-sky-50' 
                      : 'border-slate-200 hover:border-sky-500/50 bg-slate-50/50'
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-sky-500 shadow-sm relative">
                      <div className="absolute inset-0 bg-sky-500/5 blur-md rounded-xl" />
                      <Upload className="h-6 w-6 text-sky-500 relative" />
                    </div>
                    {selectedFile ? (
                      <div className="text-[11px]">
                        <span className="font-bold text-slate-800 block truncate max-w-md">{selectedFile.name}</span>
                        <span className="text-slate-500 mt-1 block font-medium">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 font-medium">
                        <span className="font-bold text-sky-500 hover:text-sky-600">Click to upload</span> or drag and drop manual PDF/TXT
                        <p className="text-[10px] text-slate-400 mt-1.5">PDF & TXT Guides & Manuals (Max size 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Index triggers */}
                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-450 font-medium leading-none">
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                    <span>Recursive chunk indexing applies instantly</span>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!selectedFile || isUploading}
                    className="px-6 py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-sky-500/10 flex items-center gap-2 cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Vector Indexing...</span>
                      </>
                    ) : (
                      <span>Index Document</span>
                    )}
                  </button>
                </div>

              </form>
            </div>

            {/* Ingestion logs */}
            {localUploads.length > 0 && (
              <div className="bg-slate-50 border border-sky-100 p-6 rounded-2xl shadow-sm">
                <span className="text-[9px] font-extrabold text-slate-450 uppercase tracking-wider block mb-4">Indexing Activity Feed</span>
                <div className="space-y-3">
                  {localUploads.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-start justify-between p-3.5 bg-white border border-slate-200 rounded-xl"
                    >
                      <div className="flex gap-3">
                        <div className="p-2 bg-sky-50 rounded-lg border border-sky-100 text-sky-500 shadow-sm">
                          <FileText className="h-4 w-4 text-sky-550" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{item.filename}</p>
                          <p className="text-[10px] text-slate-500 mt-1 font-medium">
                            {item.status === 'uploading' && 'Extracting text strings & parsing layers...'}
                            {item.status === 'success' && `${item.message} Indexed ${item.chunkCount || 0} vector chunks.`}
                            {item.status === 'error' && item.message}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 mt-1">
                        {item.status === 'uploading' && <Loader2 className="h-4 w-4 text-sky-500 animate-spin" />}
                        {item.status === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                        {item.status === 'error' && <XCircle className="h-4 w-4 text-rose-600" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Database Document List */}
            <div className="bg-slate-50 border border-sky-100 p-6 rounded-2xl shadow-sm">
              <span className="text-[9px] font-extrabold text-slate-455 uppercase tracking-wider block mb-4">Currently Indexed Knowledge Bases</span>
              
              {isLoadingDocs ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-sky-500" /> Fetching Document Catalog...
                </div>
              ) : dbDocuments.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 italic bg-white border border-slate-200 rounded-xl font-medium">
                  No proprietary documentation manual found. Upload your first manual to test.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {dbDocuments.map((doc, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl hover:border-sky-400 transition-all group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-100 text-sky-500">
                          <FileText className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 block truncate max-w-sm">{doc.filename}</span>
                          <div className="flex items-center gap-3 text-[9px] text-slate-450 mt-1 font-bold">
                            <span className="bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded text-sky-600">{doc.chunk_count} Vector Chunks</span>
                            <span>Uploaded {doc.ingested_at}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded font-bold">
                          ACTIVE RAG
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Technical metadata statistics grid (Column 3) */}
          <div className="space-y-6">
            
            {/* Indexing Stats */}
            <div className="bg-slate-50 border border-sky-100 p-6 rounded-3xl shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 font-display uppercase tracking-wider mb-4 flex items-center gap-2">
                <Database className="h-4 w-4 text-sky-500" />
                <span>Vector Ingestion Pipeline</span>
              </h3>
              
              <div className="space-y-4 text-xs text-slate-600 font-medium">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span>Vector Store Engine:</span>
                  <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-150">
                    ChromaDB
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span>Distance Algorithm:</span>
                  <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-150">
                    L2 Cosine Metric
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span>Active Embedding Model:</span>
                  <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-150">
                    all-MiniLM-L6-v2
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Chunk Parameters:</span>
                  <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-150">
                    300w / 30w overlap
                  </span>
                </div>
              </div>
            </div>

            {/* Security Guard */}
            <div className="bg-slate-50 border border-sky-100 p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 font-display uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-sky-500" />
                <span>Sandbox Security</span>
              </h3>
              
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                All document parsing, data extraction, recursive cleaning, and vector storage indexing occur **100% locally**. No third-party network calls are dispatched, ensuring zero operational risk.
              </p>

              <div className="p-3 bg-white border border-slate-200 rounded-xl flex gap-2 text-[9px] text-slate-500 font-medium">
                <span className="font-bold text-sky-600 uppercase shrink-0">DATA PRIVACY:</span>
                <span>Self-contained local architecture protects sensitive files.</span>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
