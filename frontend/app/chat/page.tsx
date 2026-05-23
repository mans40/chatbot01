'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  PlusCircle, 
  Star, 
  Check, 
  Copy,
  Loader2,
  RefreshCw,
  Clock,
  MessageSquare,
  Sparkles,
  Trash2
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { api } from '../../services/api';

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50/50 font-mono text-[11px] leading-relaxed shadow-sm">
      <div className="px-4 py-2 border-b border-slate-200 bg-slate-100 flex justify-between items-center text-slate-550 font-sans font-bold text-[10px]">
        <span>{language.toUpperCase()}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-slate-700 no-scrollbar">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; id?: number }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  
  const [ratedChats, setRatedChats] = useState<Record<number, number>>({});
  const [copiedMessageId, setCopiedMessageId] = useState<number | string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Authenticate validation check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('user_authenticated');
      if (auth !== 'true') {
        router.push('/login');
      }
    }
  }, [router]);

  // Fetch historical sessions
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ['chatSessions'],
    queryFn: api.getSessions,
  });

  // Load active session ID from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSessionId = localStorage.getItem('activeSessionId');
      if (savedSessionId) {
        setActiveSessionId(savedSessionId);
      }
    }
  }, []);

  // Save active session ID to localStorage
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem('activeSessionId', activeSessionId);
    }
  }, [activeSessionId]);

  // Automatically start or load sessions
  useEffect(() => {
    if (sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].session_id);
    } else if (sessions.length === 0 && !activeSessionId) {
      startNewSession();
    }
  }, [sessions, activeSessionId]);

  // Load chat history for active session
  useEffect(() => {
    if (!activeSessionId) return;
    
    const fetchHistory = async () => {
      try {
        const history = await api.getHistory(activeSessionId);
        const formatted = history.flatMap(chat => [
          { role: 'user' as const, content: chat.message },
          { role: 'assistant' as const, content: chat.response, id: chat.id }
        ]);
        setMessages(formatted);
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };
    
    fetchHistory();
  }, [activeSessionId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, isStreaming]);

  // Textarea autosize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputMessage]);

  const startNewSession = () => {
    const newId = `session_${Date.now()}`;
    setActiveSessionId(newId);
    setMessages([]);
    setInputMessage('');
    setIsStreaming(false);
    setStreamingContent('');
    setActiveChatId(null);
  };

  const deleteSessionMutation = useMutation({
    mutationFn: api.deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      startNewSession();
    }
  });

  const handleDeleteSession = () => {
    if (activeSessionId && sessions.find(s => s.session_id === activeSessionId)) {
      if (confirm('Are you sure you want to delete this chat session?')) {
        deleteSessionMutation.mutate(activeSessionId);
      }
    } else {
      startNewSession();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isStreaming) return;

    const userQuery = inputMessage;
    setInputMessage('');
    
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setIsStreaming(true);
    setStreamingContent('');
    setActiveChatId(null);

    let accumulatedContent = '';
    let detectedChatId: number | null = null;

    try {
      await api.chatStream(
        activeSessionId,
        userQuery,
        (token) => {
          accumulatedContent += token;
          setStreamingContent(accumulatedContent);
        },
        (chatId) => {
          detectedChatId = chatId;
          setActiveChatId(chatId);
        },
        (error) => {
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: `⚠️ **Connection Error**: ${error.message || 'Unable to communicate with assistant.'}` }
          ]);
          setIsStreaming(false);
        }
      );

      if (accumulatedContent.trim()) {
        setMessages(prev => [
          ...prev,
          { 
            role: 'assistant', 
            content: accumulatedContent, 
            id: detectedChatId || undefined 
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStreamingContent('');
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleCopyMessage = (content: string, id: number | string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleRetryMessage = async (index: number) => {
    if (isStreaming) return;
    if (index > 0 && messages[index - 1].role === 'user') {
      const userMessageText = messages[index - 1].content;
      setMessages(prev => prev.slice(0, index));
      setIsStreaming(true);
      setStreamingContent('');
      setActiveChatId(null);

      let accumulatedContent = '';
      let detectedChatId: number | null = null;

      try {
        await api.chatStream(
          activeSessionId,
          userMessageText,
          (token) => {
            accumulatedContent += token;
            setStreamingContent(accumulatedContent);
          },
          (chatId) => {
            detectedChatId = chatId;
            setActiveChatId(chatId);
          },
          (error) => {
            setMessages(prev => [
              ...prev,
              { role: 'assistant', content: `⚠️ **Connection Error**: ${error.message || 'Unable to communicate with assistant.'}` }
            ]);
            setIsStreaming(false);
          }
        );

        if (accumulatedContent.trim()) {
          setMessages(prev => [
            ...prev,
            { 
              role: 'assistant', 
              content: accumulatedContent, 
              id: detectedChatId || undefined 
            }
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setStreamingContent('');
        setIsStreaming(false);
        queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      }
    }
  };

  const submitFeedbackMutation = useMutation({
    mutationFn: api.submitFeedback,
    onSuccess: (data) => {
      setRatedChats(prev => ({ ...prev, [data.chat_id]: data.rating }));
      queryClient.invalidateQueries({ queryKey: ['analyticsData'] });
    }
  });

  const handleRate = (chatId: number, rating: number) => {
    submitFeedbackMutation.mutate({ chat_id: chatId, rating });
  };

  // Custom renderer for markdown/paragraphs
  const formatMessageContent = (text: string) => {
    if (!text) return null;

    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, idx) => {
      if (part.startsWith('```')) {
        const lines = part.split('\n');
        const lang = lines[0].replace('```', '').trim() || 'code';
        const code = lines.slice(1, -1).join('\n');
        
        return <CodeBlock key={idx} language={lang} code={code} />;
      }

      const lineParts = part.split('\n').map((line, lIdx) => {
        let cleanLine = line;
        
        if (cleanLine.startsWith('### ')) {
          return <h4 key={lIdx} className="text-xs font-black text-slate-900 mt-4 mb-2 font-display uppercase tracking-wider">{cleanLine.replace('### ', '')}</h4>;
        }
        if (cleanLine.startsWith('## ')) {
          return <h3 key={lIdx} className="text-sm font-black text-slate-900 mt-5 mb-2 font-display uppercase tracking-wider">{cleanLine.replace('## ', '')}</h3>;
        }
        if (cleanLine.startsWith('# ')) {
          return <h2 key={lIdx} className="text-base font-black text-slate-900 mt-6 mb-3 font-display uppercase tracking-wider">{cleanLine.replace('# ', '')}</h2>;
        }

        const boldRegex = /\*\*(.*?)\*\*/g;
        let formattedLine: React.ReactNode = cleanLine;
        
        if (boldRegex.test(cleanLine)) {
          const words = cleanLine.split(/(\*\*.*?\*\*)/g);
          formattedLine = words.map((w, wIdx) => {
            if (w.startsWith('**') && w.endsWith('**')) {
              return <strong key={wIdx} className="font-extrabold text-sky-600">{w.replace(/\*\*/g, '')}</strong>;
            }
            return w;
          });
        }

        if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
          return (
            <li key={lIdx} className="list-disc ml-5 pl-1 my-1.5 text-slate-650 text-[11px] leading-relaxed font-medium">
              {formattedLine}
            </li>
          );
        }

        return cleanLine.trim() ? (
          <p key={lIdx} className="text-slate-600 text-[11px] leading-relaxed my-2 font-medium">
            {formattedLine}
          </p>
        ) : <div key={lIdx} className="h-2" />;
      });

      return <div key={idx}>{lineParts}</div>;
    });
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-white text-slate-800">
      
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main chat layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left inner Sidebar: Recent threads sessions */}
        <aside className="w-full md:w-60 border-b md:border-r md:border-b-0 border-sky-100 bg-slate-50/50 backdrop-blur-md hidden md:flex flex-col justify-between shrink-0">
          <div className="flex flex-col flex-1 overflow-hidden">
            
            {/* Header */}
            <div className="p-4 border-b border-sky-100 flex justify-between items-center shrink-0">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 flex items-center gap-1.5 font-display">
                <Clock className="h-3.5 w-3.5 text-sky-500" /> Recent Threads
              </span>
              <button
                onClick={startNewSession}
                className="p-1.5 rounded-lg text-sky-500 hover:text-sky-600 hover:bg-slate-100 cursor-pointer transition-colors"
                title="Create New Thread"
              >
                <PlusCircle className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
              {isLoadingSessions ? (
                <div className="p-4 text-center text-[10px] text-slate-450">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2 text-sky-500" /> Loading...
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-4 text-center text-[10px] text-slate-400 italic font-medium">No active sessions.</div>
              ) : (
                sessions.map((sess) => {
                  const isActive = sess.session_id === activeSessionId;
                  return (
                    <button
                      key={sess.session_id}
                      onClick={() => setActiveSessionId(sess.session_id)}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-[11px] font-bold text-left transition-all duration-150 group relative cursor-pointer ${
                        isActive 
                          ? 'text-sky-600 font-extrabold shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeSessionBg"
                          className="absolute inset-0 bg-sky-50 border border-sky-100 rounded-xl"
                          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                        />
                      )}
                      <MessageSquare className={`h-4.5 w-4.5 relative z-10 shrink-0 ${isActive ? 'text-sky-500' : 'text-slate-450 group-hover:text-slate-650'}`} />
                      <span className="truncate relative z-10">{sess.title || 'Untitled Session'}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* Chat Feed Panel */}
        <section className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-50/20 relative">
          
          {/* Feed Header */}
          <div className="px-4 md:px-6 py-4 border-b border-sky-100 bg-white/85 backdrop-blur-md flex justify-between items-center shrink-0 shadow-sm">
            <div className="flex items-center gap-3">

              <div>
                <span className="font-display font-extrabold text-xs text-slate-900 block tracking-wider">AuraChat Console</span>
                <span className="text-[9px] font-extrabold text-sky-600 flex items-center gap-1 mt-0.5 tracking-widest uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-ping" /> SECURE LOCAL RAG
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleDeleteSession}
                className="p-2 text-rose-500 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-xl cursor-pointer transition-colors flex items-center gap-2"
                title="Delete Chat"
              >
                <Trash2 className="h-4 w-4 md:h-4.5 md:w-4.5" />
                <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider">Delete</span>
              </button>
              <button 
                onClick={startNewSession}
                className="p-2 text-sky-500 bg-sky-50 border border-sky-100 hover:bg-sky-100 rounded-xl cursor-pointer transition-colors flex items-center gap-2"
                title="New Chat"
              >
                <PlusCircle className="h-4 w-4 md:h-4.5 md:w-4.5" />
                <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider">New</span>
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:p-8 space-y-6 no-scrollbar bg-white">
            {messages.length === 0 && !isStreaming ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5">

                <div>
                  <h3 className="font-display font-extrabold text-sm text-slate-900 tracking-wider uppercase">Welcome to AuraChat AI</h3>
                  <p className="text-[11px] text-slate-500 max-w-sm mt-2 leading-relaxed font-medium">
                    Hello! Ask me support questions. You can upload product PDF manuals under 'Document RAG' in the sidebar to supply active vector knowledge context.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div 
                      key={index} 
                      className={`flex gap-3.5 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      {/* Avatar */}
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                        isUser 
                          ? 'bg-slate-100 border border-slate-200 text-slate-600' 
                          : 'bg-sky-500 text-white text-[10px] font-bold'
                      }`}>
                        {isUser ? <User className="h-4 w-4" /> : <span>AI</span>}
                      </div>

                      {/* Bubble */}
                      <div className="space-y-1">
                        <div className={`p-4 rounded-2xl text-xs border leading-relaxed ${
                          isUser 
                            ? 'bg-sky-500 border-sky-400 text-white rounded-tr-none shadow-md' 
                            : 'bg-slate-50 border-slate-150 text-slate-800 rounded-tl-none shadow-sm'
                        }`}>
                          {formatMessageContent(msg.content)}
                        </div>

                        {/* Actions (Copy, Retry, and Rating) */}
                        {!isUser && (
                          <div className="flex items-center gap-4 mt-1.5 px-1 text-slate-450 font-bold">
                            
                            {/* Copy button */}
                            <button
                              onClick={() => handleCopyMessage(msg.content, msg.id || index)}
                              className="flex items-center gap-1 text-[10px] hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
                            >
                              {copiedMessageId === (msg.id || index) ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-600" />
                                  <span className="text-emerald-600 font-extrabold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            {/* Retry button */}
                            {index > 0 && messages[index - 1].role === 'user' && (
                              <button
                                onClick={() => handleRetryMessage(index)}
                                disabled={isStreaming}
                                className="flex items-center gap-1 text-[10px] hover:text-slate-700 disabled:opacity-50 transition-colors focus:outline-none cursor-pointer"
                                title="Retry response"
                              >
                                <RefreshCw className={`h-3 w-3 ${isStreaming ? 'animate-spin' : ''}`} />
                                <span>Retry</span>
                              </button>
                            )}

                            {/* Rating block */}
                            {msg.id && (
                              <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                                <span className="text-[10px] text-slate-400">Helpful?</span>
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => {
                                    const currentRating = ratedChats[msg.id!];
                                    const isRated = currentRating !== undefined;
                                    return (
                                      <button
                                        key={star}
                                        disabled={isRated}
                                        onClick={() => handleRate(msg.id!, star)}
                                        className={`p-0.5 rounded focus:outline-none transition-colors duration-150 ${
                                          isRated 
                                            ? star <= currentRating 
                                              ? 'text-amber-400' 
                                              : 'text-slate-100'
                                            : 'text-slate-250 hover:text-amber-400'
                                        }`}
                                      >
                                        <Star className={`h-3.5 w-3.5 ${isRated && star <= currentRating ? 'fill-amber-400' : ''}`} />
                                      </button>
                                    );
                                  })}
                                </div>
                                {ratedChats[msg.id!] !== undefined && (
                                  <span className="text-[9px] text-emerald-600 font-extrabold flex items-center gap-0.5 ml-1">
                                    <Check className="h-3 w-3" /> Submitted
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Streaming bubble */}
                {isStreaming && streamingContent && (
                  <div className="flex gap-3.5 max-w-[85%] mr-auto">
                    <div className="h-8 w-8 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm">
                      <span>AI</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none text-xs text-slate-800 shadow-sm border border-slate-150 leading-relaxed">
                      {formatMessageContent(streamingContent)}
                    </div>
                  </div>
                )}

                {/* Empty Streaming Loading state */}
                {isStreaming && !streamingContent && (
                  <div className="flex gap-3.5 mr-auto items-center">
                    <div className="h-8 w-8 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm animate-bounce">
                      <span>AI</span>
                    </div>
                    <div className="bg-slate-50 py-3 px-4 rounded-2xl rounded-tl-none flex items-center gap-1 border border-slate-150 shadow-sm">
                      <span className="h-1.5 w-1.5 bg-sky-400 rounded-full typing-dot" />
                      <span className="h-1.5 w-1.5 bg-sky-400 rounded-full typing-dot" />
                      <span className="h-1.5 w-1.5 bg-sky-400 rounded-full typing-dot" />
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Panel */}
          <div className="p-4 md:p-6 border-t border-sky-100 bg-white shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-3.5 max-w-4xl mx-auto items-end relative">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-2 flex items-end shadow-inner focus-within:border-sky-500/50 focus-within:ring-1 focus-within:ring-sky-500/20 transition-all">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask support details (e.g. installation guides)..."
                  rows={1}
                  disabled={isStreaming}
                  className="flex-1 max-h-[180px] min-h-[36px] bg-transparent text-slate-800 text-xs px-3.5 py-2.5 focus:outline-none resize-none align-bottom leading-relaxed no-scrollbar font-medium"
                />
              </div>
              
              <button
                type="submit"
                disabled={!inputMessage.trim() || isStreaming}
                className="p-3.5 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl transition-all duration-200 shadow-md shadow-sky-500/10 cursor-pointer flex items-center justify-center shrink-0 hover:scale-105"
              >
                {isStreaming ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <Send className="h-4.5 w-4.5" />
                )}
              </button>
            </form>
          </div>

        </section>

      </div>
    </div>
  );
}
