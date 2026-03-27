"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const { user, isAuthenticated, isSeller, isLoading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-[var(--agora-surface)] border-b border-[var(--agora-line)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold text-[var(--agora-primary)]"
          >
            Agora
          </Link>

          {/* Liens de navigation */}
          <nav className="hidden sm:flex items-center gap-6 text-sm text-[var(--agora-text-primary)]">
            <Link
              href="/"
              className="hover:text-[var(--agora-primary)] transition-colors"
            >
              Accueil
            </Link>
            <Link
              href="/catalogue"
              className="hover:text-[var(--agora-primary)] transition-colors"
            >
              Catalogue
            </Link>
            {isSeller && (
              <Link
                href="/vendeur"
                className="hover:text-[var(--agora-primary)] transition-colors"
              >
                Espace vendeur
              </Link>
            )}
          </nav>

          {/* Zone authentification */}
          <div className="flex items-center gap-3 text-sm">
            {isLoading ? null : isAuthenticated ? (
              <>
                <Link
                  href="/compte"
                  className="text-[var(--agora-text-primary)] hover:text-[var(--agora-primary)] transition-colors"
                >
                  {user?.firstName || "Mon compte"}
                </Link>
                <button
                  onClick={logout}
                  className="text-[var(--agora-text-secondary)] hover:text-[var(--agora-primary)] transition-colors"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-[var(--agora-text-primary)] hover:text-[var(--agora-primary)] transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="bg-[var(--agora-primary)] text-white px-4 py-1.5 rounded-md hover:bg-[var(--agora-primary-hover)] transition-colors"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
