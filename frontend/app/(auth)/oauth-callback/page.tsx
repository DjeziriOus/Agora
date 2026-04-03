"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authClient } from "@/lib/auth-client";
import { shopsApi } from "@/lib/api";
import { Diamond } from "lucide-react";

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const [status, setStatus] = useState("Finalisation de votre compte...");

  useEffect(() => {
    if (isLoading) return;

    const handleCallback = async () => {
      const role = searchParams.get("role");

      // If a role was requested (from register page) and user exists, update it
      if (role && (role === "seller" || role === "buyer") && user) {
        if (user.role !== role) {
        setStatus("Configuration de votre profil...");
        try {
            await authClient.updateUser({ role } as Parameters<typeof authClient.updateUser>[0]);
        } catch {
          // Role update failed — continue with default role
          }
        }
      }

      // Redirect based on role
      const finalRole = role || user?.role || "buyer";

      if (finalRole === "seller") {
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

    handleCallback();
  }, [isLoading, user, searchParams, router]);

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
