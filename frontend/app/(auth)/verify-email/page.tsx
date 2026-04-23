"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Diamond } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const RESEND_COOLDOWN_SECONDS = 60;
const RESEND_COOLDOWN_STORAGE_KEY_PREFIX =
  "agora_resend_verification_available_at";

function getResendCooldownStorageKey(email: string) {
  return `${RESEND_COOLDOWN_STORAGE_KEY_PREFIX}_${email.trim().toLowerCase()}`;
}

function VerifyEmailContent() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const {
    resendVerification,
    pendingVerificationEmail,
    clearPendingVerificationEmail,
    isLoading,
  } = useAuth();
  const router = useRouter();
  const verificationEmail = pendingVerificationEmail ?? "";

  useEffect(() => {
    if (isLoading) return;
    if (!pendingVerificationEmail) router.replace("/login");
  }, [isLoading, pendingVerificationEmail, router]);

  // Restore any persisted resend cooldown for the current pending verification email.
  useEffect(() => {
    if (!verificationEmail) {
      setCooldownRemaining(0);
      return;
    }

    try {
      const availableAt = Number(
        window.sessionStorage.getItem(
          getResendCooldownStorageKey(verificationEmail),
        ),
      );
      const remainingMs = availableAt - Date.now();

      if (!availableAt || remainingMs <= 0) {
        window.sessionStorage.removeItem(
          getResendCooldownStorageKey(verificationEmail),
        );
        setCooldownRemaining(0);
        return;
      }

      setCooldownRemaining(Math.ceil(remainingMs / 1000));
    } catch {
      setCooldownRemaining(0);
    }
  }, [verificationEmail]);

  // Keep the resend countdown ticking while the current cooldown window is still active.
  useEffect(() => {
    if (!verificationEmail || cooldownRemaining <= 0) return;

    const intervalId = window.setInterval(() => {
      try {
        const availableAt = Number(
          window.sessionStorage.getItem(
            getResendCooldownStorageKey(verificationEmail),
          ),
        );
        const remainingMs = availableAt - Date.now();

        if (!availableAt || remainingMs <= 0) {
          window.sessionStorage.removeItem(
            getResendCooldownStorageKey(verificationEmail),
          );
          setCooldownRemaining(0);
          return;
        }

        setCooldownRemaining(Math.ceil(remainingMs / 1000));
      } catch {
        setCooldownRemaining((current) => (current > 0 ? current - 1 : 0));
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [cooldownRemaining, verificationEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Enforce the resend cooldown and only call the backend when the page still has a valid pending email.
  const handleResendVerification = async () => {
    setError(null);
    setMessage(null);

    if (!verificationEmail) {
      setError(
        "Adresse e-mail introuvable. Retournez à la page de connexion pour réessayer.",
      );
      return;
    }

    if (cooldownRemaining > 0) {
      setError(
        `Veuillez patienter encore ${cooldownRemaining}s avant de renvoyer l'e-mail.`,
      );
      return;
    }

    setIsResending(true);

    try {
      await resendVerification();
      const availableAt = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
      window.sessionStorage.setItem(
        getResendCooldownStorageKey(verificationEmail),
        String(availableAt),
      );
      setCooldownRemaining(RESEND_COOLDOWN_SECONDS);
      setMessage(
        "L'e-mail de vérification a été renvoyé. Consultez votre boîte de réception.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--agora-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        {/* Card */}
        <div className="bg-[var(--agora-surface)] border border-[var(--agora-line)] rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-md)]">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 justify-center"
            >
              <Diamond className="w-6 h-6 text-[var(--agora-primary)]" />
              <span className="font-display text-2xl font-bold text-[var(--agora-primary)]">
                Agora
              </span>
            </Link>
            <p className="mt-2 text-[var(--agora-mid)]">
              Vérifier votre adresse mail
            </p>
          </div>

          {error ? (
            <p className="mb-4 rounded-[var(--radius-md)] border border-[var(--agora-danger)] bg-[#FFEBEE] px-4 py-3 text-sm text-[var(--agora-danger)]">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="mb-4 rounded-[var(--radius-md)] border border-[var(--agora-green)] bg-[#E8F5E9] px-4 py-3 text-sm text-[var(--agora-green)]">
              {message}
            </p>
          ) : null}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--agora-ink)] mb-1.5"
              >
                Veuillez vérifier votre adresse e-mail dans votre boîte de
                réception avant de continuer.
              </label>
            </div>

            {/* Resend the verification email */}
            <p className="mt-6 text-center text-sm text-[var(--agora-mid)]">
              Pas encore reçu le e-mail ?{" "}
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={
                  isResending || cooldownRemaining > 0 || !verificationEmail
                }
                className="text-[var(--agora-primary)] font-medium hover:underline disabled:opacity-60 disabled:no-underline"
              >
                {isResending
                  ? "Renvoi en cours..."
                  : cooldownRemaining > 0
                    ? `Renvoyer dans ${cooldownRemaining}s`
                    : "Renvoyer l'e-mail de vérification"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--agora-bg)] flex items-center justify-center p-4">
          <div className="w-8 h-8 border-4 border-[var(--agora-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
