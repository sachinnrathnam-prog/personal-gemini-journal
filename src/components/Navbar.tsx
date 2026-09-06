import React from 'react';
import { BookOpen, History, Sparkles, LogOut, ShieldCheck } from 'lucide-react';
import type { User } from '../lib/firebase';

interface NavbarProps {
  user: User | null;
  currentTab: 'journal' | 'history' | 'insights';
  onTabChange: (tab: 'journal' | 'history' | 'insights') => void;
  onSignOut: () => void;
  onOpenSecurityModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentTab,
  onTabChange,
  onSignOut,
  onOpenSecurityModal,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-40 bg-stone-50/90 backdrop-blur-md border-b border-stone-200 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Security Status */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center shadow-xs">
            <BookOpen className="w-5 h-5 text-stone-100" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-stone-900 tracking-tight text-base sm:text-lg">
                Personal Gemini Journal
              </span>
              <button
                id="header-security-badge-btn"
                onClick={onOpenSecurityModal}
                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                title="View Zero-Trust Security Architecture"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">Zero-Trust Verified</span>
              </button>
            </div>
            <p className="text-[11px] text-stone-700 hidden md:block">
              Private AI reflection · Firestore per-user isolated
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        {user && (
          <nav id="app-nav-tabs" className="flex items-center space-x-1 bg-stone-200/60 p-1 rounded-xl border border-stone-300/60 text-xs sm:text-sm font-medium">
            <button
              id="tab-journal-btn"
              onClick={() => onTabChange('journal')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentTab === 'journal'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Journal</span>
            </button>

            <button
              id="tab-history-btn"
              onClick={() => onTabChange('history')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentTab === 'history'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>

            <button
              id="tab-insights-btn"
              onClick={() => onTabChange('insights')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentTab === 'insights'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Insights</span>
            </button>
          </nav>
        )}

        {/* User Profile & Sign Out */}
        {user ? (
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-xs font-medium text-stone-800 max-w-[140px] truncate">
                {user.displayName || user.email?.split('@')[0] || 'User'}
              </span>
              <span className="text-[10px] text-stone-600 font-mono">
                UID: {user.uid.slice(0, 6)}...
              </span>
            </div>

            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User Profile'}
                className="w-8 h-8 rounded-full border border-stone-300 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-stone-300 text-stone-700 flex items-center justify-center font-semibold text-xs border border-stone-300">
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}

            <button
              id="sign-out-btn"
              onClick={onSignOut}
              className="p-1.5 rounded-lg text-stone-700 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            id="open-security-modal-btn"
            onClick={onOpenSecurityModal}
            className="text-xs text-stone-700 hover:text-stone-900 flex items-center space-x-1"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Security Architecture</span>
          </button>
        )}
      </div>
    </header>
  );
};
