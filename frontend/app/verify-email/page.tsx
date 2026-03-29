import Link from "next/link";
import { Mail, CheckCircle, ArrowLeft } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[var(--agora-bg)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl rounded-[var(--radius-xl)] bg-[var(--agora-surface)] border border-[var(--agora-line)] p-10 shadow-[var(--shadow-lg)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--agora-primary)]/10 text-[var(--agora-primary)] mb-8">
          <Mail className="h-10 w-10" />
        </div>

        <div className="text-center space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-[var(--agora-primary)]">
            Vérification requise
          </p>
          <h1 className="text-3xl font-bold text-[var(--agora-ink)]">
            Vérifiez votre boîte mail
          </h1>
          <p className="text-[var(--agora-mid)] max-w-xl mx-auto">
            Nous avons envoyé un email de confirmation à votre adresse. Ouvrez le message et cliquez sur le lien pour activer votre compte.
          </p>
          <div className="rounded-3xl border border-[var(--agora-line)] bg-[var(--agora-accent)] px-6 py-5 text-left">
            <div className="flex items-center gap-3 text-[var(--agora-primary)]">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Nouveau ? Vérifiez également vos spams.</span>
            </div>
            <p className="mt-3 text-sm text-[var(--agora-mid)]">
              Si vous ne recevez rien dans quelques minutes, retournez à la page de connexion et demandez un nouvel email.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--agora-line)] px-6 py-3 text-sm font-medium text-[var(--agora-ink)] hover:border-[var(--agora-primary)] hover:text-[var(--agora-primary)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à la connexion
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--agora-primary)] px-6 py-3 text-sm font-medium text-white hover:bg-[var(--agora-primary-hover)] transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
