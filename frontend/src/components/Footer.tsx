"use client";

import Link from "next/link";
import { Diamond } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[var(--agora-ink)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Diamond className="w-6 h-6 text-[var(--agora-gold)]" />
              <span className="font-display text-xl font-bold">Agora</span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed">
              La marketplace multi-boutiques française. Découvrez des créateurs
              passionnés et des produits uniques.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-display font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/catalogue"
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  Catalogue
                </Link>
              </li>
              <li>
                <Link
                  href="/recherche"
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  Recherche
                </Link>
              </li>
            </ul>
          </div>

          {/* Vendeurs */}
          <div>
            <h4 className="font-display font-semibold mb-4">Vendeurs</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/register"
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  Ouvrir ma boutique
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  Connexion vendeur
                </Link>
              </li>
            </ul>
          </div>

          {/* Aide */}
          <div>
            <h4 className="font-display font-semibold mb-4">Aide</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-white/60 text-sm">
                  Contact : contact@agora.fr
                </span>
              </li>
              <li>
                <span className="text-white/60 text-sm">
                  Tél : +33 1 23 45 67 89
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} Agora. Tous droits réservés.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="#"
                className="text-white/40 hover:text-white text-sm transition-colors"
              >
                Conditions générales
              </Link>
              <Link
                href="#"
                className="text-white/40 hover:text-white text-sm transition-colors"
              >
                Politique de confidentialité
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
