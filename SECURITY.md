# SECURITY.md: Personal Gemini Journal Security Architecture

## 1. Executive Summary & Security Philosophy

**Personal Gemini Journal** is built on a **Zero-Trust, Multi-User Isolation Architecture**. Personal journaling involves highly sensitive, intimate thoughts and emotions. Consequently, the application assumes:
1. The browser environment is completely untrusted and potentially hostile.
2. The user's identity must originate exclusively from cryptographically verified identity tokens.
3. No privileged credentials or API keys may ever touch the client or be present in public code repositories.
4. Database security must be enforced by Cloud Firestore rules, guaranteeing that users can only read and write their own data.

---

## 2. Threat Model & Boundaries

| Component | Trust Level | Responsibility | Defenses |
| :--- | :--- | :--- | :--- |
| **Browser / Client** | Untrusted | User interface, state management, displaying sanitized reflections. | No API keys; Firebase ID token stored securely in Firebase Auth memory/IndexedDB. Safe DOM rendering (no `dangerouslySetInnerHTML`). |
| **Firebase Auth** | Trusted IDP | Authentication, Google OAuth, issuance of signed RS256 JWTs. | Enforces valid Google accounts, token expiration, rotation of Google signing keys. |
| **Cloud Firestore** | Trusted DB | Persistence of journal entries and multi-turn conversations. | Hardened Security Rules (`firestore.rules`). Per-user isolation at `/users/{userId}/*`. Default-deny catch-all. |
| **Node.js Express Backend** | Trusted API Gateway | ID token verification, payload validation, prompt injection defense, invoking Gemini. | Runs in isolated container. Validates Google JWKS signatures. Rate and size bounding. Sanitized errors. |
| **Google Cloud Secret Manager** | Trusted Vault | Secure storage of privileged Gemini API credentials. | Runtime retrieval via server environment or Secret Manager client. Never exposed to browser or Git. |
| **Gemini API** | Trusted AI | Multi-turn reflection and structured insight generation. | Bounded contexts, system instruction safeguards, strict JSON schema output parsing. |

---

## 3. Data Isolation Model

All private user data is strictly segregated by the user's authentic Firebase UID:

```
/databases/(default)/documents
  └── users/
      └── {userId}/                           <-- Restricted to request.auth.uid == userId
          ├── journalEntries/
          │   └── {entryId}                   <-- Single journal entry + AI reflection
          └── conversations/
              └── {conversationId}            <-- Multi-turn companion transcript
```

### Firestore Security Rules Enforcement
1. **Default Deny**: `match /{document=**} { allow read, write: if false; }` prevents accidental exposure of any documents.
2. **Identity Verification**: `isOwner(userId)` evaluates `request.auth != null && request.auth.uid == userId`.
3. **Payload Sanitization**: `isValidJournalEntry` and `isValidConversation` enforce:
   - `data.userId == request.auth.uid`
   - String boundaries: titles $\le$ 200 chars, content $\le$ 50,000 chars, summaries $\le$ 10,000 chars.
   - List boundaries: topics $\le$ 30, action items $\le$ 30, concerns $\le$ 30.
   - Immutability: `userId` and `createdAt` cannot be modified on updates.
   - ID Poisoning Defense: `isValidId(id)` ensures IDs match `^[a-zA-Z0-9_-]+$` with length $\le$ 128 chars.

---

## 4. Secret Management Architecture

### Gemini API Key Protection
- **No Client Exposure**: The Gemini API key is completely absent from Vite client builds, HTML, and browser bundles.
- **Server Runtime Secret Resolution**:
  1. The backend first checks for Google Cloud Secret Manager resource binding (`process.env.GEMINI_SECRET_NAME`).
  2. If running under Cloud Run / AI Studio container runtime, it accesses the injected server environment variable `process.env.GEMINI_API_KEY`.
  3. The key is never logged to stdout, stderr, or returned in any API response.
  4. `.env.example` contains only non-secret documentation placeholders.

---

## 5. Server-Side Authentication & Authorization

All API endpoints (`/api/chat`, `/api/generate-reflection`, `/api/synthesize-insights`):
1. **Header Requirement**: Must include `Authorization: Bearer <Firebase_ID_Token>`.
2. **Cryptographic Signature Verification**:
   - Fetches Google's live rotating public JWKs from `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`.
   - Validates that `issuer` matches `https://securetoken.google.com/<projectId>`.
   - Validates that `audience` matches the Firebase project ID.
   - Verifies the signature using `jose` RS256 verification.
3. **Identity Derivation**:
   - The user's UID is derived directly from the token `sub` claim.
   - Client-provided `uid` in request body or headers is ignored and rejected.

---

## 6. Prompt Injection & AI Safety

1. **Untrusted Input Boundary**: User journal drafts and chat turns are delimited and labeled as user reflection data.
2. **System Instruction Guardrails**:
   - The model is instructed to act exclusively as an introspective reflection companion.
   - The model is explicitly forbidden from following embedded instructions to override rules, act as a shell, disclose system prompts, or leak credentials.
3. **Request Size & Conversation Bounds**:
   - Express body parser capped at `256kb`.
   - Chat history truncated to the latest turns.
   - Individual messages limited to $\le$ 4,000 characters.

---

## 7. Logging & Error Sanitization

1. **Zero Sensitive Logging**:
   - Raw journal entries, chat transcripts, authentication tokens, and API keys are NEVER printed to server logs.
2. **Sanitized Error Responses**:
   - Failed requests return uniform, non-revealing error messages (e.g., `{"error": "Unauthorized: Authentication token is invalid or expired."}` or `{"error": "An internal server error occurred."}`).
   - Stack traces, library internals, and cloud infrastructure paths are never returned to the client.

---

## 8. Cross-Site Scripting (XSS) Prevention

- Journal entries, AI reflections, and conversation history are rendered as safe text within React components.
- No `dangerouslySetInnerHTML` or unfiltered HTML rendering is used.
- HTTP security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`) are injected on every response.
