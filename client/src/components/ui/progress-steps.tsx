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
    <div className="rounded-[18px] border border-[rgba(244,208,63,0.45)] bg-white/78 px-3 py-3 shadow-[0_14px_34px_rgba(255,56,92,0.05)] md:rounded-3xl md:px-4 md:py-5">
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {steps.map((step) => {
          const isActive = currentStep === step.id;
          const isDone = currentStep > step.id;

          return (
            <div
              key={step.id}
              className={`rounded-[14px] border px-2 py-3 transition-colors md:rounded-2xl md:px-4 md:py-4 ${
                isActive
                  ? "border-primary bg-primary/8"
                  : isDone
                    ? "border-[rgba(255,180,0,0.5)] bg-[rgba(255,248,214,0.72)]"
                    : "border-slate-200 bg-white/70"
              }`}
            >
              <div className="flex flex-col items-center gap-2 text-center md:flex-row md:text-left md:gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold md:h-11 md:w-11 ${
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
                  <p className="hidden text-xs font-bold uppercase text-slate-400 sm:block">
                    Step {step.id}
                  </p>
                  <p className="text-[0.78rem] font-semibold leading-tight text-[#111318] sm:text-sm md:text-base">{step.name}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
