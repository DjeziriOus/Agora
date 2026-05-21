"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error: apiError } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (apiError) {
        setError(apiError.message || "Une erreur est survenue.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--agora-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-agora-surface border border-[var(--agora-line)] rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-md)]">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1 justify-center"
            >
              <Image src="/logo.png" alt="Agora" width={45} height={45} />
              <span className="font-display text-2xl font-bold text-[var(--agora-primary)]">
                Agora
              </span>
            </Link>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-[var(--agora-primary)]/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-[var(--agora-primary)]" />
              </div>
              <h1 className="text-xl font-semibold text-[var(--agora-ink)]">
                Email envoyé
              </h1>
              <p className="text-sm text-[var(--agora-mid)]">
                Si un compte existe avec l&apos;adresse <strong>{email}</strong>,
                vous recevrez un lien de réinitialisation dans quelques instants.
              </p>
              <p className="text-xs text-[var(--agora-mid)]">
                Pensez à vérifier vos spams si vous ne voyez rien.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-sm text-[var(--agora-primary)] font-medium hover:underline mt-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-semibold text-[var(--agora-ink)]">
                  Mot de passe oublié
                </h1>
                <p className="mt-2 text-sm text-[var(--agora-mid)]">
                  Entrez votre adresse email et nous vous enverrons un lien pour
                  réinitialiser votre mot de passe.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3 rounded-[var(--radius-md)] bg-[#FFEBEE] border border-[var(--agora-danger)]">
                  <p className="text-sm text-[var(--agora-danger)]">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-[var(--agora-ink)] mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="w-full px-4 py-2.5 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-[var(--agora-ink)] placeholder:text-[var(--agora-text-disabled)] focus:outline-none focus:border-[var(--agora-primary)] focus:ring-2 focus:ring-[var(--agora-primary)]/20 transition-colors"
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "w-full py-3 px-4 rounded-[var(--radius-md)] font-medium text-white transition-all",
                    isLoading
                      ? "bg-[var(--agora-primary)]/70 cursor-not-allowed"
                      : "bg-[var(--agora-primary)] hover:bg-[var(--agora-primary-hover)] active:scale-[0.98]",
                  )}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi...
                    </span>
                  ) : (
                    "Envoyer le lien"
                  )}
                </button>
              </form>

              <p className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-sm text-[var(--agora-primary)] font-medium hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour à la connexion
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
