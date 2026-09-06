import { auth } from '../lib/firebase';
import type {
  ChatMessage,
  JournalReflection,
  HolisticInsights,
  JournalEntry,
} from '../types';

/**
 * Retrieves a fresh Firebase ID token for the currently signed-in user.
 * Proactively refreshes the token if it is close to expiration.
 */
export async function getFreshIdToken(forceRefresh = false): Promise<string> {
  if (!auth.currentUser) {
    await auth.authStateReady();
  }

  const user = auth.currentUser;

  console.log('[Client Auth Diagnostic] Current user signed in:', !!user);

  if (user) {
    console.log('[Client Auth Diagnostic] Current user UID:', user.uid);
    console.log('[Client Auth Diagnostic] Current user email:', user.email);
    console.log(
      '[Client Auth Diagnostic] Current user isAnonymous:',
      user.isAnonymous
    );
  }

  if (!user) {
    throw new Error('You must be signed in to perform this action.');
  }

  // Proactively check token expiration.
  if (!forceRefresh) {
    try {
      const tokenResult = await user.getIdTokenResult(false);

      if (tokenResult?.token) {
        console.log(
          '[Client Auth Diagnostic] ID token obtained via getIdTokenResult, length:',
          tokenResult.token.length
        );

        const expirationMs = new Date(
          tokenResult.expirationTime
        ).getTime();
        const nowMs = Date.now();

        // Refresh if token expires within 2 minutes.
        if (expirationMs - nowMs < 2 * 60 * 1000) {
          console.log(
            '[Client Auth Diagnostic] Token expiring soon, refreshing...'
          );

          const refreshed = await user.getIdToken(true);

          if (refreshed) {
            console.log(
              '[Client Auth Diagnostic] Refreshed token length:',
              refreshed.length
            );
            return refreshed;
          }
        }

        return tokenResult.token;
      }
    } catch {
      // Fall through to standard getIdToken call.
    }
  }

  const token = await user.getIdToken(forceRefresh);

  console.log(
    '[Client Auth Diagnostic] ID token obtained via getIdToken, length:',
    token?.length
  );

  if (!token) {
    throw new Error('Authentication token could not be retrieved.');
  }

  return token;
}

/**
 * Performs an authenticated HTTP POST request to the server-side API.
 *
 * Primary authentication:
 *   Authorization: Bearer <Firebase ID token>
 *
 * Secondary preview-safe authentication header:
 *   X-Firebase-ID-Token: <Firebase ID token>
 *
 * Never sends or trusts a client-supplied UID.
 * Automatically retries once with a freshly issued token after a 401.
 */
async function authenticatedApiRequest<T>(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<T> {
  const idToken = await getFreshIdToken(false);

  if (!idToken) {
    throw new Error('You must be signed in to perform this action.');
  }

  console.log('[Client Auth Diagnostic] Sending request to:', endpoint);
  console.log(
    '[Client Auth Diagnostic] Authorization header: Bearer present, token length:',
    idToken.length
  );

  let response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
      'X-Firebase-ID-Token': idToken,
    },
    body: JSON.stringify(payload),
  });

  // If the server rejects the token, force-refresh and retry once.
  if (response.status === 401) {
    console.log(
      '[Client Auth Diagnostic] Server responded with 401, attempting token refresh...'
    );

    try {
      const freshToken = await getFreshIdToken(true);

      if (freshToken) {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${freshToken}`,
            'X-Firebase-ID-Token': freshToken,
          },
          body: JSON.stringify(payload),
        });
      }
    } catch (refreshErr) {
      console.warn(
        'Authentication token refresh retry failed:',
        refreshErr
      );
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.error ||
        `Server request failed with status ${response.status}`
    );
  }

  return response.json();
}

export async function chatWithGemini(
  messages: ChatMessage[],
  journalContext?: string
): Promise<string> {
  const data = await authenticatedApiRequest<{ reply: string }>(
    '/api/chat',
    {
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      journalContext,
    }
  );

  return data.reply;
}

export async function generateSessionReflection(
  title: string,
  content: string,
  messages: ChatMessage[]
): Promise<JournalReflection> {
  return authenticatedApiRequest<JournalReflection>(
    '/api/generate-reflection',
    {
      title,
      content,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }
  );
}

export async function synthesizeUserInsights(
  entries: JournalEntry[]
): Promise<HolisticInsights> {
  return authenticatedApiRequest<HolisticInsights>(
    '/api/synthesize-insights',
    {
      entries: entries.slice(0, 25).map((e) => ({
        title: e.title,
        mood: e.mood,
        summary: e.summary,
        topics: e.topics,
        recurringConcerns: e.recurringConcerns,
        goals: e.goals,
        actionItems: e.actionItems,
        createdAt: e.createdAt,
      })),
    }
  );
}