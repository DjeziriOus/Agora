"use client";

import Link from "next/link";

export function Navbar() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          Agora
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/">Accueil</Link>
          <Link href="/catalogue">Catalogue</Link>
          <Link href="/vendeur">Vendeur</Link>
          <Link href="/login">Connexion</Link>
          <Link href="/register">Inscription</Link>
        </nav>
      </div>
    </header>
  );
}