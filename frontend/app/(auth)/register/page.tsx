"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Eye, EyeOff, X, Diamond, User, Store } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

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
  const [role, setRole] = useState<UserRole>("client");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, isLoading } = useAuth();

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password]
  );

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
      await register({ firstName, lastName, email, password, role });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--agora-bg)] flex items-center justify-center p-4 py-8">
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
              Créez votre compte
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
                      : "border-[var(--agora-line)] text-[var(--agora-mid)] hover:border-[var(--agora-primary)]/50"
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
                      : "border-[var(--agora-line)] text-[var(--agora-mid)] hover:border-[var(--agora-primary)]/50"
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
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
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
                      : "border-[var(--agora-line)] focus:border-[var(--agora-primary)] focus:ring-[var(--agora-primary)]/20"
                  )}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--agora-mid)] hover:text-[var(--agora-ink)]"
                  aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
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
                  : "bg-[var(--agora-primary)] hover:bg-[var(--agora-primary-hover)] active:scale-[0.98]"
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
