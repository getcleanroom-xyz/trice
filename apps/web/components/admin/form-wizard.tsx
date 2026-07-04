"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

function FormWizard({
  steps,
  currentStep,
  onStepChange,
  children,
}: {
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {steps.map((step, i) => (
          <button
            key={step.id}
            type="button"
            onClick={() => onStepChange(i)}
            className={cn(
              "flex items-center gap-1.5 rounded-sm px-3 py-2 text-xs font-mono whitespace-nowrap transition-colors",
              i === currentStep
                ? "bg-primary/20 text-foreground"
                : i < currentStep
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            {i < currentStep ? (
              <Check className="h-3 w-3" />
            ) : (
              <span className={cn("h-3 w-3 flex items-center justify-center rounded-full border text-[8px]", i === currentStep ? "border-primary" : "border-muted-foreground/40")}>
                {i + 1}
              </span>
            )}
            <span className="hidden sm:inline">{step.label}</span>
          </button>
        ))}
      </div>
      <div>{children}</div>
    </div>
  );
}

export { FormWizard, type Step };
