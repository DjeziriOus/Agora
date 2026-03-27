"use client";

import Link from "next/link";
import { Diamond, ArrowRight, ShoppingBag, Store, Shield } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { mockProducts, mockCategories } from "@/lib/mockData";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const categoryIcons: Record<string, string> = {
  Papeterie: "📝",
  Maison: "🏠",
  Mode: "👜",
  Bijoux: "💎",
  Art: "🎨",
  Alimentation: "🍯",
  Beauté: "✨",
  Jouets: "🧸",
};

export default function HomePage() {
  const featuredProducts = mockProducts.slice(0, 8);
  const featuredCategories = mockCategories.slice(0, 8);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
      
      </main>

      <Footer />
    </div>
  );
}
