'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Shield, 
  Database, 
  Sparkles, 
  FileText,
  ChevronRight,
  LineChart,
  MessageCircle,
  Activity,
  Cpu,
  CheckCircle2,
  Send,
  Zap,
  Globe,
  Terminal
} from 'lucide-react';

export default function LandingPage() {
  const [chatMessage, setChatMessage] = useState('');
  const [simulatedChats, setSimulatedChats] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hello! I am AuraChat. Ask me anything about your product, installation guides, or billing procedures.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'indexing' | 'performance'>('chat');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  // Auto typing simulator for chat preview
  useEffect(() => {
    const timer = setTimeout(() => {
      setSimulatedChats(prev => [
        ...prev,
        { role: 'user', content: 'How do refunds work?' }
      ]);
      setIsTyping(true);
      
      setTimeout(() => {
        setSimulatedChats(prev => [
          ...prev,
          { role: 'assistant', content: 'Refunds are processed within 5 business days and are automatically returned to your original payment method.' }
        ]);
        setIsTyping(false);
      }, 1400);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleSimulateChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setSimulatedChats(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatMessage('');
    setIsTyping(true);

    setTimeout(() => {
      let botResponse = "That is a brilliant query! Our local RAG engine parses uploaded manuals, matches embeddings, and answers contextually.";
      
      if (userMsg.toLowerCase().includes('refund')) {
        botResponse = "Refunds are processed within 5 business days and are automatically returned to your original payment method.";
      } else if (userMsg.toLowerCase().includes('pdf') || userMsg.toLowerCase().includes('doc')) {
        botResponse = "Yes! You can upload and index multiple manuals under the 'Document RAG' panel. They are parsed into chunks of 300 words with 30-word overlap.";
      }

      setSimulatedChats(prev => [...prev, { role: 'assistant', content: botResponse }]);
      setIsTyping(false);
    }, 1100);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSuccess(true);
    setNewsletterEmail('');
    setTimeout(() => setNewsletterSuccess(false), 3000);
  };

  const staggerContainer: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05
      }
    }
  };

  const fadeUpVariant: any = {
    hidden: { opacity: 0, y: 35 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: 'spring',
        stiffness: 80,
        damping: 20,
        mass: 1 
      } 
    }
  };

  return (
    <div className="bg-white text-slate-800 min-h-screen overflow-x-hidden relative selection:bg-sky-500/20 selection:text-sky-900">
      
      {/* Vercel-Style Light Dot Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none -z-10 opacity-70" />

      {/* Decorative Elegant Soft Glowing Spheres */}
      <div className="absolute top-[5%] left-[5%] w-[700px] h-[700px] rounded-full bg-sky-200/10 blur-[150px] float-bubble-1 -z-10 pointer-events-none" />
      <div className="absolute top-[35%] right-[0%] w-[650px] h-[650px] rounded-full bg-sky-100/20 blur-[150px] float-bubble-2 -z-10 pointer-events-none" />
      <div className="absolute top-[68%] left-[2%] w-[600px] h-[600px] rounded-full bg-sky-200/10 blur-[140px] float-bubble-1 -z-10 pointer-events-none" />

      {/* STICKY LIQUID GLASS NAVBAR (No Bot Icon Logo) */}
      <div className="w-full max-w-6xl mx-auto px-4 pt-6 sticky top-0 z-50">
        <header className="liquid-glass rounded-[2rem] px-8 py-4 flex items-center justify-between transition-all duration-500 shadow-[0_8px_30px_-12px_rgba(14,165,233,0.1)]">
          <Link href="/" className="font-display font-black text-xl text-slate-900 tracking-wider hover:opacity-80 transition-opacity flex items-center gap-2">
            AuraChat <span className="text-[10px] bg-sky-50 text-sky-600 border border-sky-100/80 px-2.5 py-1 rounded-md font-extrabold tracking-widest uppercase shadow-sm">AI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-10 text-[13px] font-bold text-slate-500">
            <a href="#features" className="hover:text-sky-500 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-sky-500 transition-colors">RAG Pipeline</a>
            <a href="#preview" className="hover:text-sky-500 transition-colors">Live Preview</a>
            <a href="#security" className="hover:text-sky-500 transition-colors">Security</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors px-4 py-2.5 rounded-xl hover:bg-slate-50"
            >
              Sign In
            </Link>
            <Link 
              href="/chat" 
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-sky-500 hover:bg-sky-600 text-white text-[13px] font-bold rounded-2xl transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(14,165,233,0.4)] hover:shadow-[0_8px_25px_-6px_rgba(14,165,233,0.5)] hover:-translate-y-0.5 flex items-center gap-2"
            >
              <span className="hidden sm:inline">Launch Console</span>
              <span className="sm:hidden">Launch</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>
      </div>

      {/* STRIPE-STYLE HERO SECTION (Responsive & High-Fidelity Mockup) */}
      <section className="max-w-6xl mx-auto px-6 pt-24 lg:pt-32 pb-24 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Hero text */}
          <div className="lg:col-span-6 space-y-10 text-left">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-sky-50 border border-sky-100 text-sky-600 text-[11px] font-extrabold tracking-widest uppercase shadow-sm"
            >
              <Sparkles className="h-4 w-4 text-sky-500" />
              <span>100% Local RAG Assistant</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl sm:text-7xl font-display font-black tracking-tight text-slate-900 leading-[1.08]"
            >
              Document AI for Customer Support
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg text-slate-500 leading-relaxed font-medium max-w-lg"
            >
              Upload PDF & TXT manuals, index documentation locally via ChromaDB, and stream context-accurate support replies with SQLite session storage.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-center gap-5 pt-4"
            >
              <Link
                href="/chat"
                className="w-full sm:w-auto px-8 py-4.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold rounded-2xl transition-all duration-300 shadow-[0_8px_30px_-6px_rgba(14,165,233,0.4)] hover:shadow-[0_12px_40px_-8px_rgba(14,165,233,0.5)] flex items-center justify-center gap-2 hover:-translate-y-1"
              >
                <span>Launch Chat Console</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
              <Link
                href="/documents"
                className="w-full sm:w-auto px-8 py-4.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-2xl transition-all duration-300 shadow-sm flex items-center justify-center gap-2 hover:-translate-y-1"
              >
                <FileText className="h-4.5 w-4.5 text-sky-500" />
                <span>Upload Support Guides</span>
              </Link>
            </motion.div>
          </div>

          {/* Hero interactive dashboard mock */}
          <div className="lg:col-span-6 relative">
            
            {/* Absolute floating decorations */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, type: "spring" }}
              className="absolute -top-8 -left-8 bg-white/90 backdrop-blur-md border border-sky-100 p-4 rounded-2xl shadow-xl flex items-center gap-3 z-20 animate-pulse-slow"
            >
              <div className="p-2 bg-sky-50 rounded-xl">
                <Cpu className="h-5 w-5 text-sky-500" />
              </div>
              <div className="text-left leading-none">
                <span className="text-[10px] text-slate-400 block font-bold tracking-wider mb-1">EMBEDDING MODEL</span>
                <span className="text-xs text-slate-900 font-black font-mono">all-MiniLM-L6-v2</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8, type: "spring" }}
              className="absolute -bottom-8 -right-8 bg-white/90 backdrop-blur-md border border-sky-100 p-4 rounded-2xl shadow-xl flex items-center gap-3 z-20"
            >
              <div className="p-2 bg-emerald-50 rounded-xl">
                <Database className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="text-left leading-none">
                <span className="text-[10px] text-slate-400 block font-bold tracking-wider mb-1">LOCAL VECTOR DB</span>
                <span className="text-xs text-emerald-600 font-black uppercase">ChromaDB Active</span>
              </div>
            </motion.div>

            {/* Dashboard Mock Shell */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, type: "spring", stiffness: 70, damping: 25 }}
              className="w-full bg-slate-50/60 backdrop-blur-2xl border border-sky-100/80 rounded-[2.5rem] p-5 shadow-[0_20px_60px_-15px_rgba(14,165,233,0.15)] ring-1 ring-white/50 relative overflow-hidden"
            >
              {/* Window controls */}
              <div className="flex items-center justify-between pb-4 border-b border-sky-100/60 mb-5 px-2">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full bg-red-400/80 shadow-sm" />
                  <div className="h-3.5 w-3.5 rounded-full bg-amber-400/80 shadow-sm" />
                  <div className="h-3.5 w-3.5 rounded-full bg-emerald-400/80 shadow-sm" />
                </div>
                <div className="flex gap-1.5 bg-white/90 p-1 rounded-[1rem] border border-sky-100 shadow-sm overflow-x-auto no-scrollbar">
                  <button 
                    onClick={() => setActiveTab('chat')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all duration-300 ${activeTab === 'chat' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                  >
                    Chat Assistant
                  </button>
                  <button 
                    onClick={() => setActiveTab('indexing')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all duration-300 ${activeTab === 'indexing' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                  >
                    Ingestion
                  </button>
                  <button 
                    onClick={() => setActiveTab('performance')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all duration-300 ${activeTab === 'performance' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                  >
                    Performance
                  </button>
                </div>
              </div>

              {/* Window body */}
              <div className="bg-white rounded-[1.5rem] p-5 min-h-[260px] border border-sky-100/60 shadow-sm flex flex-col justify-between">
                
                <AnimatePresence mode="wait">
                  {activeTab === 'chat' && (
                    <motion.div 
                      key="chat"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 flex-1"
                    >
                      <div className="flex gap-4 max-w-[85%] mr-auto">
                        <div className="h-8 w-8 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500 font-bold shrink-0 shadow-sm">AI</div>
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl rounded-tl-none text-[12px] leading-relaxed text-slate-700 shadow-sm">
                          Hello! Ask me queries about your active PDF/TXT guidelines.
                        </div>
                      </div>

                      <div className="flex gap-4 max-w-[85%] ml-auto flex-row-reverse">
                        <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0 shadow-sm">U</div>
                        <div className="bg-sky-500 text-white p-4 rounded-2xl rounded-tr-none text-[12px] leading-relaxed shadow-md shadow-sky-500/20">
                          Explain the system chunk limits.
                        </div>
                      </div>

                      <div className="flex gap-4 max-w-[85%] mr-auto">
                        <div className="h-8 w-8 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500 font-bold shrink-0 shadow-sm">AI</div>
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl rounded-tl-none text-[12px] leading-relaxed text-slate-700 shadow-sm flex flex-col gap-2">
                          <span className="font-extrabold text-sky-600 text-[10px] tracking-wider uppercase">RAG Answer:</span> 
                          <span>Document manuals are chunked into 300-word segments to prevent tokens overflow.</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'indexing' && (
                    <motion.div 
                      key="indexing"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 flex-1"
                    >
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-600 bg-sky-50 px-3 py-1 rounded-md border border-sky-100 inline-block mb-2 shadow-sm">RAG Index Ingestion</span>
                      
                      <div className="p-4 bg-white border border-slate-200 hover:border-sky-200 hover:bg-sky-50/30 transition-all rounded-2xl flex items-center justify-between text-[12px] font-medium text-slate-600 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-sky-50 rounded-lg text-sky-500">
                            <FileText className="h-4.5 w-4.5" />
                          </div>
                          <span className="font-bold text-slate-700">Installation_Guide.pdf</span>
                        </div>
                        <span className="text-[10px] font-extrabold text-sky-600 bg-white border border-sky-100 shadow-sm px-2.5 py-1 rounded-md">
                          32 Chunks
                        </span>
                      </div>

                      <div className="p-4 bg-white border border-slate-200 hover:border-sky-200 hover:bg-sky-50/30 transition-all rounded-2xl flex items-center justify-between text-[12px] font-medium text-slate-600 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-sky-50 rounded-lg text-sky-500">
                            <FileText className="h-4.5 w-4.5" />
                          </div>
                          <span className="font-bold text-slate-700">User_Policy.pdf</span>
                        </div>
                        <span className="text-[10px] font-extrabold text-sky-600 bg-white border border-sky-100 shadow-sm px-2.5 py-1 rounded-md">
                          18 Chunks
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'performance' && (
                    <motion.div 
                      key="performance"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5 flex-1 text-slate-600"
                    >
                      <div className="grid grid-cols-2 gap-5">
                        <div className="p-5 bg-white border border-slate-200 rounded-[1.5rem] text-center shadow-sm hover:border-sky-200 transition-colors">
                          <span className="text-[10px] text-slate-400 block font-bold tracking-widest uppercase">TOTAL CHATS</span>
                          <span className="text-3xl font-display font-black text-slate-900 mt-2 block">542</span>
                        </div>
                        <div className="p-5 bg-white border border-slate-200 rounded-[1.5rem] text-center shadow-sm hover:border-sky-200 transition-colors">
                          <span className="text-[10px] text-slate-400 block font-bold tracking-widest uppercase">ACCURACY INDEX</span>
                          <span className="text-3xl font-display font-black text-sky-500 mt-2 block">99.2%</span>
                        </div>
                      </div>

                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex justify-between items-center text-[11px] font-extrabold text-emerald-700 shadow-sm">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" /> ChromaDB Connected
                        </span>
                        <span className="bg-white px-3 py-1 rounded-lg border border-emerald-100 shadow-sm">0.34s Similarity</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* MODERN SaaS FEATURE GRID (With Scroll Reveal Motion) */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-28 border-t border-slate-100">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-sky-600 bg-sky-50 px-4 py-1.5 rounded-full border border-sky-100 shadow-sm">Platform Capabilities</span>
          <h2 className="text-4xl sm:text-5xl font-display font-black text-slate-900 mt-6 leading-[1.1]">Elite Support Architecture</h2>
          <p className="text-sm text-slate-500 mt-4 font-medium leading-relaxed">All components engineered specifically to handle secure local knowledge retrieval.</p>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          
          <motion.div 
            variants={fadeUpVariant}
            whileHover={{ y: -8, scale: 1.02 }}
            className="liquid-glass p-10 rounded-[2rem] border border-sky-100/50 card-hover-effect relative overflow-hidden group shadow-lg shadow-slate-200/20"
          >
            <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 text-sky-500 inline-flex mb-8 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-sky-100">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display uppercase tracking-wider">Recursive Document Parsing</h3>
            <p className="text-[13px] text-slate-500 mt-4 leading-relaxed font-medium">
              Splits installation manuals or API guidelines into 300-word segments with 30-word overlap boundaries.
            </p>
          </motion.div>

          <motion.div 
            variants={fadeUpVariant}
            whileHover={{ y: -8, scale: 1.02 }}
            className="liquid-glass p-10 rounded-[2rem] border border-sky-100/50 card-hover-effect relative overflow-hidden group shadow-lg shadow-slate-200/20"
          >
            <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 text-sky-500 inline-flex mb-8 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-sky-100">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display uppercase tracking-wider">ChromaDB Embedding Map</h3>
            <p className="text-[13px] text-slate-500 mt-4 leading-relaxed font-medium">
              Maps text arrays mathematically using the active local all-MiniLM-L6-v2 vector indexing algorithm.
            </p>
          </motion.div>

          <motion.div 
            variants={fadeUpVariant}
            whileHover={{ y: -8, scale: 1.02 }}
            className="liquid-glass p-10 rounded-[2rem] border border-sky-100/50 card-hover-effect relative overflow-hidden group shadow-lg shadow-slate-200/20"
          >
            <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 text-sky-500 inline-flex mb-8 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-sky-100">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display uppercase tracking-wider">Secure Local Sandbox</h3>
            <p className="text-[13px] text-slate-500 mt-4 leading-relaxed font-medium">
              Calculates search matches natively. Keeps internal company guides and logs private.
            </p>
          </motion.div>

        </motion.div>
      </section>

      {/* RAG PIPELINE VISUAL WORKFLOW TIMELINE (With Motion Reveal) */}
      <section id="workflow" className="max-w-6xl mx-auto px-6 py-28 border-t border-slate-100">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-sky-600 bg-sky-50 px-4 py-1.5 rounded-full border border-sky-100 shadow-sm">Interactive Pipeline</span>
          <h2 className="text-4xl sm:text-5xl font-display font-black text-slate-900 mt-6 leading-[1.1]">Recursive Retrieval Mapping</h2>
          <p className="text-sm text-slate-500 mt-4 font-medium leading-relaxed">How queries map semantically to local indexed document vectors.</p>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative"
        >
          
          <motion.div variants={fadeUpVariant} className="p-8 bg-white border border-sky-100/60 rounded-[2rem] relative card-hover-effect shadow-md shadow-sky-100/30">
            <span className="text-[11px] font-black tracking-widest text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100 inline-block mb-6 shadow-sm">STEP 01</span>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest font-display">Document Ingestion</h4>
            <p className="text-[13px] text-slate-500 mt-3 leading-relaxed font-medium">Upload corporate product manuals inside the RAG workspace manager.</p>
          </motion.div>

          <motion.div variants={fadeUpVariant} className="p-8 bg-white border border-sky-100/60 rounded-[2rem] relative card-hover-effect shadow-md shadow-sky-100/30">
            <span className="text-[11px] font-black tracking-widest text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100 inline-block mb-6 shadow-sm">STEP 02</span>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest font-display">L2 Embedding Calculations</h4>
            <p className="text-[13px] text-slate-500 mt-3 leading-relaxed font-medium">Chunks undergo dimensional indexing via the local MiniLM neural net.</p>
          </motion.div>

          <motion.div variants={fadeUpVariant} className="p-8 bg-white border border-sky-100/60 rounded-[2rem] relative card-hover-effect shadow-md shadow-sky-100/30">
            <span className="text-[11px] font-black tracking-widest text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100 inline-block mb-6 shadow-sm">STEP 03</span>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest font-display">Proximity search</h4>
            <p className="text-[13px] text-slate-500 mt-3 leading-relaxed font-medium">Queries fetch closest contextual vector matches within a 0.34s timeframe.</p>
          </motion.div>

          <motion.div variants={fadeUpVariant} className="p-8 bg-white border border-sky-100/60 rounded-[2rem] relative card-hover-effect shadow-md shadow-sky-100/30">
            <span className="text-[11px] font-black tracking-widest text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100 inline-block mb-6 shadow-sm">STEP 04</span>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest font-display">Smart context streamer</h4>
            <p className="text-[13px] text-slate-500 mt-3 leading-relaxed font-medium">FastAPI returns a clean answers format with reference document titles.</p>
          </motion.div>

        </motion.div>
      </section>

      {/* LIVE PREVIEW SIMULATOR */}
      <section id="preview" className="max-w-4xl mx-auto px-6 py-28 border-t border-slate-100">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-sky-600 bg-sky-50 px-4 py-1.5 rounded-full border border-sky-100 shadow-sm">Interactive Client</span>
          <h2 className="text-4xl sm:text-5xl font-display font-black text-slate-900 mt-6 leading-[1.1]">Live Preview Simulator</h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-[2rem] overflow-hidden flex flex-col h-[500px] border border-sky-100/80 shadow-[0_20px_50px_-12px_rgba(14,165,233,0.15)] ring-1 ring-sky-100"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-sky-100/80 bg-slate-50/80 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-3.5 rounded-full bg-red-400/80 shadow-sm" />
              <div className="h-3.5 w-3.5 rounded-full bg-amber-400/80 shadow-sm" />
              <div className="h-3.5 w-3.5 rounded-full bg-emerald-400/80 shadow-sm" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 font-display">
              Preview Client Sandbox
            </span>
            <div className="w-14" />
          </div>

          {/* Chats Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-slate-50/30">
            {simulatedChats.map((chat, idx) => (
              <div
                key={idx}
                className={`flex gap-4 max-w-[85%] ${chat.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold shadow-sm ${
                  chat.role === 'user' 
                    ? 'bg-slate-100 border border-slate-200 text-slate-700' 
                    : 'bg-sky-500 text-white shadow-sky-500/30'
                }`}>
                  {chat.role === 'user' ? 'U' : 'AI'}
                </div>
                <div className={`p-5 rounded-3xl text-[13px] leading-relaxed shadow-sm ${
                  chat.role === 'user' 
                    ? 'bg-sky-500 text-white rounded-tr-none shadow-md shadow-sky-500/20' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}>
                  {chat.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-4 mr-auto items-center">
                <div className="h-10 w-10 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/30">
                  <span className="text-[12px] font-bold">AI</span>
                </div>
                <div className="bg-white border border-slate-200 py-4 px-5 rounded-3xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                  <span className="h-2 w-2 bg-sky-400 rounded-full typing-dot" />
                  <span className="h-2 w-2 bg-sky-400 rounded-full typing-dot" />
                  <span className="h-2 w-2 bg-sky-400 rounded-full typing-dot" />
                </div>
              </div>
            )}
          </div>

          {/* Form Input */}
          <form onSubmit={handleSimulateChat} className="p-5 border-t border-sky-100/80 bg-white flex gap-3">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask (e.g. 'How do refunds work?')..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-[1.25rem] px-6 py-4 text-sm text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all font-medium placeholder-slate-400"
            />
            <button
              type="submit"
              className="px-6 py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-[1.25rem] transition-all cursor-pointer shadow-[0_4px_20px_-4px_rgba(14,165,233,0.4)] hover:shadow-[0_8px_25px_-6px_rgba(14,165,233,0.5)] flex items-center justify-center hover:-translate-y-0.5"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        </motion.div>
      </section>

      {/* ULTRA MODERN SAAS FOOTER & NEWSLETTER (Linear / Vercel Grade) */}
      <footer id="security" className="border-t border-slate-200 bg-slate-50 py-24 text-slate-500 text-sm relative overflow-hidden">
        {/* Subtle dot overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />
        
        <div className="max-w-6xl mx-auto px-6 relative z-10 space-y-20">
          
          {/* Top Panel: Newsletter Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="p-10 sm:p-12 bg-white border border-sky-100/80 rounded-[2.5rem] shadow-[0_10px_40px_-10px_rgba(14,165,233,0.1)] flex flex-col md:flex-row justify-between items-center gap-8 ring-1 ring-slate-100"
          >
            <div className="text-left space-y-2 max-w-md">
              <h4 className="text-lg font-black text-slate-900 uppercase tracking-widest font-display">Keep Up to Date</h4>
              <p className="text-[13px] text-slate-500 font-medium leading-relaxed">Subscribe to receive system features updates and security guides.</p>
            </div>
            
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 w-full md:w-auto min-w-0 sm:min-w-[320px]">
              <input
                type="email"
                required
                placeholder="Enter your email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="flex-1 w-full md:w-72 bg-slate-50 border border-slate-200 rounded-[1.25rem] px-5 py-3.5 text-[13px] text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all font-medium placeholder-slate-400"
              />
              <button 
                type="submit" 
                className="px-6 py-3.5 w-full sm:w-auto bg-sky-500 hover:bg-sky-600 text-white rounded-[1.25rem] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_20px_-4px_rgba(14,165,233,0.4)] hover:shadow-[0_8px_25px_-6px_rgba(14,165,233,0.5)] hover:-translate-y-0.5"
              >
                <span>{newsletterSuccess ? 'Subscribed' : 'Subscribe'}</span>
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>

          {/* Middle Panel: Navigation Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            
            <div className="space-y-5 col-span-2 md:col-span-1">
              <span className="font-display font-black text-slate-900 tracking-wider text-xl">AuraChat Suite</span>
              <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                Intelligent local document ingestion, embedding indexing, and secure semantic retrieval sandbox pipeline.
              </p>
            </div>

            <div className="space-y-5">
              <h5 className="font-display font-black text-slate-900 text-[11px] uppercase tracking-widest">Console</h5>
              <ul className="space-y-3 text-[13px] font-bold">
                <li><Link href="/chat" className="hover:text-sky-500 transition-colors">Chat Assistant</Link></li>
                <li><Link href="/documents" className="hover:text-sky-500 transition-colors">Document RAG</Link></li>
                <li><Link href="/analytics" className="hover:text-sky-500 transition-colors">Analytics</Link></li>
                <li><Link href="/settings" className="hover:text-sky-500 transition-colors">Settings</Link></li>
              </ul>
            </div>

            <div className="space-y-5">
              <h5 className="font-display font-black text-slate-900 text-[11px] uppercase tracking-widest">Features</h5>
              <ul className="space-y-3 text-[13px] text-slate-500 font-medium">
                <li>Local Ingestion</li>
                <li>ChromaDB Integration</li>
                <li>L2 Similarity Check</li>
                <li>Conversational Memory</li>
              </ul>
            </div>

            <div className="space-y-5">
              <h5 className="font-display font-black text-slate-900 text-[11px] uppercase tracking-widest">Community</h5>
              <div className="flex items-center gap-4 text-slate-400 mt-2">
                <a href="#" className="p-2.5 bg-white rounded-xl border border-slate-200 hover:text-sky-500 hover:border-sky-300 hover:shadow-md hover:-translate-y-1 transition-all shadow-sm" aria-label="GitHub">
                  <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                </a>
                <a href="#" className="p-2.5 bg-white rounded-xl border border-slate-200 hover:text-sky-500 hover:border-sky-300 hover:shadow-md hover:-translate-y-1 transition-all shadow-sm" aria-label="Twitter">
                  <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="#" className="p-2.5 bg-white rounded-xl border border-slate-200 hover:text-sky-500 hover:border-sky-300 hover:shadow-md hover:-translate-y-1 transition-all shadow-sm" aria-label="Message">
                  <MessageCircle className="h-4.5 w-4.5" />
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Panel: Copyright and Links */}
          <div className="border-t border-slate-200/80 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[12px] text-slate-500 font-medium">
            <p>© 2026 AuraChat AI Platform. Built securely and locally in Pristine White & Sky Blue.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
