"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, X, Diamond } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useAuth();
  const searchParams = useSearchParams();

    const handleSubmit = async (e: React.FormEvent) => {// utilise setError et await login depuis useAuth et catch err et affiche le message d'erreur qui viens depuis le backend
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
              Connectez-vous à votre compte
            </p>
          </div>


          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-3 rounded-[var(--radius-md)] bg-[#FFEBEE] border border-[var(--agora-danger)] flex items-center justify-between">
              <p className="text-sm text-[var(--agora-danger)]">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-[var(--agora-danger)] hover:text-[#C62828]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full px-4 py-2.5 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-[var(--agora-ink)] placeholder:text-[var(--agora-text-disabled)] focus:outline-none focus:border-[var(--agora-primary)] focus:ring-2 focus:ring-[var(--agora-primary)]/20 transition-colors"
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--agora-ink)] mb-1.5"
              >
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-[var(--agora-ink)] placeholder:text-[var(--agora-text-disabled)] focus:outline-none focus:border-[var(--agora-primary)] focus:ring-2 focus:ring-[var(--agora-primary)]/20 transition-colors"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--agora-mid)] hover:text-[var(--agora-ink)]"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full py-3 px-4 rounded-[var(--radius-md)] font-medium text-white transition-all",
                isLoading
                  ? "bg-[var(--agora-primary)]/70 cursor-not-allowed"
                  : "bg-[var(--agora-primary)] hover:bg-[var(--agora-primary-hover)] active:scale-[0.98]"
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="mt-6 text-center text-sm text-[var(--agora-mid)]">
            Pas encore de compte ?{" "}
            <Link
              href="/register"
              className="text-[var(--agora-primary)] font-medium hover:underline"
            >
              Créer un compte
            </Link>
          </p>

          {/* Demo Credentials */}
          <div className="mt-6 p-3 rounded-[var(--radius-md)] bg-[var(--agora-accent)] border border-[var(--agora-line)]">
            <p className="text-xs text-[var(--agora-mid)] font-medium mb-2">
              Comptes de démonstration :
            </p>
            <div className="space-y-1 text-xs text-[var(--agora-mid)]">
              <p>
                <span className="font-mono">client@agora.fr</span> / password123
              </p>
              <p>
                <span className="font-mono">vendeur@agora.fr</span> / password123
              </p>
            </div>
          </div>
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
