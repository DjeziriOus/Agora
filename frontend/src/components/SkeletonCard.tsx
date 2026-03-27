"use client";

import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "bg-[var(--agora-surface)] border border-[var(--agora-line)] rounded-[var(--radius-lg)] overflow-hidden",
        className
      )}
    >
      {/* Image Skeleton */}
      <div className="aspect-[4/3] bg-[var(--agora-accent)] animate-pulse" />

      {/* Content Skeleton */}
      <div className="p-4">
        {/* Badge */}
        <div className="w-16 h-5 bg-[var(--agora-accent)] rounded-full animate-pulse mb-2" />

        {/* Title */}
        <div className="h-5 bg-[var(--agora-accent)] rounded animate-pulse mb-1" />
        <div className="h-5 w-2/3 bg-[var(--agora-accent)] rounded animate-pulse mb-2" />

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 bg-[var(--agora-accent)] rounded animate-pulse"
              />
            ))}
          </div>
          <div className="w-16 h-4 bg-[var(--agora-accent)] rounded animate-pulse" />
        </div>

        {/* Store */}
        <div className="w-24 h-4 bg-[var(--agora-accent)] rounded animate-pulse mb-3" />

        {/* Price */}
        <div className="w-20 h-7 bg-[var(--agora-accent)] rounded animate-pulse mb-3" />

        {/* Button */}
        <div className="w-full h-10 bg-[var(--agora-accent)] rounded-[var(--radius-md)] animate-pulse" />
      </div>
    </div>
  );
}

export function SkeletonProductGrid({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
