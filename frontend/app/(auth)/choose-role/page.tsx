"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Diamond, User, Store } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { shopsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export default function ChooseRolePage() {
  const router = useRouter();
  const { user, isLoading, refreshSession } = useAuth();
  const [selectedRole, setSelectedRole] = useState<"buyer" | "seller">("buyer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "unassigned") {
      redirectByRole(user.role);
      return;
    }

    setSelectedRole("buyer");
  }, [isLoading, user, router]);

  const redirectByRole = async (role: string) => {
    if (role === "seller") {
      const hasStore = await shopsApi
        .getMyStore()
        .then((shop) => !!shop)
        .catch(() => false);
      router.replace(hasStore ? "/vendeur" : "/vendeur/boutique");
    } else {
      router.replace("/catalogue");
    }
  };

  const handleRoleConfirm = async () => {
    if (!user) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: updateError } = await authClient.updateUser({
        role: selectedRole,
      } as Parameters<typeof authClient.updateUser>[0]);

      if (updateError) {
        throw new Error(updateError.message ?? "Impossible de mettre a jour");
      }

      await refreshSession();
      await redirectByRole(selectedRole);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de mettre a jour votre role",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--agora-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-[var(--agora-surface)] border border-[var(--agora-line)] rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-md)]">
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

          {error && (
            <div className="mb-5 rounded-[var(--radius-md)] border border-[var(--agora-danger)] bg-[#FFEBEE] px-3 py-2 text-sm text-[var(--agora-danger)]">
              {error}
            </div>
          )}

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
