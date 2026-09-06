import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { JournalEntry, Conversation } from '../types';

/**
 * Creates or updates a journal entry for the authenticated user.
 * Note: Firestore rules strictly require request.auth.uid == userId.
 */
export async function saveJournalEntry(
  userId: string,
  entry: JournalEntry
): Promise<void> {
  if (!userId) throw new Error('User must be authenticated to save journal entries');
  const entryRef = doc(db, 'users', userId, 'journalEntries', entry.id);
  await setDoc(entryRef, {
    ...entry,
    userId,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Fetches all journal entries belonging to the authenticated user.
 */
export async function getUserJournalEntries(
  userId: string
): Promise<JournalEntry[]> {
  if (!userId) return [];
  const entriesRef = collection(db, 'users', userId, 'journalEntries');
  const q = query(entriesRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  const entries: JournalEntry[] = [];
  snapshot.forEach((docSnap) => {
    entries.push(docSnap.data() as JournalEntry);
  });
  return entries;
}

/**
 * Fetches a single journal entry for the user.
 */
export async function getJournalEntry(
  userId: string,
  entryId: string
): Promise<JournalEntry | null> {
  if (!userId || !entryId) return null;
  const entryRef = doc(db, 'users', userId, 'journalEntries', entryId);
  const docSnap = await getDoc(entryRef);
  if (!docSnap.exists()) return null;
  return docSnap.data() as JournalEntry;
}

/**
 * Deletes a journal entry belonging to the user.
 */
export async function deleteJournalEntry(
  userId: string,
  entryId: string
): Promise<void> {
  if (!userId || !entryId) throw new Error('Invalid identifiers');
  const entryRef = doc(db, 'users', userId, 'journalEntries', entryId);
  await deleteDoc(entryRef);
}

/**
 * Saves multi-turn conversation session history for the authenticated user.
 */
export async function saveConversation(
  userId: string,
  conversation: Conversation
): Promise<void> {
  if (!userId) throw new Error('User must be authenticated to save conversations');
  const convRef = doc(db, 'users', userId, 'conversations', conversation.id);
  await setDoc(convRef, {
    ...conversation,
    userId,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Fetches conversation history for a given session.
 */
export async function getConversation(
  userId: string,
  conversationId: string
): Promise<Conversation | null> {
  if (!userId || !conversationId) return null;
  const convRef = doc(db, 'users', userId, 'conversations', conversationId);
  const docSnap = await getDoc(convRef);
  if (!docSnap.exists()) return null;
  return docSnap.data() as Conversation;
}

/**
 * Deletes a conversation session belonging to the user.
 */
export async function deleteConversation(
  userId: string,
  conversationId: string
): Promise<void> {
  if (!userId || !conversationId) return;
  const convRef = doc(db, 'users', userId, 'conversations', conversationId);
  await deleteDoc(convRef);
}
