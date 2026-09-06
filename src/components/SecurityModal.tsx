import React from 'react';
import { X, ShieldCheck, Lock, Key, Server, Database, UserCheck, CheckCircle2 } from 'lucide-react';

interface SecurityModalProps {
  onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Security Architecture & Threat Model
              </h2>
              <p className="text-[11px] text-stone-600">
                Personal Gemini Journal Zero-Trust Isolation Overview
              </p>
            </div>
          </div>
          <button
            id="close-security-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          {/* Section 1: Trust Boundaries */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-900 flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4 text-stone-700" />
              <span>1. Strict Trust Boundaries</span>
            </h3>
            <p className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              The client browser is treated as an <strong>untrusted environment</strong>. The user's authenticated identity is established via Firebase Authentication Google OAuth and cryptographically verified on every server API request using rotating Google JWKS public keys. Client-supplied UIDs are never trusted for authorization.
            </p>
          </div>

          {/* Section 2: Firestore Per-User Isolation */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-900 flex items-center space-x-1.5">
              <Database className="w-4 h-4 text-stone-700" />
              <span>2. Cloud Firestore Security Rules</span>
            </h3>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5 font-mono text-[11px]">
              <div>• Default deny catch-all: <span className="text-rose-700 font-semibold">match /{'{document=**}'} allow read, write: if false;</span></div>
              <div>• Strict path isolation: <span className="text-emerald-700 font-semibold">/users/{'{userId}'}/journalEntries/{'{entryId}'}</span></div>
              <div>• Authenticated ownership enforcement: <span className="text-stone-800">request.auth.uid == userId</span></div>
              <div>• Immutability guards on document creation and updates</div>
            </div>
          </div>

          {/* Section 3: Privileged Secret Isolation */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-900 flex items-center space-x-1.5">
              <Key className="w-4 h-4 text-stone-700" />
              <span>3. Secret Management</span>
            </h3>
            <p className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              The privileged <code>GEMINI_API_KEY</code> is stored securely in <strong>Google Cloud Secret Manager</strong> and accessed solely by the trusted Express backend at server runtime. It is never placed in frontend JavaScript, never exposed through client-side environment variables, and never committed to source control.
            </p>
          </div>

          {/* Section 4: Prompt Injection & Zero Sensitive Logging */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-900 flex items-center space-x-1.5">
              <Server className="w-4 h-4 text-stone-700" />
              <span>4. Prompt Injection & Safe Error Handling</span>
            </h3>
            <ul className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5 list-disc list-inside">
              <li>System instructions delineate untrusted journal text and forbid instruction override.</li>
              <li>Request payload boundaries: strictly limited body sizes and turn history.</li>
              <li>Zero logging of private journal content, auth tokens, or internal secrets to server console.</li>
              <li>Generic, sanitized error responses to client without stack traces.</li>
              <li>XSS protection: All content rendered safely through standard React text nodes without raw HTML injection.</li>
            </ul>
          </div>
        </div>

        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 text-white font-medium text-xs sm:text-sm hover:bg-stone-800 transition cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
