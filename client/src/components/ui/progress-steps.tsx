import { Check } from "lucide-react";

interface ProgressStepsProps {
  currentStep: number;
}

export function ProgressSteps({ currentStep }: ProgressStepsProps) {
  const steps = [
    { id: 1, name: "Preferences" },
    { id: 2, name: "Location" },
    { id: 3, name: "Results" }
  ];

  return (
    <div className="rounded-3xl border border-[rgba(244,208,63,0.45)] bg-white/75 px-4 py-5 shadow-[0_14px_34px_rgba(255,56,92,0.05)]">
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step) => {
          const isActive = currentStep === step.id;
          const isDone = currentStep > step.id;

          return (
            <div
              key={step.id}
              className={`rounded-2xl border px-4 py-4 transition-colors ${
                isActive
                  ? "border-primary bg-primary/8"
                  : isDone
                    ? "border-[rgba(255,180,0,0.5)] bg-[rgba(255,248,214,0.72)]"
                    : "border-slate-200 bg-white/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${
                    isActive
                      ? "bg-primary text-white"
                      : isDone
                        ? "bg-accent text-[#111318]"
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Step {step.id}
                  </p>
                  <p className="text-base font-semibold text-[#111318]">{step.name}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
