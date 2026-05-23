'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Bot, 
  Lock, 
  Mail, 
  Loader2, 
  ArrowRight, 
  AlertCircle, 
  Sparkles, 
  Database,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Redirect if already authenticated
    const auth = localStorage.getItem('user_authenticated');
    if (auth === 'true') {
      router.push('/chat');
    }
  }, [router]);

  const fillDemoCredentials = () => {
    setEmail('admin@aurachat.com');
    setPassword('admin123');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password credentials.');
      return;
    }

    setIsLoading(true);

    // Simulate enterprise JWT authenticate handshake
    setTimeout(() => {
      if (email === 'admin@aurachat.com' && password === 'admin123') {
        localStorage.setItem('user_authenticated', 'true');
        router.push('/chat');
      } else {
        setErrorMsg('Invalid credentials. Use admin@aurachat.com / admin123 for dashboard access.');
        setIsLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="bg-white text-slate-800 min-h-screen flex overflow-hidden relative">
      
      {/* LEFT COLUMN: Futuristic AI Branding (Desktop only) */}
      <div className="hidden lg:flex lg:w-7/12 bg-slate-50/50 border-r border-sky-100 relative items-center justify-center p-12 overflow-hidden">
        {/* Glowing bubble lights */}
        <div className="absolute top-[20%] left-[20%] w-[350px] h-[350px] rounded-full bg-sky-200/20 blur-[100px] float-bubble-1" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-sky-100/30 blur-[120px] float-bubble-2" />
        
        {/* Subtle dot grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-md space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-100 text-sky-600 text-[10px] font-extrabold uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5 text-sky-500 animate-pulse" />
            <span>Secure Enterprise Sandbox</span>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-display font-black text-slate-900 leading-tight">
              AuraChat Support Suite
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              A fully integrated proprietary RAG manual pipeline. Splitting guides recursively, generating vector embedding indices, and scoring customer reviews under strict offline sandbox regulations.
            </p>
          </div>

          {/* Interactive features summary */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex gap-3">
              <div className="p-2 bg-sky-50 rounded-xl border border-sky-100 text-sky-500">
                <Database className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">Local SQLite & ChromaDB</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">All text vectors, chat sessions history, and feedback streams run locally on SQLite.</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="p-2 bg-sky-50 rounded-xl border border-sky-100 text-sky-500">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">Strict Offline Sandboxing</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Indices are calculated inside a secure host server, guarding proprietary manuals from leaks.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 bg-sky-50 rounded-xl border border-sky-100 text-sky-500">
                <Zap className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">0.34s Similarity Queries</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Calculates high-accuracy semantic matches using fast Cosine L2 proximity distances.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Login form */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-slate-50/10">
        
        {/* Mobile decorative bubble */}
        <div className="lg:hidden absolute top-[10%] left-[10%] w-[300px] h-[300px] rounded-full bg-sky-200/20 blur-[90px] -z-10" />

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[380px] liquid-glass p-8 sm:p-10 rounded-3xl border border-sky-150 shadow-xl relative"
        >
          {/* Header Logo */}
          <div className="flex flex-col items-center text-center mb-8">

            <h1 className="text-xl font-display font-black text-slate-900 tracking-tight">Console Login</h1>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
              Enter credentials to unlock the AuraChat AI Support console.
            </p>
          </div>

          {/* Error Notification */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs flex gap-2.5 items-start mb-6 font-medium"
            >
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-500" />
              <p className="leading-normal">{errorMsg}</p>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="admin@aurachat.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 transition-all font-medium"
                />
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Password</label>
                <span className="text-[9px] font-bold text-sky-500 hover:text-sky-600 cursor-pointer">Forgot?</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 transition-all font-medium"
                />
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Submit Trigger */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3.5 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-sky-500/10 flex items-center justify-center gap-2 cursor-pointer mt-2 hover:scale-[1.01]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

          </form>

          {/* Demo Account credentials overlay */}
          <div 
            onClick={fillDemoCredentials}
            className="mt-8 pt-6 border-t border-slate-200 flex gap-2.5 items-start text-[10px] text-slate-500 leading-normal font-medium cursor-pointer hover:bg-slate-50 p-3 rounded-xl transition-colors border border-transparent hover:border-slate-100 group"
            title="Click to auto-fill credentials"
          >
            <Sparkles className="h-4 w-4 text-sky-500 shrink-0 mt-0.5 group-hover:animate-pulse" />
            <div>
              <span className="font-bold text-slate-700 block mb-1 group-hover:text-sky-600 transition-colors">Demonstration Credentials (Click to Auto-fill):</span>
              <span>Use <code className="bg-slate-100 text-sky-650 px-1.5 py-0.5 rounded font-mono border border-slate-200 group-hover:border-sky-200">admin@aurachat.com</code> & <code className="bg-slate-100 text-sky-650 px-1.5 py-0.5 rounded font-mono border border-slate-200 group-hover:border-sky-200">admin123</code> to access full platform configurations.</span>
            </div>
          </div>

        </motion.div>
      </div>

    </div>
  );
}
