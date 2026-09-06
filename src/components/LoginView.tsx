import React, { useState } from 'react';
import { Shield, Lock, Sparkles, BookOpen, Key, CheckCircle2 } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface LoginViewProps {
  onSuccess?: () => void;
  onOpenSecurityModal: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, onOpenSecurityModal }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setAuthError(
        err?.message?.includes('popup-closed-by-user')
          ? 'Sign-in window was closed. Please try again.'
          : err?.message || 'Failed to authenticate with Google.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-stone-100">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-8">
        {/* App Title & Mission */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-center shadow-md">
            <BookOpen className="w-7 h-7 text-stone-100" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Personal Gemini Journal
          </h1>
          <p className="text-sm text-stone-700 max-w-sm mx-auto leading-relaxed">
            A sanctuary for private, thoughtful journaling, multi-turn AI reflection, and longitudinal emotional insights.
          </p>
        </div>

        {/* Security & Isolation Callout */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
          <div className="flex items-center space-x-2 text-stone-900 font-semibold text-xs tracking-wide uppercase">
            <Shield className="w-4 h-4 text-emerald-700" />
            <span>Strict Privacy & Isolation Guarantee</span>
          </div>
          <ul className="text-xs text-stone-700 space-y-2">
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                <strong>Cryptographic User Isolation:</strong> All entries are stored under <code className="bg-stone-200/80 px-1 py-0.5 rounded text-[11px] font-mono">users/{'{uid}'}/...</code> with hardened Firestore security rules.
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Client-Exposed Secrets:</strong> The privileged Gemini API key is isolated server-side in Google Cloud Secret Manager runtime.
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                <strong>Authenticated Identity Verification:</strong> Backend verifies Firebase token signatures on every interaction.
              </span>
            </li>
          </ul>
        </div>

        {/* Error Feedback */}
        {authError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <Lock className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{authError}</span>
          </div>
        )}

        {/* Google Sign In Action */}
        <div className="space-y-4">
          <button
            id="google-sign-in-btn"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-sm flex items-center justify-center space-x-3 transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="text-center">
            <button
              id="login-view-security-details-btn"
              onClick={onOpenSecurityModal}
              className="text-xs text-stone-700 hover:text-stone-900 underline underline-offset-4 inline-flex items-center space-x-1"
            >
              <Key className="w-3.5 h-3.5 text-stone-600" />
              <span>Review System Security Specification</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
