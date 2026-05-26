'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Menu, 
  X, 
  Bot,
  Activity,
  FileText,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Force Light Theme strictly on mount
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
  }, []);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load collapse state and force light theme
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar_collapsed');
      if (saved === 'true') {
        setIsCollapsed(true);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user_authenticated');
    router.push('/login');
  };

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar_collapsed', String(newState));
    }
  };

  const navItems = [
    { name: 'Chat Assistant', href: '/chat', icon: MessageSquare },
    { name: 'Document RAG', href: '/documents', icon: FileText },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md border-b border-sky-100 text-slate-800 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2.5 font-bold text-sm tracking-tight">

          <span className="font-display font-extrabold text-slate-900 tracking-wider">
            AuraChat <span className="text-[9px] text-sky-600 px-1.5 py-0.5 rounded bg-sky-50 border border-sky-100 font-bold ml-1.5">AI</span>
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 focus:outline-none"
        >
          {isOpen ? <X className="h-5.5 w-5.5" /> : <Menu className="h-5.5 w-5.5" />}
        </button>
      </div>

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-sky-100 flex flex-col justify-between transition-all duration-300 lg:translate-x-0 lg:static lg:h-screen shadow-md shrink-0 lg:relative ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed && mounted ? 'w-64 lg:w-20' : 'w-64 lg:w-64'}`}
      >
        {/* Collapse/Expand Toggle Button (Desktop Only) */}
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex absolute top-1/2 -right-4 -translate-y-1/2 z-50 h-8 w-8 rounded-full bg-white border border-sky-100 text-sky-500 hover:text-sky-600 hover:bg-sky-50 hover:scale-105 active:scale-95 shadow-md items-center justify-center cursor-pointer transition-all duration-250 focus:outline-none"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed && mounted ? <ChevronRight className="h-4.5 w-4.5" /> : <ChevronLeft className="h-4.5 w-4.5" />}
        </button>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <Link 
            href="/" 
            className={`hidden lg:flex items-center gap-3 px-6 py-6 border-b border-sky-100 hover:opacity-90 transition-all duration-200 ${
              isCollapsed && mounted ? 'justify-center px-4' : ''
            }`}
          >
            {isCollapsed && mounted ? (
              <span className="font-display font-black text-sm text-sky-500 bg-sky-50/80 px-2.5 py-1.5 rounded-xl border border-sky-100 shadow-sm animate-pulse-slow">AC</span>
            ) : (
              <div className="flex flex-col">
                <span className="font-display font-black text-sm tracking-tight text-slate-900 leading-none">AuraChat</span>
                <span className="text-[9px] text-sky-655 font-bold tracking-wider mt-1.5 uppercase">Local RAG Console</span>
              </div>
            )}
          </Link>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  title={isCollapsed && mounted ? item.name : undefined}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 group relative ${
                    isActive
                      ? 'text-sky-600 font-extrabold'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                  } ${isCollapsed && mounted ? 'lg:justify-center lg:px-0 lg:w-12 lg:mx-auto' : ''}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavBackground"
                      className="absolute inset-0 bg-sky-50 border border-sky-100 rounded-xl"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-105 relative z-10 ${
                    isActive ? 'text-sky-500' : 'text-slate-400 group-hover:text-slate-700'
                  }`} />
                  {(!isCollapsed || !mounted) && <span className="relative z-10">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Area with Profile & Logout */}
        <div className={`p-4 border-t border-sky-100 space-y-3 shrink-0 bg-slate-50/50 transition-all ${
          isCollapsed && mounted ? 'lg:p-2' : ''
        }`}>
          
          {/* Decorative System Tag */}
          <div className={`flex items-center justify-center w-full px-4 py-2.5 rounded-xl border border-sky-100 bg-sky-50/30 text-slate-500 text-[10px] font-bold ${
            isCollapsed && mounted ? 'lg:px-0 lg:py-2.5 lg:w-12 lg:mx-auto' : ''
          }`}>
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-sky-500 animate-pulse" />
              {(!isCollapsed || !mounted) && <span>SECURE SANDBOX ACTIVE</span>}
            </div>
          </div>

          {/* User profile and logout */}
          <div className={`flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl ${
            isCollapsed && mounted ? 'lg:flex-col lg:gap-3.5 lg:px-1 lg:py-3 lg:w-12 lg:mx-auto' : ''
          }`}>
            <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed && mounted ? 'lg:flex-col lg:gap-1.5' : ''}`}>
              <div className="relative shrink-0">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-extrabold text-[10px] shadow-sm">
                  AD
                </div>
                <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              {(!isCollapsed || !mounted) && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[11px] font-bold text-slate-800 truncate">Administrator</span>
                  <span className="text-[9px] text-slate-450 font-bold tracking-wider uppercase truncate flex items-center gap-1 mt-0.5">
                    <Activity className="h-2.5 w-2.5 text-emerald-500 animate-pulse" /> Console
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-450 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-35 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}
