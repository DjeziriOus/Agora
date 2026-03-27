"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  reviewCount,
  className,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }).map((_, index) => {
          const fillPercentage = Math.min(
            100,
            Math.max(0, (rating - index) * 100)
          );
          
          return (
            <div key={index} className="relative">
              {/* Background star (empty) */}
              <Star
                className={cn(
                  sizeClasses[size],
                  "text-[var(--agora-line)] fill-[var(--agora-line)]"
                )}
              />
              {/* Foreground star (filled) */}
              {fillPercentage > 0 && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fillPercentage}%` }}
                >
                  <Star
                    className={cn(
                      sizeClasses[size],
                      "text-[var(--agora-gold)] fill-[var(--agora-gold)]"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showValue && (
        <span
          className={cn(
            textSizeClasses[size],
            "font-medium text-[var(--agora-ink)]"
          )}
        >
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span
          className={cn(
            textSizeClasses[size],
            "text-[var(--agora-mid)]"
          )}
        >
          ({reviewCount} avis)
        </span>
      )}
    </div>
  );
}
