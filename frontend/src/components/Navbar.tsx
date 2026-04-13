"use client";

import Link from "next/link";
import { Search, ShoppingCart, ChevronDown, User, LogOut, Package } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

function AgoraIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M14 3L27 25H1L14 3Z" fill="var(--agora-gold)" />
      <path d="M14 10L23 25H5L14 10Z" fill="var(--agora-primary)" />
    </svg>
  );
}

export function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { itemCount } = useCart();
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/recherche?q=${encodeURIComponent(search.trim())}`);
    }
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[var(--agora-line)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-4 h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <AgoraIcon />
            <span className="font-bold text-[var(--agora-ink)] text-lg leading-none">
              Agora
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden sm:block shrink-0">
            <Link
              href="/catalogue"
              className="text-sm font-medium text-[var(--agora-ink)] hover:text-[var(--agora-primary)] transition-colors"
            >
              Catalogue
            </Link>
          </nav>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--agora-mid)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher des produits..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--agora-line)] rounded-lg bg-[var(--agora-bg)] focus:outline-none focus:border-[var(--agora-primary)] focus:bg-white transition-colors"
              />
            </div>
          </form>

          {/* Right : panier + auth */}
          <div className="flex items-center gap-1 shrink-0">

            {/* Panier */}
            <Link
              href="/panier"
              className="relative p-2 rounded-lg hover:bg-[var(--agora-accent)] transition-colors"
              aria-label="Panier"
            >
              <ShoppingCart className="w-5 h-5 text-[var(--agora-ink)]" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[var(--agora-primary)] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            {!isLoading && (
              isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg hover:bg-[var(--agora-accent)] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--agora-primary)] text-white text-sm font-semibold flex items-center justify-center">
                      {initials}
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[var(--agora-mid)] transition-transform duration-200 ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[var(--agora-line)] rounded-xl shadow-[var(--shadow-md)] py-1 z-50">
                      <div className="px-4 py-3 border-b border-[var(--agora-line)]">
                        <p className="font-semibold text-sm text-[var(--agora-ink)]">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-[var(--agora-mid)] mt-0.5 truncate">
                          {user?.email}
                        </p>
                      </div>
                      <Link
                        href="/compte/commandes"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--agora-ink)] hover:bg-[var(--agora-accent)] transition-colors"
                      >
                        <Package className="w-4 h-4 text-[var(--agora-mid)]" />
                        Mes commandes
                      </Link>
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--agora-danger)] hover:bg-[var(--agora-accent)] transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 bg-[var(--agora-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--agora-primary-hover)] transition-colors"
                >
                  <User className="w-4 h-4" />
                  Connexion
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
