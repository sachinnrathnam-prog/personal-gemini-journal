import React, { useState } from 'react';
import {
  Search,
  Calendar,
  Tag,
  ArrowRight,
  Trash2,
  BookOpen,
  Filter,
  Sparkles,
  Inbox,
} from 'lucide-react';
import type { JournalEntry } from '../types';
import { SessionDetailModal } from './SessionDetailModal';

interface HistoryViewProps {
  entries: JournalEntry[];
  userId: string;
  isLoading: boolean;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onStartNewSession: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  entries,
  userId,
  isLoading,
  onDeleteEntry,
  onStartNewSession,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Available moods from current entries
  const allMoods = Array.from(new Set(entries.map((e) => e.mood).filter(Boolean)));

  const filteredEntries = entries.filter((entry) => {
    const matchesMood = selectedMood === 'all' || entry.mood?.toLowerCase() === selectedMood.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesMood;

    const matchesTitle = entry.title?.toLowerCase().includes(query);
    const matchesSummary = entry.summary?.toLowerCase().includes(query);
    const matchesTopics = entry.topics?.some((t) => t.toLowerCase().includes(query));
    const matchesContent = entry.content?.toLowerCase().includes(query);

    return matchesMood && (matchesTitle || matchesSummary || matchesTopics || matchesContent);
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight">
            Journal History & Archives
          </h1>
          <p className="text-xs sm:text-sm text-stone-700 mt-0.5">
            Browse and review your past reflection sessions. All entries are encrypted and isolated to your account.
          </p>
        </div>

        <button
          id="history-new-session-btn"
          onClick={onStartNewSession}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs sm:text-sm font-medium transition shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-stone-300" />
          <span>New Journal Session</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Search */}
        <div className="sm:col-span-7 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            id="history-search-input"
            type="text"
            placeholder="Search by title, topics, thoughts, or reflections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-stone-200 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 transition"
          />
        </div>

        {/* Mood filter selector */}
        <div className="sm:col-span-5 flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-xs text-stone-600 font-medium shrink-0 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Mood:</span>
          </span>
          <button
            onClick={() => setSelectedMood('all')}
            className={`text-xs px-2.5 py-1 rounded-lg transition font-medium cursor-pointer ${
              selectedMood === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            All ({entries.length})
          </button>
          {allMoods.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMood(m)}
              className={`text-xs px-2.5 py-1 rounded-lg transition capitalize font-medium cursor-pointer whitespace-nowrap ${
                selectedMood === m
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-600">Retrieving encrypted journal archive...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-2xl border border-dashed border-stone-300 bg-white space-y-3">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-600">
            <Inbox className="w-6 h-6 text-stone-600" />
          </div>
          <h3 className="text-sm font-semibold text-stone-900">
            {searchQuery || selectedMood !== 'all' ? 'No matching journal entries found' : 'No journal sessions yet'}
          </h3>
          <p className="text-xs text-stone-700 max-w-sm mx-auto">
            {searchQuery || selectedMood !== 'all'
              ? 'Try resetting your mood filter or search query.'
              : 'Begin your first private journaling session to start recording your personal evolution.'}
          </p>
          {(searchQuery || selectedMood !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedMood('all');
              }}
              className="text-xs text-stone-900 font-semibold underline underline-offset-4 cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <article
              key={entry.id}
              className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs hover:border-stone-300 transition-all space-y-4"
            >
              {/* Card Header: Mood, Date, Actions */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 capitalize">
                      {entry.mood || 'Reflective'}
                    </span>
                    <span className="text-xs text-stone-600 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-600" />
                      <span>{new Date(entry.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 hover:text-stone-700 transition cursor-pointer"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    {entry.title}
                  </h2>
                </div>

                <button
                  id={`delete-entry-btn-${entry.id}`}
                  onClick={() => onDeleteEntry(entry.id)}
                  className="p-1.5 rounded-lg text-stone-600 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                  title="Delete Session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Summary */}
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed line-clamp-2">
                {entry.summary}
              </p>

              {/* Topics and Card Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-stone-100">
                <div className="flex flex-wrap gap-1.5">
                  {entry.topics?.slice(0, 4).map((topic, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[11px] font-medium"
                    >
                      #{topic}
                    </span>
                  ))}
                </div>

                <button
                  id={`open-session-btn-${entry.id}`}
                  onClick={() => setSelectedEntry(entry)}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-stone-900 hover:text-stone-600 transition cursor-pointer self-start sm:self-auto"
                >
                  <span>Open Full Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Selected Session Detail Modal */}
      {selectedEntry && (
        <SessionDetailModal
          entry={selectedEntry}
          userId={userId}
          onClose={() => setSelectedEntry(null)}
          onDelete={async (entryId) => {
            await onDeleteEntry(entryId);
            setSelectedEntry(null);
          }}
        />
      )}
    </div>
  );
};
