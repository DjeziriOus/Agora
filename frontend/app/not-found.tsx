"use client";

import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main
        className="flex-1 flex bg-[var(--agora-ink)]"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        }}
      >
        <section className="relative flex flex-1 items-center overflow-hidden text-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-24 text-center sm:px-6">
            <div className="mb-8 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--agora-danger)]/30 bg-[var(--agora-danger)]/12 shadow-[0_0_40px_rgba(239,83,80,0.18)]">
                <TriangleAlert className="h-8 w-8 text-[var(--agora-danger)]" />
              </div>
            </div>

            <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              404 Not Found
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-white/70">
              Désolé, la page que vous recherchez n&apos;existe pas ou a été
              déplacée.
            </p>

            <div className="flex justify-center">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-lg bg-[var(--agora-primary)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--agora-primary-hover)]"
              >
                Retournez à l&apos;accueil
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
