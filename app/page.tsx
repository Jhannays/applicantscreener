"use client";

import { useState, useCallback } from "react";
import { FileText, Play, AlertCircle } from "lucide-react";
import { JobRequirementsInput } from "@/components/job-requirements-input";
import { ResumeUploader } from "@/components/resume-uploader";
import { ScreeningProgress } from "@/components/screening-progress";
import { ResultsDashboard } from "@/components/results-dashboard";
import type { ResumeFile, ApplicantResult, ScreeningState } from "@/lib/types";

export default function Home() {
  const [state, setState] = useState<ScreeningState>({
    status: "idle",
    jobRequirements: "",
    resumeFiles: [],
    results: [],
    error: null,
    progress: 0,
    currentResume: "",
  });

  const handleScreen = useCallback(async () => {
    if (!state.jobRequirements.trim() || state.resumeFiles.length === 0) return;

    setState((prev) => ({
      ...prev,
      status: "screening",
      results: [],
      error: null,
      progress: 0,
      currentResume: "",
    }));

    try {
      const response = await fetch("/api/screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRequirements: state.jobRequirements,
          resumes: state.resumeFiles,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Screening failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";
      const collectedResults: ApplicantResult[] = [];

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

            if (message.type === "progress") {
              setState((prev) => ({
                ...prev,
                progress: message.current,
                currentResume: message.fileName,
              }));
            } else if (message.type === "result") {
              collectedResults.push(message.data);
              setState((prev) => ({
                ...prev,
                results: [...collectedResults],
              }));
            } else if (message.type === "done") {
              setState((prev) => ({
                ...prev,
                status: "complete",
                results: [...collectedResults],
              }));
            } else if (message.type === "error") {
              console.warn(
                `Error processing ${message.fileName}: ${message.error}`
              );
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      // Ensure we mark as complete even if "done" message wasn't parsed
      setState((prev) => {
        if (prev.status !== "complete") {
          return { ...prev, status: "complete", results: [...collectedResults] };
        }
        return prev;
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: err instanceof Error ? err.message : "An unexpected error occurred",
      }));
    }
  }, [state.jobRequirements, state.resumeFiles]);

  const handleReset = useCallback(() => {
    setState({
      status: "idle",
      jobRequirements: "",
      resumeFiles: [],
      results: [],
      error: null,
      progress: 0,
      currentResume: "",
    });
  }, []);

  const canScreen =
    state.jobRequirements.trim().length > 0 && state.resumeFiles.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">
              Applicant Screener
            </span>
          </div>
          {state.status === "complete" && (
            <span className="text-sm text-muted-foreground">
              {state.results.length} resume{state.results.length !== 1 ? "s" : ""}{" "}
              screened
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* IDLE: Upload form */}
        {(state.status === "idle" || state.status === "error") && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-balance">
                Resume Screening Tool
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload job requirements and resumes to automatically screen candidates using AI.
              </p>
            </div>

            {state.error && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    Screening failed
                  </p>
                  <p className="mt-1 text-sm text-destructive/80">
                    {state.error}
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-6">
                <JobRequirementsInput
                  value={state.jobRequirements}
                  onChange={(value) =>
                    setState((prev) => ({ ...prev, jobRequirements: value }))
                  }
                />
              </div>
              <div className="rounded-lg border border-border bg-card p-6">
                <ResumeUploader
                  files={state.resumeFiles}
                  onFilesChange={(files) =>
                    setState((prev) => ({ ...prev, resumeFiles: files }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-center">
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
                Screen {state.resumeFiles.length} Resume
                {state.resumeFiles.length !== 1 ? "s" : ""}
              </button>
            </div>

            {!canScreen && state.resumeFiles.length === 0 && state.jobRequirements.trim().length === 0 && (
              <p className="text-center text-xs text-muted-foreground">
                Add job requirements and upload at least one resume to begin screening.
              </p>
            )}
          </div>
        )}

        {/* SCREENING: Progress */}
        {state.status === "screening" && (
          <div className="rounded-lg border border-border bg-card p-8">
            <ScreeningProgress
              progress={state.progress}
              currentResume={state.currentResume}
              total={state.resumeFiles.length}
            />
          </div>
        )}

        {/* COMPLETE: Results */}
        {state.status === "complete" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-balance">
                Screening Results
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                AI analysis complete. Click on any row to see detailed role-by-role evaluation.
              </p>
            </div>
            <ResultsDashboard results={state.results} onReset={handleReset} />
          </div>
        )}
      </main>
    </div>
  );
}
