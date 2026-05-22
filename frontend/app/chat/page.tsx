'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Send, 
  Bot, 
  User, 
  PlusCircle, 
  Trash2, 
  Star, 
  Check, 
  Copy,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { api, ChatMessage, ChatSession } from '../../services/api';

export default function ChatPage() {
  const queryClient = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; id?: number }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [activeChatId, setActiveChatId] = useState<number | null>(null); // DB Chat ID for the latest message
  
  // Feedback states
  const [ratedChats, setRatedChats] = useState<Record<number, number>>({}); // map of chat_id -> rating
  const [feedbackComment, setFeedbackComment] = useState('');
  const [activeFeedbackChatId, setActiveFeedbackChatId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch historical sessions
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ['chatSessions'],
    queryFn: api.getSessions,
  });

  // Automatically start a new session or load the most recent session
  useEffect(() => {
    if (sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].session_id);
    } else if (sessions.length === 0 && !activeSessionId) {
      startNewSession();
    }
  }, [sessions, activeSessionId]);

  // Load chat history for the active session
  useEffect(() => {
    if (!activeSessionId) return;

    const loadHistory = async () => {
      try {
        const history = await api.getHistory(activeSessionId);
        const formatted: Array<{ role: 'user' | 'assistant'; content: string; id?: number }> = [];
        history.forEach(item => {
          formatted.push({ role: 'user', content: item.message });
          formatted.push({ role: 'assistant', content: item.response, id: item.id });
        });
        setMessages(formatted);
      } catch (err) {
        console.error('Error loading history:', err);
      }
    };

    loadHistory();
    setStreamingContent('');
    setActiveChatId(null);
  }, [activeSessionId]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, isStreaming]);

  // Auto-grow input textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputMessage]);

  const startNewSession = () => {
    const newId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setActiveSessionId(newId);
    setMessages([]);
    setStreamingContent('');
    setActiveChatId(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isStreaming || !activeSessionId) return;

    const userMessageText = inputMessage;
    setInputMessage('');
    
    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: userMessageText }]);
    setIsStreaming(true);
    setStreamingContent('');
    setActiveChatId(null);

    // Call API and stream
    await api.chatStream(
      activeSessionId,
      userMessageText,
      (token) => {
        setStreamingContent(prev => prev + token);
      },
      (chatId) => {
        setActiveChatId(chatId);
      },
      (error) => {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `⚠️ **Connection Error**: ${error.message || 'Unable to communicate with assistant. Check if backend is running.'}` }
        ]);
        setIsStreaming(false);
      }
    );

    // Once done streaming, append the completed response to messages list
    setMessages(prev => {
      const updated = [...prev];
      if (streamingContent || isStreaming) {
        updated.push({ 
          role: 'assistant', 
          content: streamingContent, 
          id: activeChatId || undefined 
        });
      }
      return updated;
    });
    
    setStreamingContent('');
    setIsStreaming(false);
    
    // Refresh sessions sidebar to update titles/timestamps
    queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Submit Feedback
  const submitFeedbackMutation = useMutation({
    mutationFn: api.submitFeedback,
    onSuccess: (data) => {
      setRatedChats(prev => ({ ...prev, [data.chat_id]: data.rating }));
      setActiveFeedbackChatId(null);
      setFeedbackComment('');
      queryClient.invalidateQueries({ queryKey: ['analyticsData'] });
    }
  });

  const handleRate = (chatId: number, rating: number) => {
    setActiveFeedbackChatId(chatId);
    // Auto submit if no comment is typed yet, or prompt comment
    submitFeedbackMutation.mutate({ chat_id: chatId, rating });
  };

  // Custom renderer for code blocks and basic markdown elements
  const formatMessageContent = (text: string) => {
    if (!text) return null;

    // Split text into code blocks and standard paragraphs
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, idx) => {
      if (part.startsWith('```')) {
        // Extract language and code
        const lines = part.split('\n');
        const lang = lines[0].replace('```', '').trim() || 'code';
        const code = lines.slice(1, -1).join('\n');
        
        return <CodeBlock key={idx} language={lang} code={code} />;
      }

      // Format basic markdown tags: Bold (**text**), List items (- item), Linebreaks
      const lineParts = part.split('\n').map((line, lIdx) => {
        let cleanLine = line;
        
        // Handle headers
        if (cleanLine.startsWith('### ')) {
          return <h4 key={lIdx} className="text-sm font-bold mt-3 mb-1.5 text-slate-900 dark:text-white">{cleanLine.substring(4)}</h4>;
        }
        if (cleanLine.startsWith('## ')) {
          return <h3 key={lIdx} className="text-base font-extrabold mt-4 mb-2 text-slate-900 dark:text-white">{cleanLine.substring(3)}</h3>;
        }

        // Handle bullet lists
        if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
          const content = parseInlineMarkdown(cleanLine.substring(2));
          return <li key={lIdx} className="ml-4 list-disc text-xs leading-relaxed my-1">{content}</li>;
        }

        // Handle numeric lists
        if (/^\d+\.\s/.test(cleanLine)) {
          const content = parseInlineMarkdown(cleanLine.replace(/^\d+\.\s/, ''));
          return <li key={lIdx} className="ml-4 list-decimal text-xs leading-relaxed my-1">{content}</li>;
        }

        // Regular line
        if (!cleanLine.trim()) return <div key={lIdx} className="h-2" />;
        return <p key={lIdx} className="text-xs leading-relaxed my-1.5">{parseInlineMarkdown(cleanLine)}</p>;
      });

      return <div key={idx}>{lineParts}</div>;
    });
  };

  const parseInlineMarkdown = (text: string) => {
    // Bold matching
    const boldParts = text.split(/(\*\*.*?\*\*)/g);
    return boldParts.map((bPart, bIdx) => {
      if (bPart.startsWith('**') && bPart.endsWith('**')) {
        return <strong key={bIdx} className="font-extrabold text-slate-950 dark:text-white">{bPart.slice(2, -2)}</strong>;
      }
      
      // Inline code matching
      const codeParts = bPart.split(/(`.*?`)/g);
      return codeParts.map((cPart, cIdx) => {
        if (cPart.startsWith('`') && cPart.endsWith('`')) {
          return <code key={cIdx} className="bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 px-1 py-0.5 rounded text-[11px] font-mono text-indigo-500">{cPart.slice(1, -1)}</code>;
        }
        return cPart;
      });
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      
      {/* Persisted Sidebar Navigation */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Chat Sessions Sidebar (Local Sidebar for Chat Page) */}
        <aside className="hidden md:flex flex-col w-64 border-r border-slate-200/60 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80">
            <button
              onClick={startNewSession}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 rounded-xl text-xs font-bold hover:bg-indigo-100/60 dark:hover:bg-indigo-900/30 transition-all duration-200 cursor-pointer"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              <span>New Session</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
            <span className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
              Recent Conversations
            </span>
            {isLoadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs italic">
                No history. Start chatting!
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.session_id}
                  onClick={() => setActiveSessionId(session.session_id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left text-xs transition-all duration-200 ${
                    activeSessionId === session.session_id
                      ? 'bg-slate-100 dark:bg-slate-800/80 font-semibold text-slate-900 dark:text-white border-l-2 border-indigo-500'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">{session.title || 'Support Query'}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Chat Feed Panel */}
        <section className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-50/30 dark:bg-slate-950/20">
          
          {/* Feed Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/85 bg-white dark:bg-slate-900 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm animate-pulse-slow">
                <Bot className="h-5.5 w-5.5" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white block">AuraChat Agent</span>
                <span className="text-[10px] font-medium text-emerald-500 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" /> Online & Ingested
                </span>
              </div>
            </div>
            
            <button 
              onClick={startNewSession}
              className="md:hidden p-2 text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-850/50 rounded-xl"
            >
              <PlusCircle className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:p-6 space-y-6">
            {messages.length === 0 && !isStreaming ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="p-4 bg-indigo-500/5 dark:bg-indigo-400/5 border border-indigo-500/10 rounded-3xl text-indigo-600 dark:text-indigo-400 animate-bounce">
                  <Bot className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white">Ask AuraChat AI</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                    Hello! Ask me any questions. You can upload files in Settings to supply custom product details and reference RAG context.
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
                      className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      {/* Avatar */}
                      <div className={`h-8.5 w-8.5 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${
                        isUser 
                          ? 'bg-slate-100 border-slate-200/60 dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300' 
                          : 'bg-indigo-600 border-indigo-500 text-white'
                      }`}>
                        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4.5 w-4.5" />}
                      </div>

                      {/* Bubble */}
                      <div className="space-y-1">
                        <div className={`p-4 rounded-2xl text-xs shadow-sm border ${
                          isUser 
                            ? 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none' 
                            : 'glass-panel text-slate-800 dark:text-slate-100 rounded-tl-none'
                        }`}>
                          {formatMessageContent(msg.content)}
                        </div>

                        {/* Rating block (only for assistant and only if message has database id) */}
                        {!isUser && msg.id && (
                          <div className="flex items-center gap-2.5 mt-1.5 px-1">
                            <span className="text-[10px] text-slate-400 font-semibold">Helpful?</span>
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
                                          ? 'text-amber-500' 
                                          : 'text-slate-200 dark:text-slate-800'
                                        : 'text-slate-300 hover:text-amber-400 dark:text-slate-700'
                                    }`}
                                  >
                                    <Star className={`h-3.5 w-3.5 ${isRated && star <= currentRating ? 'fill-amber-500' : ''}`} />
                                  </button>
                                );
                              })}
                            </div>
                            {ratedChats[msg.id!] !== undefined && (
                              <span className="text-[9px] text-emerald-500 font-bold flex items-center gap-0.5">
                                <Check className="h-3 w-3" /> Submitted
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Streaming Response bubble */}
                {isStreaming && streamingContent && (
                  <div className="flex gap-3 max-w-[85%] mr-auto">
                    <div className="h-8.5 w-8.5 rounded-xl bg-indigo-600 border border-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Bot className="h-4.5 w-4.5" />
                    </div>
                    <div className="glass-panel p-4 rounded-2xl rounded-tl-none text-xs text-slate-800 dark:text-slate-100 shadow-sm border">
                      {formatMessageContent(streamingContent)}
                    </div>
                  </div>
                )}

                {/* Empty Streaming Loading state */}
                {isStreaming && !streamingContent && (
                  <div className="flex gap-3 mr-auto items-center">
                    <div className="h-8.5 w-8.5 rounded-xl bg-indigo-600 border border-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                      <Bot className="h-4.5 w-4.5" />
                    </div>
                    <div className="glass-panel py-3 px-4 rounded-2xl rounded-tl-none flex items-center gap-1 border">
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full typing-dot" />
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full typing-dot" />
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full typing-dot" />
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Panel */}
          <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto items-end relative">
              <div className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-2 flex items-end">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask support details (e.g. installation guides)..."
                  rows={1}
                  disabled={isStreaming}
                  className="flex-1 max-h-[180px] min-h-[36px] bg-transparent text-slate-900 dark:text-white text-xs px-3.5 py-2.5 focus:outline-none resize-none align-bottom leading-relaxed"
                />
              </div>
              
              <button
                type="submit"
                disabled={!inputMessage.trim() || isStreaming}
                className="p-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-650 text-white rounded-2xl shadow-md shadow-indigo-600/10 dark:shadow-indigo-900/10 transition-all duration-150 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </div>

        </section>
      </div>
    </div>
  );
}

// Code Block Component with Copy to Clipboard Button
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 border border-slate-200/60 dark:border-slate-850 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100/80 dark:bg-slate-900/90 text-slate-400 border-b border-slate-200/50 dark:border-slate-850/80 text-[10px] font-mono select-none">
        <span>{language.toLowerCase()}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-white transition-colors focus:outline-none cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-bold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 bg-slate-950 text-slate-100 font-mono text-[11px] overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
