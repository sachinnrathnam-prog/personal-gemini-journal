import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  Flame,
  CheckCircle2,
  TrendingUp,
  Tag,
  AlertTriangle,
  RefreshCw,
  Award,
  ListTodo,
  Layers,
} from 'lucide-react';
import type { JournalEntry, HolisticInsights } from '../types';
import { synthesizeUserInsights } from '../services/api';

interface InsightsViewProps {
  entries: JournalEntry[];
  userId: string;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ entries, userId }) => {
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [holisticInsights, setHolisticInsights] = useState<HolisticInsights | null>(null);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});

  // Compute Mood distribution
  const moodCounts: Record<string, number> = {};
  entries.forEach((e) => {
    const m = (e.mood || 'reflective').toLowerCase();
    moodCounts[m] = (moodCounts[m] || 0) + 1;
  });

  // Compute Topic frequencies
  const topicCounts: Record<string, number> = {};
  entries.forEach((e) => {
    (e.topics || []).forEach((t) => {
      const topic = t.toLowerCase();
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
  });
  const sortedTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);

  // Aggregate all action items
  const allActionItems: Array<{ text: string; sessionTitle: string; date: string }> = [];
  entries.forEach((e) => {
    (e.actionItems || []).forEach((a) => {
      allActionItems.push({
        text: a,
        sessionTitle: e.title,
        date: new Date(e.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      });
    });
  });

  // Aggregate all recurring concerns
  const allConcerns = Array.from(
    new Set(entries.flatMap((e) => e.recurringConcerns || []).filter(Boolean))
  );

  const handleSynthesize = async () => {
    if (entries.length === 0) return;
    setIsSynthesizing(true);
    setSynthesisError(null);
    try {
      const result = await synthesizeUserInsights(entries);
      setHolisticInsights(result);
    } catch (err: any) {
      setSynthesisError(err?.message || 'Failed to synthesize cross-session insights.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const toggleActionCheck = (actionText: string) => {
    setCheckedActions((prev) => ({
      ...prev,
      [actionText]: !prev[actionText],
    }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-stone-800" />
            <span>Reflection Timeline & Longitudinal Insights</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-700 mt-0.5">
            Discover recurring life patterns, mood evolution, and AI-synthesized self-knowledge across your private sessions.
          </p>
        </div>

        <button
          id="synthesize-mindset-btn"
          onClick={handleSynthesize}
          disabled={isSynthesizing || entries.length === 0}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs sm:text-sm font-medium transition shadow-xs self-start sm:self-auto disabled:opacity-50 cursor-pointer"
        >
          {isSynthesizing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-stone-300" />
              <span>Analyzing Themes...</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 text-stone-300" />
              <span>Synthesize Mindset Trajectory</span>
            </>
          )}
        </button>
      </div>

      {synthesisError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {synthesisError}
        </div>
      )}

      {/* Holistic Mindset Synthesis Banner (when generated) */}
      {holisticInsights && (
        <div className="p-6 rounded-2xl bg-stone-900 text-stone-100 space-y-5 shadow-sm border border-stone-800 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                Cross-Session Thematic Synthesis
              </h2>
            </div>
            <span className="text-xs text-stone-400 font-mono">
              Based on {holisticInsights.analyzedSessionsCount} session{holisticInsights.analyzedSessionsCount === 1 ? '' : 's'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm">
            {/* Emotional Trajectory */}
            <div className="p-4 rounded-xl bg-stone-800/80 border border-stone-700/60 space-y-2">
              <span className="text-xs font-semibold text-amber-300 uppercase tracking-wide">
                Emotional Trajectory & Resilience
              </span>
              <p className="text-stone-300 leading-relaxed">
                {holisticInsights.emotionalTrajectory}
              </p>
            </div>

            {/* Dominant Themes */}
            <div className="p-4 rounded-xl bg-stone-800/80 border border-stone-700/60 space-y-2">
              <span className="text-xs font-semibold text-amber-300 uppercase tracking-wide">
                Dominant Overarching Themes
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {holisticInsights.dominantThemes.map((theme, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-stone-700 text-stone-200 text-xs font-medium"
                  >
                    • {theme}
                  </span>
                ))}
              </div>
            </div>

            {/* Recurring Patterns */}
            <div className="p-4 rounded-xl bg-stone-800/80 border border-stone-700/60 space-y-2">
              <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wide">
                Recurring Mindset Patterns
              </span>
              <ul className="space-y-1.5 text-stone-300 list-disc list-inside">
                {holisticInsights.recurringPatterns.map((pat, i) => (
                  <li key={i}>{pat}</li>
                ))}
              </ul>
            </div>

            {/* Growth Takeaways */}
            <div className="p-4 rounded-xl bg-stone-800/80 border border-stone-700/60 space-y-2">
              <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">
                Growth Takeaways
              </span>
              <ul className="space-y-1.5 text-stone-300 list-disc list-inside">
                {holisticInsights.growthTakeaways.map((gt, i) => (
                  <li key={i}>{gt}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Overview Analytics: Mood Trends & Recurring Themes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mood Distribution */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-700 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-stone-600" />
              <span>Mood Trends</span>
            </h2>
            <span className="text-xs text-stone-700 font-medium">
              {entries.length} Total Sessions
            </span>
          </div>

          {entries.length === 0 ? (
            <p className="text-xs text-stone-600 py-6 text-center italic">
              Complete your first journal session to view mood trends.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(moodCounts).map(([mood, count]) => {
                const percentage = Math.round((count / entries.length) * 100);
                return (
                  <div key={mood} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize font-medium text-stone-800">{mood}</span>
                      <span className="text-stone-700">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full bg-stone-800 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recurring Themes & Frequent Topics */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-700 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-stone-600" />
            <span>Recurring Themes</span>
          </h2>

          {sortedTopics.length === 0 ? (
            <p className="text-xs text-stone-600 py-6 text-center italic">
              Themes and topics will appear here after your first completed reflection.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {sortedTopics.map(([topic, count]) => (
                  <span
                    key={topic}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-stone-100 text-stone-800 text-xs font-medium border border-stone-200"
                  >
                    <span>#{topic}</span>
                    <span className="text-[10px] bg-stone-200/80 px-1.5 py-0.5 rounded-full text-stone-700">
                      {count}
                    </span>
                  </span>
                ))}
              </div>

              {allConcerns.length > 0 && (
                <div className="pt-3 border-t border-stone-100 space-y-1.5">
                  <span className="text-xs font-medium text-stone-700 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    <span>Active Recurring Concerns:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {allConcerns.slice(0, 6).map((c, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Items Tracker Across Sessions */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-700 flex items-center space-x-2">
            <ListTodo className="w-4 h-4 text-stone-600" />
            <span>Action Items Extracted From Reflections</span>
          </h2>
          <span className="text-xs text-stone-700 font-medium">
            {allActionItems.length} Total Commitments
          </span>
        </div>

        {allActionItems.length === 0 ? (
          <p className="text-xs text-stone-600 py-6 text-center italic">
            When you complete reflections, actionable next steps will accumulate here for execution.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allActionItems.map((item, index) => {
              const isDone = !!checkedActions[item.text];
              return (
                <div
                  key={index}
                  onClick={() => toggleActionCheck(item.text)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start space-x-3 ${
                    isDone
                      ? 'bg-stone-50 border-stone-200 opacity-60'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-stone-900 focus:ring-stone-400"
                  />
                  <div className="space-y-0.5 flex-1">
                    <p className={`text-xs sm:text-sm text-stone-800 ${isDone ? 'line-through text-stone-600' : ''}`}>
                      {item.text}
                    </p>
                    <span className="text-[10px] text-stone-600 block">
                      From "{item.sessionTitle}" · {item.date}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Feature 7: Reflection Timeline */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">
            Reflection Timeline
          </h2>
          <p className="text-xs text-stone-700">
            A chronological visual journey through your thoughts, moods, and guiding reflections.
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-600 italic">
            Your chronological reflection timeline will appear here once you record your first session.
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-stone-200 space-y-8 ml-2">
            {entries.map((entry) => (
              <div key={entry.id} className="relative group">
                {/* Timeline node icon */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-stone-900 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-stone-900" />
                </div>

                <div className="bg-stone-50/70 border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-3 hover:bg-white hover:border-stone-300 transition shadow-2xs">
                  {/* Date & Mood header */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-stone-900">
                        {new Date(entry.createdAt).toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-900 border border-emerald-300 capitalize">
                        {entry.mood}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-700 font-mono">
                      {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Title & Summary */}
                  <h3 className="text-sm sm:text-base font-serif font-bold text-stone-900">
                    {entry.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                    {entry.summary}
                  </p>

                  {/* Central Key Reflection Quote */}
                  {entry.keyReflection && (
                    <div className="p-3 rounded-xl bg-stone-900 text-stone-100 flex items-start space-x-2">
                      <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="font-serif italic text-xs leading-relaxed text-stone-200">
                        "{entry.keyReflection}"
                      </p>
                    </div>
                  )}

                  {/* Topics and goals */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {entry.topics?.map((topic, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-stone-200/80 text-stone-800 text-[11px] font-medium"
                      >
                        #{topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
