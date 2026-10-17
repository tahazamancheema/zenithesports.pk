import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperStep {
  id: string;
  label: string;
}

export interface StepperProps {
  steps: StepperStep[];
  currentStep: string;
  completedSteps: string[];
  onStepClick?: (stepId: string) => void;
  className?: string;
}

/**
 * Multi-step progress indicator.
 * Completed steps are clickable (navigate back).
 *
 * @example
 * <Stepper
 *   steps={[{ id: "team", label: "Team" }, { id: "roster", label: "Roster" }]}
 *   currentStep="roster"
 *   completedSteps={["team"]}
 * />
 */
export function Stepper({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  className,
}: StepperProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {steps.map((step, i) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = step.id === currentStep;
        const isClickable = isCompleted && onStepClick;

        return (
          <div key={step.id} className="flex items-center gap-1 flex-1">
            {/* Step circle */}
            <button
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={cn(
                "flex items-center justify-center h-8 w-8 rounded-full text-xs font-semibold",
                "transition-all duration-200 shrink-0",
                isCompleted && [
                  "bg-[var(--color-gold-500)] text-[var(--color-bg-950)]",
                  isClickable && "cursor-pointer hover:brightness-110",
                ],
                isCurrent && !isCompleted && [
                  "bg-[var(--gold-tint-lg)] border-2 border-[var(--color-gold-500)]",
                  "text-[var(--color-gold-400)]",
                ],
                !isCurrent &&
                  !isCompleted && [
                    "bg-[var(--color-bg-700)] border border-[var(--color-line-700)]",
                    "text-[var(--color-text-faint)]",
                  ]
              )}
              aria-label={`Step ${i + 1}: ${step.label}`}
              aria-current={isCurrent ? "step" : undefined}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
            </button>

            {/* Label */}
            <span
              className={cn(
                "text-xs font-medium hidden sm:inline",
                isCurrent
                  ? "text-[var(--color-gold-400)]"
                  : isCompleted
                    ? "text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-faint)]"
              )}
            >
              {step.label}
            </span>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-px mx-2",
                  isCompleted
                    ? "bg-[var(--color-gold-500)]"
                    : "bg-[var(--color-line-700)]"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
