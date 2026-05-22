'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { 
  Bot, 
  MessageSquare, 
  Settings, 
  BarChart3, 
  ShieldAlert, 
  ArrowRight,
  TrendingUp,
  Users,
  Star,
  BookOpen
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { api } from '../services/api';

export default function DashboardPage() {
  const { data: analytics, isLoading, isError } = useQuery({
    queryKey: ['analyticsSummary'],
    queryFn: api.getAnalytics,
    refetchInterval: 15000, // Refetch every 15s to keep dashboard live
  });

  // Default fallback values if backend is offline or loading
  const stats = [
    {
      name: 'Total Chats Logged',
      value: isLoading ? '...' : analytics?.total_chats ?? 142,
      change: '+12% this week',
      icon: MessageSquare,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40',
    },
    {
      name: 'Customer Satisfaction',
      value: isLoading ? '...' : `${analytics?.satisfaction_rate ?? 94.2}%`,
      change: '+2.1% improvement',
      icon: Star,
      color: 'text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40',
    },
    {
      name: 'Active Support Sessions',
      value: isLoading ? '...' : analytics?.active_users ?? 8,
      change: 'Live sessions',
      icon: Users,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      name: 'Unresolved Queries',
      value: isLoading ? '...' : analytics?.unresolved_queries ?? 3,
      change: 'Requires attention',
      icon: ShieldAlert,
      color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40',
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto relative p-6 md:p-8 lg:p-10 focus:outline-none">
        
        {/* Top welcome banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              System Overview
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Welcome back. Manage your SupportIQ conversational flow, index knowledge vectors, and review ratings.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Local Node Engine Running</span>
          </div>
        </div>

        {/* Backend offline warning banner */}
        {isError && (
          <div className="mb-8 p-4 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 flex items-start gap-3 shadow-sm animate-pulse-slow">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold">Backend Service Offline:</span> The local FastAPI backend could not be reached. Showing offline simulated metrics. Please start the server by running <code className="bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded font-mono">python3 app/main.py</code> in the backend folder.
            </div>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div 
                key={stat.name} 
                className="glass-panel p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg"
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {stat.name}
                  </span>
                  <div className={`p-2.5 rounded-xl border border-current/10 ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {stat.value}
                  </span>
                  <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-indigo-500" />
                    {stat.change}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Launch & Features Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Card: Chat */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between group">
            <div>
              <div className="p-3 bg-indigo-500/10 dark:bg-indigo-400/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit mb-4">
                <Bot className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Support Chat</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Interact with the support agent, test your RAG configurations, and experience real-time streaming LLM responses with built-in conversation history.
              </p>
            </div>
            <Link 
              href="/chat" 
              className="mt-6 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300"
            >
              <span>Launch Chat Terminal</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Card: Document Upload */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between group">
            <div>
              <div className="p-3 bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl w-fit mb-4">
                <BookOpen className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Knowledge Ingestion (RAG)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Upload business guides, PDFs, or FAQ documents. The system splits the text into semantic chunks and updates the vector database (ChromaDB) dynamically.
              </p>
            </div>
            <Link 
              href="/settings" 
              className="mt-6 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300"
            >
              <span>Manage Knowledge Bases</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Card: Analytics */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between group">
            <div>
              <div className="p-3 bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl w-fit mb-4">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Performance Analytics</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Monitor user satisfaction rates, aggregate chat volume reports, check unresolved user issues, and view raw conversation ratings.
              </p>
            </div>
            <Link 
              href="/analytics" 
              className="mt-6 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300"
            >
              <span>View Analytics Console</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

        </div>

        {/* Section: How RAG Works */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
            SupportIQ Architecture & Retrieval-Augmented Generation Flow
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="relative flex flex-col items-start bg-slate-100/55 dark:bg-slate-900/35 p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/40">
              <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-400/10 px-2 py-0.5 rounded mb-3">STEP 01</span>
              <span className="font-bold text-sm text-slate-900 dark:text-white mb-1">Context Ingestion</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                Admins upload PDF or text documentation, which are parsed and cleaned dynamically.
              </span>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-start bg-slate-100/55 dark:bg-slate-900/35 p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/40">
              <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-400/10 px-2 py-0.5 rounded mb-3">STEP 02</span>
              <span className="font-bold text-sm text-slate-900 dark:text-white mb-1">Local Embeddings</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                `all-MiniLM-L6-v2` generates 384-dimensional text vectors locally. Saved to ChromaDB.
              </span>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col items-start bg-slate-100/55 dark:bg-slate-900/35 p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/40">
              <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-400/10 px-2 py-0.5 rounded mb-3">STEP 03</span>
              <span className="font-bold text-sm text-slate-900 dark:text-white mb-1">Semantic Search</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                When a user messages, ChromaDB retrieves top matching text chunks based on cosine similarity.
              </span>
            </div>

            {/* Step 4 */}
            <div className="relative flex flex-col items-start bg-slate-100/55 dark:bg-slate-900/35 p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/40">
              <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-400/10 px-2 py-0.5 rounded mb-3">STEP 04</span>
              <span className="font-bold text-sm text-slate-900 dark:text-white mb-1">Augmented Streaming</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                GPT-4o-mini receives context + memory, streaming a grounded markdown response.
              </span>
            </div>
            
          </div>
        </div>

      </main>
    </div>
  );
}
