"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Build page number slots with ellipsis for large ranges.
 * E.g. [1, '…', 4, 5, 6, '…', 20]
 */
function getPageSlots(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const slots: (number | "…")[] = [1];

  if (current > 3) {
    slots.push("…");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    slots.push(i);
  }

  if (current < total - 2) {
    slots.push("…");
  }

  slots.push(total);

  return slots;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const slots = getPageSlots(currentPage, totalPages);

  const handlePageChange = (page: number) => {
    onPageChange(page);
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-center gap-3 mt-8",
        className
      )}
    >
      <div className="flex items-center gap-1">
        {/* First page */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-[var(--agora-line)] text-[var(--agora-mid)] hover:text-[var(--agora-ink)] hover:border-[var(--agora-primary)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--agora-line)] disabled:hover:text-[var(--agora-mid)] transition-colors"
          aria-label="Première page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-[var(--agora-line)] text-[var(--agora-mid)] hover:text-[var(--agora-ink)] hover:border-[var(--agora-primary)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--agora-line)] disabled:hover:text-[var(--agora-mid)] transition-colors"
          aria-label="Page précédente"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {slots.map((slot, idx) =>
          slot === "…" ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-10 h-10 flex items-center justify-center text-sm text-[var(--agora-mid)]"
            >
              …
            </span>
          ) : (
            <button
              key={slot}
              onClick={() => handlePageChange(slot)}
              className={cn(
                "w-10 h-10 rounded-lg text-sm font-medium transition-all",
                currentPage === slot
                  ? "bg-[var(--agora-primary)] text-white shadow-sm"
                  : "border border-[var(--agora-line)] text-[var(--agora-mid)] hover:text-[var(--agora-ink)] hover:border-[var(--agora-primary)]"
              )}
              aria-label={`Page ${slot}`}
              aria-current={currentPage === slot ? "page" : undefined}
            >
              {slot}
            </button>
          )
        )}

        {/* Next page */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-[var(--agora-line)] text-[var(--agora-mid)] hover:text-[var(--agora-ink)] hover:border-[var(--agora-primary)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--agora-line)] disabled:hover:text-[var(--agora-mid)] transition-colors"
          aria-label="Page suivante"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last page */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-[var(--agora-line)] text-[var(--agora-mid)] hover:text-[var(--agora-ink)] hover:border-[var(--agora-primary)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--agora-line)] disabled:hover:text-[var(--agora-mid)] transition-colors"
          aria-label="Dernière page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Page info */}
      <span className="text-sm text-[var(--agora-mid)]">
        Page {currentPage} sur {totalPages}
      </span>
    </div>
  );
}
