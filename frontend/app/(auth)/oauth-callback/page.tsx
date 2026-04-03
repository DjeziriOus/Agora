"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authClient } from "@/lib/auth-client";
import { shopsApi } from "@/lib/api";
import { Diamond, User, Store } from "lucide-react";
import { cn } from "@/lib/utils";

function OAuthCallbackContent() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [status, setStatus] = useState("Chargement...");
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"buyer" | "seller">("buyer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;

    // If the user already has an explicitly set role (returning user),
    // skip the picker and redirect immediately.
    // We detect "returning" by checking sessionStorage for a flag
    // set by the login/register pages.
    const needsPick = sessionStorage.getItem("agora_oauth_needs_role");
    sessionStorage.removeItem("agora_oauth_needs_role");

    if (!needsPick) {
      // Returning user via direct navigation — just redirect
      redirectByRole(user.role);
      return;
    }

    // New OAuth sign-in — show the role picker
    setSelectedRole((user.role as "buyer" | "seller") || "buyer");
    setShowRolePicker(true);
  }, [isLoading, user]);

  const redirectByRole = async (role: string) => {
    if (role === "seller") {
      setStatus("Redirection vers votre espace vendeur...");
      const hasStore = await shopsApi
        .getMyStore()
        .then((shop) => !!shop)
        .catch(() => false);
      router.replace(hasStore ? "/vendeur" : "/vendeur/boutique");
    } else {
      setStatus("Redirection...");
      router.replace("/catalogue");
    }
  };

  const handleRoleConfirm = async () => {
    if (!user) return;
    setIsSubmitting(true);
    setStatus("Configuration de votre profil...");

    // Update role if different from current
    if (user.role !== selectedRole) {
      try {
        await authClient.updateUser({
          role: selectedRole,
        } as Parameters<typeof authClient.updateUser>[0]);
      } catch {
        // Continue with redirect even if update fails
      }
    }

    setShowRolePicker(false);
    await redirectByRole(selectedRole);
  };

  // ── Role picker UI ─────────────────────────────────────────────────────────
  if (showRolePicker) {
    return (
      <div className="min-h-screen bg-[var(--agora-bg)] flex items-center justify-center p-4">
        <div className="w-full max-w-[420px]">
          <div className="bg-[var(--agora-surface)] border border-[var(--agora-line)] rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-md)]">
            {/* Logo */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 justify-center">
                <Diamond className="w-6 h-6 text-[var(--agora-primary)]" />
                <span className="font-display text-2xl font-bold text-[var(--agora-primary)]">
                  Agora
                </span>
              </div>
              {user?.photo && (
                <img
                  src={user.photo}
                  alt=""
                  className="w-16 h-16 rounded-full mx-auto mt-4 object-cover border-2 border-[var(--agora-line)]"
                  referrerPolicy="no-referrer"
                />
              )}
              <p className="mt-3 text-lg font-semibold text-[var(--agora-ink)]">
                Bienvenue, {user?.firstName || ""}!
              </p>
              <p className="mt-1 text-sm text-[var(--agora-mid)]">
                Comment souhaitez-vous utiliser Agora ?
              </p>
            </div>

            {/* Role buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setSelectedRole("buyer")}
                className={cn(
                  "flex flex-col items-center gap-2 py-5 px-4 rounded-[var(--radius-md)] border-2 font-medium text-sm transition-all",
                  selectedRole === "buyer"
                    ? "border-[var(--agora-primary)] bg-[var(--agora-accent)] text-[var(--agora-primary)]"
                    : "border-[var(--agora-line)] text-[var(--agora-mid)] hover:border-[var(--agora-primary)]/50",
                )}
              >
                <User className="w-6 h-6" />
                <span className="font-semibold">Client</span>
                <span className="text-xs text-[var(--agora-mid)] font-normal">
                  Acheter des produits
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("seller")}
                className={cn(
                  "flex flex-col items-center gap-2 py-5 px-4 rounded-[var(--radius-md)] border-2 font-medium text-sm transition-all",
                  selectedRole === "seller"
                    ? "border-[var(--agora-primary)] bg-[var(--agora-accent)] text-[var(--agora-primary)]"
                    : "border-[var(--agora-line)] text-[var(--agora-mid)] hover:border-[var(--agora-primary)]/50",
                )}
              >
                <Store className="w-6 h-6" />
                <span className="font-semibold">Vendeur</span>
                <span className="text-xs text-[var(--agora-mid)] font-normal">
                  Vendre mes produits
                </span>
              </button>
            </div>

            {/* Confirm button */}
            <button
              onClick={handleRoleConfirm}
              disabled={isSubmitting}
              className={cn(
                "w-full py-3 px-4 rounded-[var(--radius-md)] font-medium text-white transition-all",
                isSubmitting
                  ? "bg-[var(--agora-primary)]/70 cursor-not-allowed"
                  : "bg-[var(--agora-primary)] hover:bg-[var(--agora-primary-hover)] active:scale-[0.98]",
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Configuration...
                </span>
              ) : (
                "Continuer"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading / redirect state ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--agora-bg)] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <Diamond className="w-6 h-6 text-[var(--agora-primary)]" />
          <span className="font-display text-2xl font-bold text-[var(--agora-primary)]">
            Agora
          </span>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[var(--agora-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--agora-mid)] text-sm">{status}</p>
        </div>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--agora-bg)] flex items-center justify-center p-4">
          <div className="w-8 h-8 border-4 border-[var(--agora-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
