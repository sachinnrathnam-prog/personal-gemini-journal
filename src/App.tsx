import { useState, useEffect, useCallback } from 'react';
import { onUserAuthStateChanged, logOut, type User } from './lib/firebase';
import { getUserJournalEntries, deleteJournalEntry, deleteConversation } from './services/journalService';
import type { JournalEntry } from './types';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { JournalView } from './components/JournalView';
import { HistoryView } from './components/HistoryView';
import { InsightsView } from './components/InsightsView';
import { SecurityModal } from './components/SecurityModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'journal' | 'history' | 'insights'>('journal');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onUserAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch entries for the authenticated user
  const fetchEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
      return;
    }
    setEntriesLoading(true);
    try {
      const userEntries = await getUserJournalEntries(user.uid);
      setEntries(userEntries);
    } catch (err) {
      console.error('Failed to retrieve user journal entries');
    } finally {
      setEntriesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user, fetchEntries]);

  // Handle entry deletion
  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    try {
      await deleteJournalEntry(user.uid, entryId);
      await deleteConversation(user.uid, entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch (err) {
      console.error('Failed to delete entry');
      throw err;
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setUser(null);
      setEntries([]);
      setCurrentTab('journal');
    } catch (err) {
      console.error('Failed to sign out');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
        <p className="text-xs font-medium text-stone-600">Verifying secure authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col antialiased selection:bg-stone-200 selection:text-stone-900">
      {/* Top Navigation */}
      <Navbar
        user={user}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onSignOut={handleSignOut}
        onOpenSecurityModal={() => setShowSecurityModal(true)}
      />

      {/* Main Application Body */}
      <main className="flex-1">
        {!user ? (
          <LoginView
            onSuccess={() => {
              setCurrentTab('journal');
            }}
            onOpenSecurityModal={() => setShowSecurityModal(true)}
          />
        ) : (
          <div>
            {currentTab === 'journal' && (
              <JournalView
                user={user}
                onEntrySaved={() => {
                  fetchEntries();
                  setCurrentTab('history');
                }}
              />
            )}

            {currentTab === 'history' && (
              <HistoryView
                entries={entries}
                userId={user.uid}
                isLoading={entriesLoading}
                onDeleteEntry={handleDeleteEntry}
                onStartNewSession={() => setCurrentTab('journal')}
              />
            )}

            {currentTab === 'insights' && (
              <InsightsView
                entries={entries}
                userId={user.uid}
              />
            )}
          </div>
        )}
      </main>

      {/* Security Architecture Modal */}
      {showSecurityModal && (
        <SecurityModal onClose={() => setShowSecurityModal(false)} />
      )}
    </div>
  );
}
