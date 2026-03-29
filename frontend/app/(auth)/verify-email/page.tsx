"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Diamond } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

function LoginContent() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const searchParams = useSearchParams();
  const verificationEmail = searchParams.get("email") ?? "";
  const { resendVerification } = useAuth();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleResendVerification = async () => {
    setError(null);
    setMessage(null);

    if (!verificationEmail) {
      setError(
        "Adresse e-mail introuvable. Retournez à la page de connexion pour réessayer."
      );
      return;
    }

    setIsResending(true);

    try {
      await resendVerification(verificationEmail);
      setMessage(
        "L'e-mail de vérification a été renvoyé. Consultez votre boîte de réception."
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
            <Link href="/" className="inline-flex items-center gap-2 justify-center">
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
                Veuillez vérifier votre adresse e-mail dans votre boîte de réception avant de continuer.
              </label>


            </div>


            {/* Resend the verification email */}
            <p className="mt-6 text-center text-sm text-[var(--agora-mid)]">
              Pas encore reçu le e-mail ?{" "}
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                className="text-[var(--agora-primary)] font-medium hover:underline"
              >
                {isResending
                  ? "Renvoi en cours..."
                  : "Renvoyer l'e-mail de vérification"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--agora-bg)] flex items-center justify-center p-4">
          <div className="w-8 h-8 border-4 border-[var(--agora-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
