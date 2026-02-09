"use client";

import { Loader2, FileText } from "lucide-react";

interface ScreeningProgressProps {
  progress: number;
  currentResume: string;
  total: number;
}

export function ScreeningProgress({
  progress,
  currentResume,
  total,
}: ScreeningProgressProps) {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-muted">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <div
          className="absolute inset-0 rounded-full border-4 border-primary"
          style={{
            clipPath: `polygon(50% 50%, 50% 0%, ${percentage > 25 ? "100% 0%" : `${50 + percentage * 2}% 0%`}${percentage > 25 ? `, 100% ${percentage > 50 ? "100%" : `${(percentage - 25) * 4}%`}` : ""}${percentage > 50 ? `, ${percentage > 75 ? "0%" : `${100 - (percentage - 50) * 4}%`} 100%` : ""}${percentage > 75 ? `, 0% ${100 - (percentage - 75) * 4}%` : ""})`,
          }}
        />
      </div>

      <h3 className="text-lg font-semibold text-foreground">
        Screening Resumes...
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Processing {progress} of {total} resumes
      </p>

      <div className="mt-4 w-full max-w-sm">
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>{percentage}% complete</span>
          <span>
            {progress}/{total}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {currentResume && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          <span>Analyzing: {currentResume}</span>
        </div>
      )}
    </div>
  );
}
