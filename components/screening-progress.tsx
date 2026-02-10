"use client";

import { useEffect, useRef } from "react";
import {
  FileText,
  Brain,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import type { ActivityLogEntry } from "@/lib/types";

interface ScreeningProgressProps {
  progress: number;
  currentResume: string;
  currentStep: string;
  total: number;
  completedCount: number;
  errorCount: number;
  activityLog: ActivityLogEntry[];
}

const stepConfig: Record<
  string,
  { label: string; icon: typeof FileText; color: string }
> = {
  extracting: {
    label: "Extracting text",
    icon: FileText,
    color: "text-blue-500",
  },
  parsing: {
    label: "AI parsing resume",
    icon: Brain,
    color: "text-violet-500",
  },
  evaluating: {
    label: "Evaluating fit",
    icon: Search,
    color: "text-amber-500",
  },
};

export function ScreeningProgress({
  progress,
  currentResume,
  currentStep,
  total,
  completedCount,
  errorCount,
  activityLog,
}: ScreeningProgressProps) {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activityLog.length]);

  const activeStep = stepConfig[currentStep];

  return (
    <div className="flex flex-col items-center py-8">
      {/* Animated pulse ring */}
      <div className="relative mb-6 flex h-28 w-28 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
        <div className="absolute inset-2 animate-pulse rounded-full bg-primary/5" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-primary/20 bg-card">
          {activeStep ? (
            <activeStep.icon
              className={`h-8 w-8 ${activeStep.color} animate-pulse`}
            />
          ) : (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          )}
        </div>
      </div>

      {/* Main heading */}
      <h3 className="text-xl font-semibold text-foreground">
        Screening in Progress
      </h3>

      {/* Current step label */}
      {activeStep && (
        <div className="mt-2 flex items-center gap-2 rounded-full bg-muted px-4 py-1.5">
          <span
            className={`h-2 w-2 rounded-full ${activeStep.color.replace("text-", "bg-")} animate-pulse`}
          />
          <span className="text-sm font-medium text-foreground">
            {activeStep.label}
          </span>
        </div>
      )}

      {/* Stats row */}
      <div className="mt-5 flex items-center gap-6">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {progress} / {total}
          </span>
        </div>
        {completedCount > 0 && (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-emerald-600">{completedCount}</span>
          </div>
        )}
        {errorCount > 0 && (
          <div className="flex items-center gap-1.5">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-600">{errorCount}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-4 w-full max-w-md">
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
          <span>{percentage}% complete</span>
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${percentage}%` }}
          />
          {/* Shimmer effect on the bar */}
          {percentage < 100 && (
            <div
              className="absolute inset-y-0 left-0 w-full animate-[shimmer_2s_ease-in-out_infinite]"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                width: `${percentage}%`,
              }}
            />
          )}
        </div>
      </div>

      {/* Current file being processed */}
      {currentResume && (
        <div className="mt-3 flex max-w-md items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{currentResume}</span>
        </div>
      )}

      {/* Activity log */}
      {activityLog.length > 0 && (
        <div className="mt-6 w-full max-w-lg">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Activity Log
          </h4>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3">
            <div className="space-y-1">
              {activityLog.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs leading-relaxed animate-in fade-in slide-in-from-bottom-1 duration-300"
                >
                  <span className="shrink-0 font-mono text-muted-foreground/60">
                    {entry.time}
                  </span>
                  {entry.type === "success" && (
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                  )}
                  {entry.type === "error" && (
                    <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
                  )}
                  {entry.type === "step" && (
                    <Loader2 className="mt-0.5 h-3 w-3 shrink-0 animate-spin text-primary" />
                  )}
                  {entry.type === "info" && (
                    <FileText className="mt-0.5 h-3 w-3 shrink-0 text-blue-500" />
                  )}
                  <span
                    className={
                      entry.type === "error"
                        ? "text-red-600"
                        : entry.type === "success"
                          ? "text-emerald-600"
                          : "text-foreground/80"
                    }
                  >
                    {entry.message}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
