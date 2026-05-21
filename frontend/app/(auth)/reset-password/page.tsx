"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!token) {
      setError("Lien de réinitialisation invalide ou expiré.");
      return;
    }

    setIsLoading(true);

    try {
      const { error: apiError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (apiError) {
        setError(apiError.message || "Une erreur est survenue.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[var(--agora-bg)] flex items-center justify-center p-4">
        <div className="w-full max-w-[420px]">
          <div className="bg-agora-surface border border-[var(--agora-line)] rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-md)] text-center space-y-4">
            <h1 className="text-xl font-semibold text-[var(--agora-ink)]">
              Lien invalide
            </h1>
            <p className="text-sm text-[var(--agora-mid)]">
              Ce lien de réinitialisation est invalide ou a expiré. Veuillez
              refaire une demande.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-1 text-sm text-[var(--agora-primary)] font-medium hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h1 className="text-xl font-semibold text-[var(--agora-ink)]">
                Mot de passe réinitialisé
              </h1>
              <p className="text-sm text-[var(--agora-mid)]">
                Votre mot de passe a été modifié avec succès. Vous pouvez
                maintenant vous connecter.
              </p>
              <Link
                href="/login"
                className={cn(
                  "inline-block w-full py-3 px-4 rounded-[var(--radius-md)] font-medium text-white text-center transition-all",
                  "bg-[var(--agora-primary)] hover:bg-[var(--agora-primary-hover)] active:scale-[0.98]",
                )}
              >
                Se connecter
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-semibold text-[var(--agora-ink)]">
                  Nouveau mot de passe
                </h1>
                <p className="mt-2 text-sm text-[var(--agora-mid)]">
                  Choisissez un nouveau mot de passe pour votre compte.
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
                    htmlFor="password"
                    className="block text-sm font-medium text-[var(--agora-ink)] mb-1.5"
                  >
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 pr-10 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-[var(--agora-ink)] placeholder:text-[var(--agora-text-disabled)] focus:outline-none focus:border-[var(--agora-primary)] focus:ring-2 focus:ring-[var(--agora-primary)]/20 transition-colors"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--agora-mid)] hover:text-[var(--agora-ink)]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-[var(--agora-mid)]">
                    Minimum 8 caractères
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-[var(--agora-ink)] mb-1.5"
                  >
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 pr-10 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-[var(--agora-ink)] placeholder:text-[var(--agora-text-disabled)] focus:outline-none focus:border-[var(--agora-primary)] focus:ring-2 focus:ring-[var(--agora-primary)]/20 transition-colors"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--agora-mid)] hover:text-[var(--agora-ink)]"
                    >
                      {showConfirm ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
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
                      Réinitialisation...
                    </span>
                  ) : (
                    "Réinitialiser le mot de passe"
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--agora-bg)] flex items-center justify-center p-4">
          <div className="w-8 h-8 border-4 border-[var(--agora-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
