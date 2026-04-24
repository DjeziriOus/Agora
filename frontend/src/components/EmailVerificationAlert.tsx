"use client";

import { useState, useCallback } from "react";
import { Package, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/context/AuthContext';

export default function EmailVerificationAlert({user}: {user: User}) {
  const { resendVerification } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = useCallback(async () => {
    if (!user?.email || isSending) return;
    setIsSending(true);
    try {
      await resendVerification();
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch {
      /* toast is handled by resendVerification */
    } finally {
      setIsSending(false);
    }
  }, [user?.email, isSending, resendVerification]);
  console.log(user)
  // Don't render if loading, no user, already verified, or dismissed
  if (!user || user.emailVerified) return null;

  return (
    <div className="flex items-start gap-4 p-4 mb-6 border-2 rounded-xl border-amber-300 bg-amber-50">
      <div className="p-2.5 rounded-full bg-amber-100 shrink-0">
        <Package className="h-5 w-5 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-amber-800 text-sm">
          Adresse email non vérifiée
        </h3>
        <p className="text-xs text-amber-700 mt-1">
          Vérifiez votre adresse email pour pouvoir accéder
          à toutes les fonctionnalités d&apos;Agora.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 border-amber-400 text-amber-700 hover:bg-amber-100"
        onClick={handleResend}
        disabled={isSending || sent}
      >
        {isSending ? (
          <><RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> Envoi…</>
        ) : sent ? (
          "Email envoyé ✓"
        ) : (
          "Renvoyer l\u0027email"
        )}
      </Button>
    </div>
  )
}