"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <h2 style={{ fontSize: "2.25rem", fontWeight: "bold", marginBottom: "1rem" }}>404 - Page non trouvée</h2>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Link href="/" style={{ padding: "0.5rem 1rem", background: "#1a1a1a", color: "white", textDecoration: "none", borderRadius: "4px" }}>
        Retour à l'accueil
      </Link>
    </div>
  );
}
