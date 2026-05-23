'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Star, 
  ShieldAlert, 
  Clock,
  Filter,
  CheckCircle,
  FileText,
  Loader2,
  Users
} from 'lucide-react';
import { 
  CartesianGrid,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import Sidebar from '../../components/Sidebar';
import { api } from '../../services/api';

export default function AnalyticsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');

  // Avoid hydration mismatch for Recharts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Authenticate validation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('user_authenticated');
      if (auth !== 'true') {
        router.push('/login');
      }
    }
  }, [router]);

  const { data: analytics, isLoading, isError } = useQuery({
    queryKey: ['analyticsData'],
    queryFn: api.getAnalytics,
    refetchInterval: 12000, // Refetch every 12s
  });

  if (!mounted) {
    return (
      <div className="flex h-screen bg-white text-slate-800">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 animate-pulse bg-white" />
      </div>
    );
  }

  // Fallback charts mock data
  const defaultChartData = [
    { date: 'Mon', count: 12 },
    { date: 'Tue', count: 19 },
    { date: 'Wed', count: 15 },
    { date: 'Thu', count: 22 },
    { date: 'Fri', count: 30 },
    { date: 'Sat', count: 8 },
    { date: 'Sun', count: 14 },
  ];

  const chartData = analytics?.chats_over_time?.length 
    ? analytics.chats_over_time 
    : defaultChartData;

  const filteredFeedback = analytics?.recent_feedback?.filter(item => {
    if (ratingFilter === 'all') return true;
    return item.rating === ratingFilter;
  }) || [];

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-white text-slate-800">
      
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 no-scrollbar bg-slate-50/20">
        
        {/* Page Header */}
        <div className="pb-6 mb-8 border-b border-sky-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-xl md:text-2xl font-display font-black tracking-tight text-slate-900 flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-sky-500" />
              <span>Performance Analytics</span>
            </h1>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-medium">
              Verify platform conversation counts, RAG retrieval statistics, and star feedback reviews.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 text-[10px] font-bold shadow-sm">
            <Clock className="h-3.5 w-3.5 animate-spin-slow text-sky-500" />
            <span>REAL-TIME PIPELINE</span>
          </div>
        </div>

        {/* Loading / Error states */}
        {isLoading ? (
          <div className="h-[400px] flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 text-sky-500 animate-spin mb-3" />
            <p className="text-xs text-slate-500 font-bold">Aggregating platform metrics...</p>
          </div>
        ) : isError ? (
          <div className="h-[250px] liquid-glass rounded-3xl p-8 border border-sky-100 flex flex-col items-center justify-center text-center space-y-4 shadow-md">
            <ShieldAlert className="h-10 w-10 text-rose-500 animate-bounce" />
            <div>
              <h3 className="font-display font-black text-slate-900 text-sm">Failed to Load Metrics</h3>
              <p className="text-[11px] text-slate-550 mt-1 font-medium">Make sure the FastAPI backend server is active on localhost:8000.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Aggregate Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              
              {/* Card 1: Total Chats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="liquid-glass p-5 rounded-2xl border border-sky-100 card-hover-effect relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-colors" />
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Conversations</span>
                <span className="text-2xl font-display font-black text-slate-900 block mt-1.5 leading-none">
                  {analytics?.total_chats ?? 0}
                </span>
                <div className="flex items-center gap-1.5 text-[9px] text-emerald-600 font-extrabold mt-3">
                  <TrendingUp className="h-3 w-3" />
                  <span>Interactive exchanges</span>
                </div>
              </motion.div>

              {/* Card 2: Satisfaction rate */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="liquid-glass p-5 rounded-2xl border border-sky-100 card-hover-effect relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-colors" />
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Satisfaction Index</span>
                <span className="text-2xl font-display font-black text-slate-900 block mt-1.5 leading-none">
                  {analytics?.satisfaction_rate ?? 100}%
                </span>
                <div className="flex items-center gap-1 mt-3">
                  <div className="flex text-amber-400">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  </div>
                  <span className="text-[9px] text-slate-500 font-bold ml-1">
                    Avg: {analytics?.avg_rating ?? 0.0}/5 ({analytics?.feedback_count ?? 0} votes)
                  </span>
                </div>
              </motion.div>

              {/* Card 3: RAG PDF Manuals */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="liquid-glass p-5 rounded-2xl border border-sky-100 card-hover-effect relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-colors" />
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Ingested Knowledge</span>
                <span className="text-2xl font-display font-black text-slate-900 block mt-1.5 leading-none">
                  {analytics?.uploaded_documents ?? 0}
                </span>
                <div className="flex items-center gap-1.5 text-[9px] text-sky-600 font-extrabold mt-3">
                  <FileText className="h-3 w-3" />
                  <span>PDF support manuals active</span>
                </div>
              </motion.div>

              {/* Card 4: Response Quality Success Ratio */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="liquid-glass p-5 rounded-2xl border border-sky-100 card-hover-effect relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-colors" />
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Response Quality</span>
                <span className="text-2xl font-display font-black text-slate-900 block mt-1.5 leading-none">
                  {analytics?.total_chats ? Math.round(((analytics.successful_responses) / analytics.total_chats) * 100) : 100}%
                </span>
                <div className="flex items-center gap-1.5 text-[9px] text-emerald-600 font-extrabold mt-3">
                  <CheckCircle className="h-3 w-3" />
                  <span>{analytics?.successful_responses ?? 0} direct RAG answers</span>
                </div>
              </motion.div>

            </div>

            {/* Performance charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Chart container */}
              <div className="lg:col-span-2 liquid-glass p-6 rounded-3xl border border-sky-100 shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="text-[9px] font-extrabold text-sky-600 uppercase tracking-wider block">Traffic Metrics</span>
                    <h3 className="text-xs font-bold text-slate-900 font-display uppercase tracking-wider mt-0.5">Conversations Distribution</h3>
                  </div>
                  <span className="text-[9px] text-sky-600 font-extrabold uppercase bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                    LAST 7 DAYS
                  </span>
                </div>

                <div className="h-64 w-full text-[9px] text-slate-550 font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorChatsLight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} />
                      <YAxis stroke="#94a3b8" tickLine={false} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          borderColor: '#e2e8f0', 
                          borderRadius: '12px',
                          color: '#0f172a',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                        }} 
                      />
                      <Area type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorChatsLight)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI performance status */}
              <div className="liquid-glass p-6 rounded-3xl border border-sky-100 shadow-md flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-extrabold text-sky-600 uppercase tracking-wider block">Retrieval Info</span>
                  <h3 className="text-xs font-bold text-slate-900 font-display uppercase tracking-wider mt-0.5">RAG System Health</h3>
                  
                  <div className="space-y-4 mt-6">
                    
                    {/* Successful responses bar */}
                    <div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1">
                        <span>Direct Retrieval Hits</span>
                        <span className="text-slate-800 font-extrabold">{analytics?.successful_responses ?? 0}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-sky-500 rounded-full"
                          style={{ 
                            width: `${analytics?.total_chats ? ((analytics.successful_responses) / analytics.total_chats) * 100 : 100}%` 
                          }}
                        />
                      </div>
                    </div>

                    {/* Unresolved / Fallback query bar */}
                    <div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1">
                        <span>Fallback / Poor Ratings</span>
                        <span className="text-slate-800 font-extrabold">{analytics?.failed_queries ?? 0}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 rounded-full"
                          style={{ 
                            width: `${analytics?.total_chats ? (analytics.failed_queries / analytics.total_chats) * 100 : 0}%` 
                          }}
                        />
                      </div>
                    </div>

                    {/* Active users count */}
                    <div className="pt-4 border-t border-slate-150 flex items-center justify-between">
                      <span className="text-[10px] text-slate-450 font-bold">Active Chat Threads:</span>
                      <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-sky-500 animate-pulse" />
                        {analytics?.active_users ?? 0} Threads
                      </span>
                    </div>

                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-[9px] leading-relaxed text-slate-500 mt-6 lg:mt-0 font-medium">
                  <span className="font-bold text-slate-700 block mb-0.5">Automated RAG Sandbox:</span>
                  Fallback matches represent prompts where the bot responded with fallback responses or reviews was &le; 2 stars.
                </div>
              </div>

            </div>

            {/* Ingestion & Feedback review stream */}
            <div className="bg-slate-50 border border-sky-100 p-6 rounded-3xl shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <span className="text-[9px] font-extrabold text-sky-600 uppercase tracking-wider block">Customer Reviews</span>
                  <h3 className="text-xs font-bold text-slate-900 font-display uppercase tracking-wider mt-0.5">Recent Assistant Ratings</h3>
                </div>

                {/* Rating filter controls */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-450 font-bold flex items-center gap-1 mr-1">
                    <Filter className="h-3.5 w-3.5 text-slate-400" /> Filter:
                  </span>
                  <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    {['all', 5, 4, 3, 2, 1].map((val) => (
                      <button
                        key={val}
                        onClick={() => setRatingFilter(val as any)}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-bold cursor-pointer transition-colors ${
                          ratingFilter === val
                            ? 'bg-sky-500 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {val === 'all' ? 'All' : `${val}★`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feed table list */}
              {filteredFeedback.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 italic bg-white border border-slate-200 rounded-xl font-medium">
                  No star rating matching filter found.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredFeedback.map((feed) => (
                    <div 
                      key={feed.id}
                      className="p-3.5 bg-white border border-slate-250 rounded-xl flex flex-col sm:flex-row justify-between gap-3 text-xs leading-normal font-medium"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex text-amber-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-3 w-3 ${i < feed.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                              />
                            ))}
                          </div>
                          <span className="text-[9px] font-mono text-slate-450">{feed.created_at}</span>
                        </div>
                        <p className="text-[11px] text-slate-700">
                          &quot;{feed.chat_message}&quot;
                        </p>
                        {feed.comment && (
                          <div className="p-2.5 bg-slate-50 rounded-lg text-[10px] text-slate-600 font-bold border border-slate-200 mt-2 shadow-sm">
                            Feedback Comment: &quot;{feed.comment}&quot;
                          </div>
                        )}
                      </div>
                      
                      <div className="shrink-0 mt-1 sm:mt-0">
                        <span className="text-[9px] text-sky-600 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          CHAT ID: {feed.id}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
