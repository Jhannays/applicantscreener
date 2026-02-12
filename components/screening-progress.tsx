"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { ActivityLogEntry } from "@/lib/types";

interface ScreeningProgressProps {
  progress: number;
  currentResume: string;
  currentStep: string;
  total: number;
  completedCount: number;
  errorCount: number;
  duplicateCount: number;
  activityLog: ActivityLogEntry[];
}

export function ScreeningProgress({
  progress,
  total,
  completedCount,
  errorCount,
  duplicateCount,
  activityLog,
}: ScreeningProgressProps) {
  const completed = Math.floor(progress);
  const percentage = total > 0 ? Math.min(Math.round((progress / total) * 100), 100) : 0;
  const feedEndRef = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activityLog.length]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec.toString().padStart(2, "0")}s` : `${sec}s`;
  };

  // Only show the last 8 entries (most recent at bottom)
  const recentEntries = activityLog.slice(-8);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 py-4">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">
          Screening in progress
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {completed} of {total} resume{total !== 1 ? "s" : ""} processed
          {" "}
          <span className="text-muted-foreground/60">
            ({formatTime(elapsed)})
          </span>
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full">
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="tabular-nums font-medium">{percentage}%</span>
          <span className="flex items-center gap-3">
            {duplicateCount > 0 && (
              <span className="flex items-center gap-1 text-blue-600">
                {duplicateCount} from history
              </span>
            )}
            {completedCount > 0 && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {completedCount} screened
              </span>
            )}
            {errorCount > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <XCircle className="h-3.5 w-3.5" />
                {errorCount} failed
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Status feed -- informational popups */}
      <div className="w-full space-y-2">
        {recentEntries.map((entry, i) => {
          const isLatest = i === recentEntries.length - 1;

          let borderClass = "border-border";
          let bgClass = "bg-card";
          let icon = <Loader2 className="h-4 w-4 animate-spin text-primary" />;

          if (entry.type === "success") {
            borderClass = "border-emerald-200 dark:border-emerald-800/50";
            bgClass = "bg-emerald-50 dark:bg-emerald-950/20";
            icon = <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
          } else if (entry.type === "error") {
            borderClass = "border-red-200 dark:border-red-800/50";
            bgClass = "bg-red-50 dark:bg-red-950/20";
            icon = <XCircle className="h-4 w-4 text-red-600" />;
          } else if (entry.type === "info") {
            borderClass = "border-blue-200 dark:border-blue-800/50";
            bgClass = "bg-blue-50 dark:bg-blue-950/20";
            icon = (
              <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">i</span>
              </div>
            );
          }

          return (
            <div
              key={`${entry.time}-${i}`}
              className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-opacity duration-300 ${borderClass} ${bgClass} ${
                isLatest ? "opacity-100" : "opacity-60"
              }`}
            >
              <div className="mt-0.5 shrink-0">{icon}</div>
              <div className="min-w-0 flex-1">
                <p
                  className={`leading-snug ${
                    entry.type === "error"
                      ? "text-red-700 dark:text-red-400"
                      : entry.type === "success"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-foreground"
                  }`}
                >
                  {entry.message}
                </p>
              </div>
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/50">
                {entry.time}
              </span>
            </div>
          );
        })}
        <div ref={feedEndRef} />
      </div>
    </div>
  );
}
