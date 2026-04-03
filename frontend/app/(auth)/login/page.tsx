"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, X, Diamond } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authClient } from "@/lib/auth-client";
import { shopsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, isLoading, emailNotVerified, clearEmailNotVerified } =
    useAuth();
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "http://localhost:3000/oauth-callback",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la connexion avec Google",
      );
      setGoogleLoading(false);
    }
  };

  // Consume the one-time unverified-email flag and redirect the user to the verification screen.
  useEffect(() => {
    if (!emailNotVerified) return;
    clearEmailNotVerified();
    router.push("/verify-email");
  }, [emailNotVerified, clearEmailNotVerified, router]);

  // Submit the credentials and surface any backend auth errors in the page banner.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const user = await login(email, password);
      if (!user) {
        return;
      }

      if (user.role === "seller") {
        const hasStore = await shopsApi
          .getMyStore()
          .then((store) => !!store)
          .catch(() => false);
        router.push(hasStore ? "/vendeur" : "/vendeur/boutique");
      } else {
        router.push("/catalogue");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de la connexion",
      );
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
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
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
                  : "bg-[var(--agora-primary)] hover:bg-[var(--agora-primary-hover)] active:scale-[0.98]",
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

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--agora-line)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--agora-surface)] px-3 text-[var(--agora-mid)]">
                ou
              </span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || isLoading}
            className={cn(
              "w-full py-3 px-4 rounded-[var(--radius-md)] font-medium text-[var(--agora-ink)] border border-[var(--agora-line)] bg-[var(--agora-surface)] flex items-center justify-center gap-3 transition-all",
              googleLoading || isLoading
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-[var(--agora-accent)] hover:border-[var(--agora-primary)]/40 active:scale-[0.98]",
            )}
          >
            {googleLoading ? (
              <span className="w-4 h-4 border-2 border-[var(--agora-mid)]/30 border-t-[var(--agora-mid)] rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {googleLoading ? "Redirection..." : "Continuer avec Google"}
          </button>

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
                <span className="font-mono">vendeur@agora.fr</span> /
                password123
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
