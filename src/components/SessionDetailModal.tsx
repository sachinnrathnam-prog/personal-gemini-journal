import React, { useState, useEffect } from 'react';
import { X, Calendar, MessageSquare, Tag, Trash2, CheckCircle2, Flame, Clock } from 'lucide-react';
import type { JournalEntry, Conversation } from '../types';
import { getConversation } from '../services/journalService';

interface SessionDetailModalProps {
  entry: JournalEntry;
  userId: string;
  onClose: () => void;
  onDelete: (entryId: string) => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  entry,
  userId,
  onClose,
  onDelete,
}) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadChat() {
      setIsLoadingChat(true);
      try {
        const conv = await getConversation(userId, entry.id);
        if (isMounted) {
          setConversation(conv);
        }
      } catch (err) {
        console.error('Failed to load session conversation', err);
      } finally {
        if (isMounted) setIsLoadingChat(false);
      }
    }
    loadChat();
    return () => {
      isMounted = false;
    };
  }, [entry.id, userId]);

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-200 bg-stone-50 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                {entry.mood}
              </span>
              <span className="text-xs text-stone-600 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-stone-600" />
                <span>{new Date(entry.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
              </span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900">
              {entry.title}
            </h2>
          </div>

          <button
            id="close-session-detail-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-800 hover:bg-stone-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-stone-800 text-xs sm:text-sm">
          {/* Executive Summary */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              AI Distilled Summary
            </h3>
            <p className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 leading-relaxed text-stone-800">
              {entry.summary}
            </p>
          </div>

          {/* Key Reflection Takeaway */}
          {entry.keyReflection && (
            <div className="p-4 rounded-xl bg-stone-900 text-stone-100 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 flex items-center space-x-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Central Takeaway</span>
              </span>
              <p className="font-serif italic text-sm leading-relaxed">
                "{entry.keyReflection}"
              </p>
            </div>
          )}

          {/* Original Writing */}
          {entry.content && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                Original Journal Entry
              </h3>
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto font-sans">
                {entry.content}
              </div>
            </div>
          )}

          {/* Conversation History */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-600 flex items-center space-x-1.5">
              <MessageSquare className="w-4 h-4 text-stone-600" />
              <span>Gemini Reflection Transcript</span>
            </h3>
            {isLoadingChat ? (
              <div className="p-4 text-center text-xs text-stone-600">
                Loading encrypted conversation log...
              </div>
            ) : conversation && conversation.messages.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto p-3 bg-stone-50 rounded-xl border border-stone-200">
                {conversation.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                        m.role === 'user'
                          ? 'bg-stone-900 text-stone-50'
                          : 'bg-white text-stone-800 border border-stone-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-600 italic p-3 bg-stone-50 rounded-xl border border-stone-200">
                No conversation turns were recorded for this session.
              </p>
            )}
          </div>

          {/* Topics, Concerns, Goals & Action Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Topics & Concerns */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                Topics & Themes
              </span>
              <div className="flex flex-wrap gap-1.5">
                {entry.topics.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-stone-200/80 text-stone-800 text-[11px] font-medium"
                  >
                    #{t}
                  </span>
                ))}
              </div>
              {entry.recurringConcerns && entry.recurringConcerns.length > 0 && (
                <div className="pt-2 border-t border-stone-200">
                  <span className="text-[11px] font-semibold text-stone-600 uppercase">
                    Observed Concerns
                  </span>
                  <ul className="text-xs text-stone-700 list-disc list-inside mt-1 space-y-0.5">
                    {entry.recurringConcerns.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Goals & Actions */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                Actionable Outcomes
              </span>
              {entry.actionItems && entry.actionItems.length > 0 ? (
                <ul className="text-xs text-stone-700 space-y-1.5">
                  {entry.actionItems.map((a, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-stone-600 italic">No specific action items listed.</p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer with Delete & Close */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <div>
            {isConfirmingDelete ? (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-rose-700 font-medium">Permanently delete?</span>
                <button
                  id="confirm-delete-entry-btn"
                  onClick={() => onDelete(entry.id)}
                  className="px-3 py-1 rounded-lg bg-rose-700 text-white text-xs font-medium hover:bg-rose-800 transition cursor-pointer"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-2 py-1 rounded-lg text-stone-600 text-xs hover:text-stone-800 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                id="initiate-delete-entry-btn"
                onClick={() => setIsConfirmingDelete(true)}
                className="inline-flex items-center space-x-1 text-xs text-stone-600 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Session</span>
              </button>
            )}
          </div>

          <button
            id="modal-footer-close-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs sm:text-sm font-medium hover:bg-stone-800 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
