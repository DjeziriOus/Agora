"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Eye, EyeOff, X, Diamond, User, Store } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type UserRole = "buyer" | "seller";

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) {
    return { score, label: "Faible", color: "var(--agora-danger)" };
  }
  if (score <= 3) {
    return { score, label: "Moyen", color: "var(--agora-warning)" };
  }
  return { score, label: "Fort", color: "var(--agora-green)" };
}

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("buyer");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const {
    register,
    isLoading,
    ensureAuthConfig,
    setPendingVerificationEmail,
    clearPendingVerificationEmail,
  } = useAuth();
  const router = useRouter();

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password],
  );

  // Register the user, then follow the backend verification policy without exposing the email in the URL.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    try {
      const { emailVerified } = await register({
        firstName,
        lastName,
        email,
        password,
        role,
      });
      // const shouldVerifyEmail = await ensureAuthConfig();

      if (!emailVerified) {
        setPendingVerificationEmail(email);
        router.push("/verify-email");
        return;
      }

      clearPendingVerificationEmail();
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const handleGoogleRegister = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      sessionStorage.setItem("agora_oauth_needs_role", "true");
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "http://localhost:3000/oauth-callback",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'inscription avec Google",
      );
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--agora-bg)] flex items-center justify-center p-4 py-8">
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
            <p className="mt-2 text-[var(--agora-mid)]">Créez votre compte</p>
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
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--agora-ink)] mb-2">
                Je suis
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("buyer")}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 px-4 rounded-[var(--radius-md)] border-2 font-medium text-sm transition-all",
                    role === "buyer"
                      ? "border-[var(--agora-primary)] bg-[var(--agora-accent)] text-[var(--agora-primary)]"
                      : "border-[var(--agora-line)] text-[var(--agora-mid)] hover:border-[var(--agora-primary)]/50",
                  )}
                >
                  <User className="w-4 h-4" />
                  Un client
                </button>
                <button
                  type="button"
                  onClick={() => setRole("seller")}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 px-4 rounded-[var(--radius-md)] border-2 font-medium text-sm transition-all",
                    role === "seller"
                      ? "border-[var(--agora-primary)] bg-[var(--agora-accent)] text-[var(--agora-primary)]"
                      : "border-[var(--agora-line)] text-[var(--agora-mid)] hover:border-[var(--agora-primary)]/50",
                  )}
                >
                  <Store className="w-4 h-4" />
                  Un vendeur
                </button>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-[var(--agora-ink)] mb-1.5"
                >
                  Prénom
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Marie"
                  className="w-full px-4 py-2.5 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-[var(--agora-ink)] placeholder:text-[var(--agora-text-disabled)] focus:outline-none focus:border-[var(--agora-primary)] focus:ring-2 focus:ring-[var(--agora-primary)]/20 transition-colors"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-[var(--agora-ink)] mb-1.5"
                >
                  Nom
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Dupont"
                  className="w-full px-4 py-2.5 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-[var(--agora-ink)] placeholder:text-[var(--agora-text-disabled)] focus:outline-none focus:border-[var(--agora-primary)] focus:ring-2 focus:ring-[var(--agora-primary)]/20 transition-colors"
                  autoComplete="family-name"
                />
              </div>
            </div>

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
                  autoComplete="new-password"
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
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[var(--agora-accent)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                          backgroundColor: passwordStrength.color,
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-medium"
                      style={{ color: passwordStrength.color }}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
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
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    "w-full px-4 py-2.5 pr-10 border rounded-[var(--radius-md)] text-[var(--agora-ink)] placeholder:text-[var(--agora-text-disabled)] focus:outline-none focus:ring-2 transition-colors",
                    confirmPassword && confirmPassword !== password
                      ? "border-[var(--agora-danger)] focus:border-[var(--agora-danger)] focus:ring-[var(--agora-danger)]/20"
                      : "border-[var(--agora-line)] focus:border-[var(--agora-primary)] focus:ring-[var(--agora-primary)]/20",
                  )}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--agora-mid)] hover:text-[var(--agora-ink)]"
                  aria-label={
                    showConfirmPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="mt-1 text-xs text-[var(--agora-danger)]">
                  Les mots de passe ne correspondent pas
                </p>
              )}
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
                  Création...
                </span>
              ) : (
                "Créer mon compte"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--agora-line)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--agora-surface)] px-3 text-[var(--agora-mid)]">ou</span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleRegister}
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
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {googleLoading ? "Redirection..." : "S'inscrire avec Google"}
          </button>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-[var(--agora-mid)]">
            Déjà un compte ?{" "}
            <Link
              href="/login"
              className="text-[var(--agora-primary)] font-medium hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
