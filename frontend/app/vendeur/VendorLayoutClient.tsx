"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { VendorSidebar } from "@/components/VendorSidebar";
import { useMyStore } from "@/hooks/useApi";
import { usePathname } from "next/navigation";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmailVerificationAlert from "@/components/EmailVerificationAlert";

export default function VendorLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const { data: store, isLoading: isStoreLoading } = useMyStore();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isStoreLoading) {
      if (!user) {
        router.push("/login?redirect=/vendeur");
      } else if (user.role !== "seller") {
        router.push("/");
      } else if (
        !store &&
        pathname !== "/vendeur/boutique" &&
        !pathname.startsWith("/vendeur/parametres")
      ) {
        router.push("/vendeur/boutique");
      }
    }
  }, [user, isLoading, store, isStoreLoading, router, pathname]);

  if (isLoading || isStoreLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== "seller") return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <VendorSidebar />
      <main className="lg:pl-64 min-h-screen">
        <div className="p-6 lg:p-8">
          <EmailVerificationAlert user={user} />
          {children}
        </div>
      </main>
    </div>
  );
}
