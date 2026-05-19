/**
 * @file Provider React Query — instance unique du `QueryClient` pour l'app.
 *
 * Réglages par défaut :
 *   - staleTime: 60s        (évite les refetch agressifs en navigation rapide)
 *   - refetchOnWindowFocus: false (on ne re-fetch pas quand l'utilisateur revient)
 *   - retry: 1              (une seule tentative en cas d'échec réseau)
 *
 * Voir aussi : docs/modules/frontend/lib-other.md
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
