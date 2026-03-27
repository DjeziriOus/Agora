"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderStepBarProps {
  currentStep: 1 | 2 | 3 | 4;
  className?: string;
}

const steps = [
  { number: 1, label: "Panier" },
  { number: 2, label: "Livraison" },
  { number: 3, label: "Paiement" },
  { number: 4, label: "Confirmation" },
];

export function OrderStepBar({ currentStep, className }: OrderStepBarProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                    isCompleted
                      ? "bg-[var(--agora-green)] text-white"
                      : isCurrent
                      ? "bg-[var(--agora-primary)] text-white"
                      : "bg-[var(--agora-accent)] text-[var(--agora-mid)] border border-[var(--agora-line)]"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium hidden sm:block",
                    isCurrent
                      ? "text-[var(--agora-primary)]"
                      : isCompleted
                      ? "text-[var(--agora-green)]"
                      : "text-[var(--agora-mid)]"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className="flex-1 mx-2 sm:mx-4">
                  <div
                    className={cn(
                      "h-0.5 w-full transition-colors",
                      isCompleted
                        ? "bg-[var(--agora-green)]"
                        : "bg-[var(--agora-line)]"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Labels */}
      <div className="flex justify-center mt-4 sm:hidden">
        <span className="text-sm font-medium text-[var(--agora-primary)]">
          {steps[currentStep - 1].label}
        </span>
      </div>
    </div>
  );
}
