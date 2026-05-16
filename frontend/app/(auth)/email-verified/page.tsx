"use client";

import Link from "next/link";
import { Diamond, CheckCircle } from "lucide-react";
import Image from "next/image";
export default function EmailVerifiedPage() {
  return (
    <div className="min-h-screen bg-[var(--agora-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-[var(--agora-surface)] border border-[var(--agora-line)] rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-md)]">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 justify-center"
            >
              <Image src="/logo.png" alt="Agora" width={45} height={45} />
              <span className="font-display text-2xl font-bold text-[var(--agora-primary)]">
                Agora
              </span>
            </Link>
          </div>

          {/* Success content */}
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-[var(--agora-green)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--agora-ink)]">
              Adresse e-mail vérifiée !
            </h2>
            <p className="text-sm text-[var(--agora-mid)]">
              Votre compte est maintenant actif. Vous pouvez accéder à Agora.
            </p>
            <Link
              href="/"
              className="block w-full text-center py-2.5 px-4 rounded-[var(--radius-md)] bg-[var(--agora-primary)] text-white font-medium hover:opacity-90 transition-opacity"
            >
              Accéder à Agora
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
