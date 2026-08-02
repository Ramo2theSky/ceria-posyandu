'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [showSidebar, setShowSidebar] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setShowSidebar(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 md:flex">
      {/* Desktop sidebar — always visible */}
      <div className="hidden md:block md:w-80 md:shrink-0">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <Sidebar />
        </div>
      </div>

      {/* Mobile backdrop */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Mobile sidebar — slide-in */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:hidden
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setShowSidebar(false)} />
      </div>

      {/* Content area */}
      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/95 backdrop-blur px-4 py-3 md:hidden">
          <button
            onClick={() => setShowSidebar(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <img src="/ceria-logo.png" alt="CERIA" className="h-7" />
          <span className="text-sm font-semibold text-slate-700">CERIA</span>
        </div>

        {children}
      </div>
    </div>
  );
}
