"use client";

import { useState, useCallback } from "react";
import { FileText, Play, AlertCircle } from "lucide-react";
import { JobRequirementsInput } from "@/components/job-requirements-input";
import { ResumeUploader } from "@/components/resume-uploader";
import { ScreeningProgress } from "@/components/screening-progress";
import { ResultsDashboard } from "@/components/results-dashboard";
import type {
  JobFile,
  ResumeFile,
  ApplicantResult,
  ScreeningState,
  ScreeningError,
  ActivityLogEntry,
} from "@/lib/types";

const initialState: ScreeningState = {
  status: "upload",
  jobFiles: [],
  resumeFiles: [],
  results: [],
  errors: [],
  globalErrors: [],
  progress: 0,
  totalToProcess: 0,
  currentFile: "",
  currentStep: "",
  activityLog: [],
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
      globalErrors: [],
      progress: 0,
      totalToProcess: 0,
      currentFile: "",
      currentStep: "",
      activityLog: [],
    }));

    try {
      // Build FormData with actual File objects
      const formData = new FormData();

      const manifest = {
        jobs: [] as { fieldName: string; reqId: string; fileName: string }[],
        resumes: [] as {
          fieldName: string;
          reqId: string;
          fileName: string;
        }[],
      };

      // Add job files
      state.jobFiles.forEach((jf, i) => {
        const fieldName = `job_${i}`;
        formData.append(fieldName, jf.file, jf.fileName);
        manifest.jobs.push({
          fieldName,
          reqId: jf.reqId,
          fileName: jf.fileName,
        });
      });

      // Add resume files
      state.resumeFiles.forEach((rf, i) => {
        const fieldName = `resume_${i}`;
        formData.append(fieldName, rf.file, rf.fileName);
        manifest.resumes.push({
          fieldName,
          reqId: rf.reqId,
          fileName: rf.fileName,
        });
      });

      // Add manifest as JSON
      formData.append("manifest", JSON.stringify(manifest));

      const response = await fetch("/api/screen", {
        method: "POST",
        body: formData,
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
      const collectedErrors: ScreeningError[] = [];
      const collectedGlobalErrors: string[] = [];
      const activityLog: { time: string; message: string; type: "info" | "success" | "error" | "step" }[] = [];

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

            const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

            if (message.type === "info") {
              if (message.skippedErrors) {
                collectedGlobalErrors.push(...message.skippedErrors);
              }
              activityLog.push({ time: now, message: `Starting batch: ${message.totalToProcess} resume(s) to process`, type: "info" });
              setState((prev) => ({
                ...prev,
                totalToProcess: message.totalToProcess,
                globalErrors: [...collectedGlobalErrors],
                activityLog: [...activityLog],
              }));
            } else if (message.type === "step") {
              activityLog.push({ time: now, message: message.message, type: "step" });
              setState((prev) => ({
                ...prev,
                currentFile: `[REQ ${message.reqId}] ${message.fileName}`,
                currentStep: message.step,
                activityLog: [...activityLog],
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
              activityLog.push({ time: now, message: `Completed: ${message.data.candidateName}`, type: "success" });
              setState((prev) => ({
                ...prev,
                results: [...collectedResults],
                activityLog: [...activityLog],
              }));
            } else if (message.type === "error") {
              collectedErrors.push({
                reqId: message.reqId,
                fileName: message.fileName,
                error: message.error,
              });
              activityLog.push({ time: now, message: `Failed: ${message.fileName} - ${message.error}`, type: "error" });
              setState((prev) => ({
                ...prev,
                errors: [...collectedErrors],
                activityLog: [...activityLog],
              }));
            } else if (message.type === "done") {
              activityLog.push({ time: now, message: `Done! ${collectedResults.length} screened, ${collectedErrors.length} failed`, type: "info" });
              setState((prev) => ({
                ...prev,
                status: "complete",
                results: [...collectedResults],
                errors: [...collectedErrors],
                globalErrors: [...collectedGlobalErrors],
                activityLog: [...activityLog],
              }));
            }
          } catch {
            const trimmedLine = line.trim();
            if (trimmedLine.length > 0) {
              collectedGlobalErrors.push(trimmedLine);
              setState((prev) => ({
                ...prev,
                globalErrors: [...collectedGlobalErrors],
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
            globalErrors: [...collectedGlobalErrors],
          };
        }
        return prev;
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "error",
        globalErrors: [
          ...prev.globalErrors,
          err instanceof Error ? err.message : "An unexpected error occurred",
        ],
      }));
    }
  }, [state.jobFiles, state.resumeFiles]);

  const handleReset = useCallback(() => {
    setState(initialState);
  }, []);

  const canScreen = state.jobFiles.length > 0 && state.resumeFiles.length > 0;

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
              {state.results.length} screened
              {state.errors.length > 0 && (
                <span className="ml-1 text-amber-600">
                  / {state.errors.length} failed
                </span>
              )}
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
                Upload job requirement files and resumes organized by
                requisition number. The system will match resumes to jobs,
                extract candidate data, calculate relevant experience, perform
                gap analysis, and evaluate each resume against job expectations.
              </p>
            </div>

            {state.status === "error" && state.globalErrors.length > 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    Screening encountered errors
                  </p>
                  {state.globalErrors.map((e, i) => (
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
                  {state.jobFiles.length > 0 &&
                  state.resumeFiles.length > 0 ? (
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
                  Screen{" "}
                  {matchedResumeCount > 0 ? matchedResumeCount : ""} Resume
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
              currentStep={state.currentStep}
              total={state.totalToProcess}
              completedCount={state.results.length}
              errorCount={state.errors.length}
              activityLog={state.activityLog}
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
                Click any row to expand detailed analysis including role
                relevance, gap analysis, and expectations evaluation.
              </p>
            </div>
            <ResultsDashboard
              results={state.results}
              errors={state.errors}
              globalErrors={state.globalErrors}
              onReset={handleReset}
            />
          </div>
        )}
      </main>
    </div>
  );
}
