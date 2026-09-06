import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  CheckCircle,
  Save,
  MessageSquare,
  Feather,
  RefreshCw,
  AlertCircle,
  Clock,
  Flame,
  HelpCircle,
} from 'lucide-react';
import type { User } from '../lib/firebase';
import type { ChatMessage, JournalEntry, JournalReflection } from '../types';
import { chatWithGemini, generateSessionReflection } from '../services/api';
import { saveJournalEntry, saveConversation } from '../services/journalService';

interface JournalViewProps {
  user: User;
  onEntrySaved: () => void;
}

const QUICK_INQUIRIES = [
  'Help me reframe this thought with compassion',
  'What might be the root cause behind this feeling?',
  'Help me brainstorm 3 constructive next steps',
  'What question should I ask myself right now?',
];

export const JournalView: React.FC<JournalViewProps> = ({ user, onEntrySaved }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiReplying, setIsAiReplying] = useState(false);
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reflection result preview modal state
  const [activeReflection, setActiveReflection] = useState<JournalReflection | null>(null);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiReplying]);

  // Send a message to Gemini companion
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text || isAiReplying) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setChatInput('');
    setIsAiReplying(true);
    setErrorMessage(null);

    try {
      const reply = await chatWithGemini(updatedMessages, content);
      const modelMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        role: 'model',
        content: reply,
        timestamp: new Date().toISOString(),
      };
      setMessages([...updatedMessages, modelMessage]);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to connect to reflection guide.');
    } finally {
      setIsAiReplying(false);
    }
  };

  // Generate structured reflection
  const handleGenerateReflection = async () => {
    if (!content.trim() && messages.length === 0) {
      setErrorMessage('Please write some thoughts or have a conversation with Gemini before completing the session.');
      return;
    }

    setIsGeneratingReflection(true);
    setErrorMessage(null);

    try {
      const reflection = await generateSessionReflection(
        title || 'Reflective Journal Session',
        content,
        messages
      );
      setActiveReflection(reflection);
      setShowReflectionModal(true);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to generate session reflection.');
    } finally {
      setIsGeneratingReflection(false);
    }
  };

  // Save the completed session to Firestore
  const handleSaveSession = async () => {
    if (!activeReflection || isSaving) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const sessionId = `entry-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`;
      const nowIso = new Date().toISOString();

      const newEntry: JournalEntry = {
        id: sessionId,
        userId: user.uid,
        title: title.trim() || 'Untitled Reflection',
        content: content.trim(),
        summary: activeReflection.summary,
        mood: activeReflection.mood,
        topics: activeReflection.topics || [],
        recurringConcerns: activeReflection.recurringConcerns || [],
        goals: activeReflection.goals || [],
        actionItems: activeReflection.actionItems || [],
        keyReflection: activeReflection.keyReflection,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      // Save journal entry to Firestore: users/{uid}/journalEntries/{entryId}
      await saveJournalEntry(user.uid, newEntry);

      // Save conversation log to Firestore: users/{uid}/conversations/{conversationId}
      if (messages.length > 0) {
        await saveConversation(user.uid, {
          id: sessionId,
          userId: user.uid,
          title: title.trim() || 'Reflection Conversation',
          messages,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }

      setShowReflectionModal(false);
      setSaveSuccessNotice(true);
      setTimeout(() => {
        setSaveSuccessNotice(false);
        // Reset editor
        setTitle('');
        setContent('');
        setMessages([]);
        setActiveReflection(null);
        onEntrySaved();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save entry to private Firestore storage.');
    } finally {
      setIsSaving(false);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Session Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight flex items-center space-x-2">
            <Feather className="w-5 h-5 text-stone-700" />
            <span>New Journal Session</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-700 mt-0.5">
            Write freely, brainstorm with Gemini in real time, and distill lasting insights.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="finish-session-btn"
            onClick={handleGenerateReflection}
            disabled={isGeneratingReflection || (!content.trim() && messages.length === 0)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs sm:text-sm font-medium transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isGeneratingReflection ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-stone-300" />
                <span>Distilling Reflection...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-stone-300" />
                <span>Finish & Generate Reflection</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error & Success Feedback */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {saveSuccessNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-700" />
          <span>Session securely saved to your private Firestore vault! Redirecting...</span>
        </div>
      )}

      {/* Main Dual Workspace: Writing Pad (Left) & Gemini Companion (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Journal Entry Editor */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs flex flex-col space-y-4 min-h-[560px]">
          <div>
            <label htmlFor="journal-title-input" className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Session Title
            </label>
            <input
              id="journal-title-input"
              type="text"
              placeholder="E.g., Untangling morning thoughts on career choices..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-base sm:text-lg font-medium text-stone-900 placeholder-stone-400 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 transition"
              maxLength={200}
            />
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="journal-content-textarea" className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
                Journal Reflection & Stream of Consciousness
              </label>
              <span className="text-[11px] text-stone-600">
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </span>
            </div>
            <textarea
              id="journal-content-textarea"
              placeholder="What is on your mind today? Write candidly about your experiences, worries, dreams, or dilemmas. Gemini can review this context in your conversation..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 w-full text-sm sm:text-base text-stone-800 placeholder-stone-400 p-3.5 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 transition resize-none leading-relaxed min-h-[360px]"
              maxLength={40000}
            />
          </div>

          <div className="text-[11px] text-stone-600 flex items-center justify-between pt-2 border-t border-stone-100">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-stone-600" />
              <span>Private & confidential · Never shared across users</span>
            </span>
            <span>Character limit: {content.length} / 40,000</span>
          </div>
        </div>

        {/* Right: Multi-turn Gemini Reflection Partner */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col h-[560px] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-stone-100" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-semibold text-stone-900">
                  Gemini Reflection Guide
                </h2>
                <p className="text-[10px] text-stone-600">
                  Confidential brainstorming & inquiry
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-200/70 text-stone-700">
              gemini-2.5-flash
            </span>
          </div>

          {/* Quick Inquiry Prompts */}
          <div className="px-3 py-2 bg-stone-100/70 border-b border-stone-200 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-medium text-stone-600 shrink-0 flex items-center space-x-1">
              <HelpCircle className="w-3 h-3" />
              <span>Inquiries:</span>
            </span>
            {QUICK_INQUIRIES.map((prompt, i) => (
              <button
                key={i}
                type="button"
                id={`quick-inquiry-btn-${i}`}
                onClick={() => handleSendMessage(prompt)}
                disabled={isAiReplying}
                className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-white hover:bg-stone-200/80 text-stone-700 border border-stone-200 transition cursor-pointer whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-stone-50/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-stone-600 space-y-2">
                <div className="w-10 h-10 rounded-full bg-stone-200/80 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-stone-600" />
                </div>
                <p className="text-xs font-medium text-stone-800">
                  Your Reflection Companion
                </p>
                <p className="text-[11px] max-w-xs leading-relaxed text-stone-600">
                  Ask Gemini questions about what you wrote, explore alternatives, or test ideas. Everything is kept strictly private.
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-stone-900 text-stone-50 rounded-br-xs'
                        : 'bg-white text-stone-800 border border-stone-200 shadow-2xs rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <span
                      className={`block text-[9px] mt-1 ${
                        m.role === 'user' ? 'text-stone-400 text-right' : 'text-stone-600 text-left'
                      }`}
                    >
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}

            {isAiReplying && (
              <div className="flex justify-start">
                <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-xs px-3.5 py-2 text-xs text-stone-600 flex items-center space-x-2 shadow-2xs">
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px]">Gemini is reflecting...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-stone-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <input
                id="gemini-chat-input"
                type="text"
                placeholder="Ask for reflection, advice, or perspective..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isAiReplying}
                className="flex-1 text-xs sm:text-sm px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 transition"
                maxLength={4000}
              />
              <button
                id="send-chat-btn"
                type="submit"
                disabled={isAiReplying || !chatInput.trim()}
                className="p-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition disabled:opacity-40 cursor-pointer"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Structured Reflection Modal / Review Drawer */}
      {showReflectionModal && activeReflection && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
                  Session Completed
                </span>
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  {title || 'Personal Reflection Summary'}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                Mood: {activeReflection.mood}
              </span>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-stone-800 text-xs sm:text-sm">
              {/* Summary */}
              <div className="space-y-1.5">
                <h4 className="font-semibold text-stone-900 text-xs uppercase tracking-wider">
                  Executive Summary
                </h4>
                <p className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 leading-relaxed">
                  {activeReflection.summary}
                </p>
              </div>

              {/* Key Reflection Question / Insight */}
              <div className="p-4 rounded-xl bg-stone-900 text-stone-50 space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 flex items-center space-x-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Key Reflection Invariant</span>
                </span>
                <p className="font-serif text-sm sm:text-base italic leading-relaxed text-stone-100">
                  "{activeReflection.keyReflection}"
                </p>
              </div>

              {/* Topics & Concerns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <span className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
                    Core Topics
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeReflection.topics.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-stone-200/80 text-stone-800 text-[11px] font-medium"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <span className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
                    Recurring Concerns
                  </span>
                  {activeReflection.recurringConcerns.length > 0 ? (
                    <ul className="space-y-1 text-xs text-stone-700 list-disc list-inside">
                      {activeReflection.recurringConcerns.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-stone-600 italic">No tensions noted</p>
                  )}
                </div>
              </div>

              {/* Goals & Action Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <span className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
                    Clarified Goals
                  </span>
                  <ul className="space-y-1 text-xs text-stone-700 list-disc list-inside">
                    {activeReflection.goals.map((g, idx) => (
                      <li key={idx}>{g}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <span className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
                    Next Action Items
                  </span>
                  <ul className="space-y-1 text-xs text-stone-700 list-disc list-inside">
                    {activeReflection.actionItems.map((a, idx) => (
                      <li key={idx}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
              <button
                id="cancel-reflection-btn"
                type="button"
                onClick={() => setShowReflectionModal(false)}
                className="px-4 py-2 rounded-xl text-stone-700 hover:text-stone-900 text-xs sm:text-sm font-medium cursor-pointer"
              >
                Back to Editing
              </button>

              <button
                id="confirm-save-session-btn"
                type="button"
                onClick={handleSaveSession}
                disabled={isSaving}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-medium transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving to Firestore...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save to Private Journal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
