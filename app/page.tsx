"use client";

import { useState, useCallback } from "react";
import { FileText, Play, AlertCircle } from "lucide-react";
import { JobRequirementsInput } from "@/components/job-requirements-input";
import { ResumeUploader } from "@/components/resume-uploader";
import { ScreeningProgress } from "@/components/screening-progress";
import { ResultsDashboard } from "@/components/results-dashboard";
import type { JobFile, ResumeFile, ApplicantResult, ScreeningState } from "@/lib/types";

const initialState: ScreeningState = {
  status: "upload",
  jobFiles: [],
  resumeFiles: [],
  results: [],
  errors: [],
  progress: 0,
  totalToProcess: 0,
  currentFile: "",
};

export default function Home() {
  const [state, setState] = useState<ScreeningState>(initialState);

  const handleScreen = useCallback(async () => {
    if (state.jobFiles.length === 0 || state.resumeFiles.length === 0) return;

    setState((prev) => ({
      ...prev,
      status: "screening",
      results: [],
      errors: [],
      progress: 0,
      totalToProcess: 0,
      currentFile: "",
    }));

    try {
      const response = await fetch("/api/screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobFiles: state.jobFiles,
          resumeFiles: state.resumeFiles,
        }),
      });

      if (!response.ok) {
        let errorMessage = `Server responded with status ${response.status}`;
        try {
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch {
          // If we can't parse the error, use the status message
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";
      const collectedResults: ApplicantResult[] = [];
      const collectedErrors: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const message = JSON.parse(line);

            if (message.type === "info") {
              if (message.skippedErrors) {
                collectedErrors.push(...message.skippedErrors);
              }
              setState((prev) => ({
                ...prev,
                totalToProcess: message.totalToProcess,
                errors: [...collectedErrors],
              }));
            } else if (message.type === "progress") {
              setState((prev) => ({
                ...prev,
                progress: message.current,
                totalToProcess: message.total,
                currentFile: `[REQ ${message.reqId}] ${message.fileName}`,
              }));
            } else if (message.type === "result") {
              collectedResults.push(message.data);
              setState((prev) => ({
                ...prev,
                results: [...collectedResults],
              }));
            } else if (message.type === "error") {
              const errMsg = `[REQ ${message.reqId}] ${message.fileName}: ${message.error}`;
              collectedErrors.push(errMsg);
              setState((prev) => ({
                ...prev,
                errors: [...collectedErrors],
              }));
            } else if (message.type === "done") {
              setState((prev) => ({
                ...prev,
                status: "complete",
                results: [...collectedResults],
                errors: [...collectedErrors],
              }));
            }
          } catch (parseErr) {
            // If this line isn't JSON, it's likely a raw error from the server
            const trimmedLine = line.trim();
            if (trimmedLine.length > 0) {
              console.error("[v0] Failed to parse NDJSON line:", trimmedLine);
              collectedErrors.push(trimmedLine);
              setState((prev) => ({
                ...prev,
                errors: [...collectedErrors],
              }));
            }
          }
        }
      }

      // Ensure we mark complete
      setState((prev) => {
        if (prev.status !== "complete") {
          return {
            ...prev,
            status: "complete",
            results: [...collectedResults],
            errors: [...collectedErrors],
          };
        }
        return prev;
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "error",
        errors: [
          ...prev.errors,
          err instanceof Error ? err.message : "An unexpected error occurred",
        ],
      }));
    }
  }, [state.jobFiles, state.resumeFiles]);

  const handleReset = useCallback(() => {
    setState(initialState);
  }, []);

  const canScreen = state.jobFiles.length > 0 && state.resumeFiles.length > 0;

  // Count how many resumes have a matching job
  const jobReqIds = new Set(state.jobFiles.map((j) => j.reqId));
  const matchedResumeCount = state.resumeFiles.filter((r) =>
    jobReqIds.has(r.reqId)
  ).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-semibold text-foreground">
                Applicant Screener
              </span>
              <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">
                Batch Resume Screening
              </span>
            </div>
          </div>
          {state.status === "complete" && (
            <span className="text-sm text-muted-foreground">
              {state.results.length} resume
              {state.results.length !== 1 ? "s" : ""} screened across{" "}
              {new Set(state.results.map((r) => r.reqId)).size} requisition
              {new Set(state.results.map((r) => r.reqId)).size !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* UPLOAD */}
        {(state.status === "upload" || state.status === "error") && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-balance">
                Batch Resume Screening
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground leading-relaxed">
                Upload job requirement files and resumes organized by requisition number.
                The system will match resumes to jobs, extract candidate data, calculate relevant
                experience, perform gap analysis, and evaluate each resume against job expectations.
              </p>
            </div>

            {state.status === "error" && state.errors.length > 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    Screening encountered errors
                  </p>
                  {state.errors.map((e, i) => (
                    <p key={i} className="mt-0.5 text-sm text-destructive/80">
                      {e}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-5">
                <JobRequirementsInput
                  files={state.jobFiles}
                  onFilesChange={(files: JobFile[]) =>
                    setState((prev) => ({ ...prev, jobFiles: files }))
                  }
                />
              </div>
              <div className="rounded-lg border border-border bg-card p-5">
                <ResumeUploader
                  files={state.resumeFiles}
                  jobFiles={state.jobFiles}
                  onFilesChange={(files: ResumeFile[]) =>
                    setState((prev) => ({ ...prev, resumeFiles: files }))
                  }
                />
              </div>
            </div>

            {/* Summary + Screen button */}
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  {state.jobFiles.length > 0 && state.resumeFiles.length > 0 ? (
                    <span>
                      <strong className="text-foreground">
                        {matchedResumeCount}
                      </strong>{" "}
                      resume{matchedResumeCount !== 1 ? "s" : ""} matched to{" "}
                      <strong className="text-foreground">
                        {state.jobFiles.length}
                      </strong>{" "}
                      job{state.jobFiles.length !== 1 ? "s" : ""}
                      {state.resumeFiles.length - matchedResumeCount > 0 && (
                        <span className="ml-1 text-amber-600">
                          ({state.resumeFiles.length - matchedResumeCount}{" "}
                          unmatched)
                        </span>
                      )}
                    </span>
                  ) : (
                    <span>
                      Upload job requirements and resumes to begin screening.
                    </span>
                  )}
                </div>
                <button
                  onClick={handleScreen}
                  disabled={!canScreen}
                  className={`inline-flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-medium transition-colors ${
                    canScreen
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "cursor-not-allowed bg-muted text-muted-foreground"
                  }`}
                  aria-label="Start screening resumes"
                >
                  <Play className="h-4 w-4" />
                  Screen {matchedResumeCount > 0 ? matchedResumeCount : ""} Resume
                  {matchedResumeCount !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCREENING */}
        {state.status === "screening" && (
          <div className="rounded-lg border border-border bg-card p-8">
            <ScreeningProgress
              progress={state.progress}
              currentResume={state.currentFile}
              total={state.totalToProcess}
              errors={state.errors}
            />
          </div>
        )}

        {/* COMPLETE */}
        {state.status === "complete" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-balance">
                Screening Results
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Click any row to expand detailed analysis including role relevance,
                gap analysis, and expectations evaluation.
              </p>
            </div>
            <ResultsDashboard
              results={state.results}
              errors={state.errors}
              onReset={handleReset}
            />
          </div>
        )}
      </main>
    </div>
  );
}
