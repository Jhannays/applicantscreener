"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Brain,
  Search,
  CheckCircle2,
  XCircle,
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

const steps = [
  { key: "extracting", label: "Extracting text from file", icon: FileText },
  { key: "parsing", label: "AI is reading the resume", icon: Brain },
  { key: "evaluating", label: "Evaluating against job requirements", icon: Search },
] as const;

export function ScreeningProgress({
  progress,
  currentResume,
  currentStep,
  total,
  completedCount,
  errorCount,
  activityLog,
}: ScreeningProgressProps) {
  const percentage = total > 0 ? Math.min(Math.round((progress / total) * 100), 100) : 0;
  const logEndRef = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);

  // Elapsed timer
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll activity log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activityLog.length]);

  const formatElapsed = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return mins > 0
      ? `${mins}m ${secs.toString().padStart(2, "0")}s`
      : `${secs}s`;
  };

  const activeStepIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex flex-col items-center py-6">
      {/* Progress circle + percentage */}
      <div className="relative mb-6 flex h-32 w-32 items-center justify-center">
        <svg className="h-32 w-32 -rotate-90" viewBox="0 0 128 128">
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            className="stroke-muted"
            strokeWidth="8"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            className="stroke-primary transition-all duration-700 ease-out"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums text-foreground">
            {percentage}
            <span className="text-lg text-muted-foreground">%</span>
          </span>
          <span className="text-xs text-muted-foreground">
            {formatElapsed(elapsed)}
          </span>
        </div>
      </div>

      {/* Pipeline steps */}
      <div className="mb-6 flex w-full max-w-md items-center justify-between">
        {steps.map((step, i) => {
          const isCurrent = step.key === currentStep;
          const isPast = activeStepIndex > i;
          const StepIcon = step.icon;

          return (
            <div key={step.key} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                  isCurrent
                    ? "border-primary bg-primary/10"
                    : isPast
                      ? "border-primary bg-primary"
                      : "border-muted bg-muted/50"
                }`}
              >
                {isCurrent ? (
                  <StepIcon className="h-5 w-5 animate-pulse text-primary" />
                ) : isPast ? (
                  <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                ) : (
                  <StepIcon className="h-5 w-5 text-muted-foreground/50" />
                )}
              </div>
              <span
                className={`text-center text-[11px] leading-tight ${
                  isCurrent
                    ? "font-medium text-foreground"
                    : isPast
                      ? "text-muted-foreground"
                      : "text-muted-foreground/50"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Full-width progress bar */}
      <div className="w-full max-w-md">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
          {percentage > 0 && percentage < 100 && (
            <div
              className="absolute inset-y-0 left-0 overflow-hidden rounded-full"
              style={{ width: `${percentage}%` }}
            >
              <div
                className="h-full w-[200%] animate-[shimmer_1.5s_ease-in-out_infinite]"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
                }}
              />
            </div>
          )}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>
            {Math.floor(progress)} of {total} resume{total !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-3">
            {completedCount > 0 && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                {completedCount} done
              </span>
            )}
            {errorCount > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <XCircle className="h-3 w-3" />
                {errorCount} failed
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Current file */}
      {currentResume && (
        <div className="mt-4 flex max-w-md items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
          <span className="truncate text-foreground/80">{currentResume}</span>
        </div>
      )}

      {/* Activity log */}
      {activityLog.length > 0 && (
        <div className="mt-6 w-full max-w-lg">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Activity Log
          </h4>
          <div className="max-h-52 overflow-y-auto rounded-lg border border-border bg-card p-3">
            <div className="space-y-0.5">
              {activityLog.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded px-1.5 py-1 text-xs leading-relaxed animate-in fade-in slide-in-from-bottom-1 duration-200"
                >
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50 tabular-nums">
                    {entry.time}
                  </span>
                  {entry.type === "success" && (
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                  )}
                  {entry.type === "error" && (
                    <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
                  )}
                  {entry.type === "step" && (
                    <Loader2 className="mt-0.5 h-3 w-3 shrink-0 animate-spin text-primary/60" />
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
                          : "text-foreground/70"
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
