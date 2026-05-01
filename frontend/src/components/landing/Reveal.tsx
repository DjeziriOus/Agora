"use client";

import { type ReactNode, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/useInView";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}

export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const Component = as as "div";
  const style: CSSProperties = delay
    ? { transitionDelay: `${delay}ms` }
    : {};

  return (
    <Component
      ref={ref}
      style={style}
      className={cn("agora-reveal", inView && "is-visible", className)}
    >
      {children}
    </Component>
  );
}
