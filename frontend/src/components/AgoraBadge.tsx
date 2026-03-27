"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type BadgeVariant =
  | "default"
  | "primary"
  | "green"
  | "gold"
  | "danger"
  | "warning"
  | "outline";

interface AgoraBadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-[var(--agora-accent)] text-[var(--agora-primary)]",
  primary: "bg-[var(--agora-primary)] text-white",
  green: "bg-[#E0F2F1] text-[#00796B]",
  gold: "bg-[#FFF3E0] text-[#E65100]",
  danger: "bg-[#FFEBEE] text-[var(--agora-danger)]",
  warning: "bg-[#FFF8E1] text-[var(--agora-warning)]",
  outline:
    "bg-transparent border border-[var(--agora-line)] text-[var(--agora-mid)]",
};

export function AgoraBadge({
  variant = "default",
  children,
  className,
}: AgoraBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
