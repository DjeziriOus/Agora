"use client";

import { useState, useCallback } from "react";
import { Mail, X, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const DISMISSED_KEY = "agora_verification_banner_dismissed";

/**
 * Persistent banner shown to logged-in users whose email is not yet verified.
 * Appears above the main content with a "Resend verification" action.
 * Dismissible per session (sessionStorage) — reappears on next visit.
 */
export function VerificationBanner() {
  const { user, isLoading, resendVerification } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return window.sessionStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const handleResend = useCallback(async () => {
    if (!user?.email || isSending) return;
    setIsSending(true);
    try {
      await resendVerification(user.email);
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch {
      /* toast is handled by resendVerification */
    } finally {
      setIsSending(false);
    }
  }, [user?.email, isSending, resendVerification]);

  // Don't render if loading, no user, already verified, or dismissed
  if (isLoading || !user || user.emailVerified || dismissed) return null;

  return (
    <div
      className={cn(
        "relative bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/80",
        "animate-in slide-in-from-top duration-300",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-center gap-3 text-sm">
          <Mail className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-amber-800">
            <span className="font-medium">Vérifiez votre adresse email</span>{" "}
            pour passer pouvoir passer des commandes, et profiter de nos
            services.
          </p>
          <button
            onClick={handleResend}
            disabled={isSending || sent}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all",
              sent
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700 hover:bg-amber-200 active:scale-95",
            )}
          >
            {isSending ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : sent ? (
              "Email envoyé ✓"
            ) : (
              "Renvoyer l'email de verification"
            )}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-amber-500 hover:text-amber-700 transition-colors shrink-0"
            aria-label="Fermer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
