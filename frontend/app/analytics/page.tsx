'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  TrendingUp, 
  Star, 
  MessageSquare, 
  ShieldAlert, 
  MessageCircle,
  Clock,
  ChevronRight,
  Filter
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import Sidebar from '../../components/Sidebar';
import { api } from '../../services/api';

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');

  // Avoid hydration mismatch for Recharts
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: analytics, isLoading, isError } = useQuery({
    queryKey: ['analyticsData'],
    queryFn: api.getAnalytics,
    refetchInterval: 10000, // Refetch every 10s
  });

  if (!mounted) {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 animate-pulse" />
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

  // Filter feedback
  const feedbacks = analytics?.recent_feedback ?? [
    { id: 1, rating: 5, comment: 'Amazing! Answered my question about setup instantly.', chat_message: 'How do I run this app locally?', created_at: '2026-05-22 14:10' },
    { id: 2, rating: 4, comment: 'Gave a helpful summary of billing.', chat_message: 'What are the pricing tiers?', created_at: '2026-05-22 13:45' },
    { id: 3, rating: 2, comment: 'Did not understand what I meant by API integration.', chat_message: 'Can you show me your API routers code?', created_at: '2026-05-22 11:22' },
  ];

  const filteredFeedbacks = feedbacks.filter(f => {
    if (ratingFilter === 'all') return true;
    return f.rating === ratingFilter;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main content pane */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10">
        
        {/* Title Header */}
        <div className="pb-6 mb-8 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <BarChart3 className="h-7 w-7 text-indigo-500" />
              <span>Performance Analytics</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Track support ratings, review user queries, and analyze chatbot traffic metrics.
            </p>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/40 dark:border-slate-700/50">
            <Clock className="h-3.5 w-3.5" />
            <span>Updated real-time</span>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Detailed metrics card */}
          <div className="lg:col-span-1 space-y-5">
            
            {/* Satisfaction Rate Card */}
            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Customer Satisfaction</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {isLoading ? '...' : `${analytics?.satisfaction_rate ?? 94.2}%`}
                </span>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> +2.1%
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`h-4 w-4 ${star <= (analytics?.avg_rating ?? 4.5) ? 'text-amber-500 fill-amber-500' : 'text-slate-200 dark:text-slate-800'}`} />
                ))}
                <span className="text-xs text-slate-400 font-semibold ml-1">
                  ({analytics?.avg_rating ?? 4.5} / 5 avg)
                </span>
              </div>
            </div>

            {/* Chat volume metric Card */}
            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Chat Interactions</span>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
                {isLoading ? '...' : analytics?.total_chats ?? 142}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Total queries answered by SupportIQ agent since startup.
              </p>
            </div>

            {/* Ingestion stats */}
            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Review Flags</span>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs font-semibold text-slate-500">Unresolved Queries:</span>
                <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {isLoading ? '...' : analytics?.unresolved_queries ?? 3}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2.5">
                <span className="text-xs font-semibold text-slate-500">Feedback Responses:</span>
                <span className="text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  {isLoading ? '...' : analytics?.feedback_count ?? 32}
                </span>
              </div>
            </div>

          </div>

          {/* Chart Card */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-indigo-500" />
                <span>Chat Activity Volume</span>
              </h2>
              <p className="text-[11px] text-slate-400 mb-6">
                Aggregate count of user queries handled per day.
              </p>
            </div>
            
            {/* Chart Container */}
            <div className="h-56 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.06)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15,23,42,0.95)', 
                      borderColor: 'rgba(255,255,255,0.1)',
                      color: '#ffffff',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }} 
                  />
                  <Bar dataKey="count" fill="url(#colorBar)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.85}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Customer Feedbacks Logs Section */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Customer Feedback Logs</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Filter ratings and read review descriptions.</p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg text-xs focus:outline-none"
              >
                <option value="all">All Stars</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </div>

          {/* Feedback table/list */}
          <div className="overflow-x-auto">
            {filteredFeedbacks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                No feedback reviews matching selection.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800/80">
                    <th className="pb-3 font-semibold">User Query</th>
                    <th className="pb-3 font-semibold">Rating</th>
                    <th className="pb-3 font-semibold">Review Comment</th>
                    <th className="pb-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredFeedbacks.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="py-4 pr-4 max-w-xs truncate font-medium text-slate-900 dark:text-white">
                        {f.chat_message}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3 w-3 ${i < f.rating ? 'fill-amber-500' : 'text-slate-200 dark:text-slate-800'}`} 
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-4 pr-4 max-w-sm text-slate-500 dark:text-slate-400 italic">
                        {f.comment || '—'}
                      </td>
                      <td className="py-4 text-slate-400 text-[10px]">
                        {f.created_at}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
