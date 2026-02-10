"use client";

import { Upload, FileText, X, FolderOpen, AlertTriangle } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { ResumeFile, JobFile } from "@/lib/types";

interface ResumeUploaderProps {
  files: ResumeFile[];
  jobFiles: JobFile[];
  onFilesChange: (files: ResumeFile[]) => void;
}

function getFileType(name: string): "text" | "pdf" | "docx" | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".txt") || lower.endsWith(".md")) return "text";
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) return "docx";
  return null;
}

export function ResumeUploader({
  files,
  jobFiles,
  onFilesChange,
}: ResumeUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [reqIdInput, setReqIdInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const grouped = files.reduce<Record<string, ResumeFile[]>>((acc, f) => {
    if (!acc[f.reqId]) acc[f.reqId] = [];
    acc[f.reqId].push(f);
    return acc;
  }, {});

  const activeReqId = reqIdInput.trim();

  const processFiles = useCallback(
    (fileList: FileList, reqId: string) => {
      if (!reqId) return;
      const newFiles: ResumeFile[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        const fileType = getFileType(f.name);
        if (!fileType) continue;
        if (!files.some((ex) => ex.reqId === reqId && ex.fileName === f.name)) {
          newFiles.push({
            reqId,
            fileName: f.name,
            file: f,
            fileType,
            size: f.size,
          });
        }
      }
      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles]);
      }
    },
    [files, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (!activeReqId) return;
      processFiles(e.dataTransfer.files, activeReqId);
    },
    [processFiles, activeReqId]
  );

  const removeFile = useCallback(
    (reqId: string, fileName: string) => {
      onFilesChange(
        files.filter((f) => !(f.reqId === reqId && f.fileName === fileName))
      );
    },
    [files, onFilesChange]
  );

  const removeReqGroup = useCallback(
    (reqId: string) => {
      onFilesChange(files.filter((f) => f.reqId !== reqId));
    },
    [files, onFilesChange]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const jobReqIds = new Set(jobFiles.map((j) => j.reqId));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Resumes by Requisition
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
          Enter a requisition number, then upload resumes for that job. Supports{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">
            .txt
          </code>
          ,{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">
            .pdf
          </code>
          , and{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">
            .docx
          </code>{" "}
          files.
        </p>
      </div>

      {/* Req ID input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={reqIdInput}
          onChange={(e) => setReqIdInput(e.target.value)}
          placeholder="Requisition # (e.g. 25004678)"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {activeReqId && !jobReqIds.has(activeReqId) && jobFiles.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-700">
            No matching job requirements file found for requisition{" "}
            <span className="font-mono font-semibold">{activeReqId}</span>.
            Resumes for this requisition will be skipped during screening.
          </p>
        </div>
      )}

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onClick={() => {
          if (activeReqId) fileInputRef.current?.click();
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 transition-colors ${
          !activeReqId
            ? "cursor-not-allowed border-border opacity-50"
            : dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && activeReqId)
            fileInputRef.current?.click();
        }}
        aria-label="Upload resume files"
      >
        <Upload className="mb-2 h-7 w-7 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          {activeReqId
            ? `Upload resumes for REQ ${activeReqId}`
            : "Enter a requisition number first"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          .txt, .pdf, .docx -- select multiple
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.pdf,.doc,.docx"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && activeReqId)
              processFiles(e.target.files, activeReqId);
            e.target.value = "";
          }}
        />
      </div>

      {/* Uploaded files grouped by req */}
      {Object.keys(grouped).length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            {files.length} resume{files.length !== 1 ? "s" : ""} across{" "}
            {Object.keys(grouped).length} requisition
            {Object.keys(grouped).length !== 1 ? "s" : ""}
          </p>

          <div className="max-h-64 space-y-3 overflow-y-auto">
            {Object.entries(grouped).map(([reqId, resumes]) => {
              const hasJob = jobReqIds.has(reqId);
              return (
                <div
                  key={reqId}
                  className="rounded-md border border-border bg-muted/20"
                >
                  <div className="flex items-center justify-between border-b border-border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-primary" />
                      <span className="text-sm font-mono font-semibold text-foreground">
                        REQ {reqId}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({resumes.length} file
                        {resumes.length !== 1 ? "s" : ""})
                      </span>
                      {!hasJob && jobFiles.length > 0 && (
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                          No job match
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeReqGroup(reqId)}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove all resumes for REQ ${reqId}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-0.5 p-1.5">
                    {resumes.map((r) => (
                      <div
                        key={r.fileName}
                        className="flex items-center justify-between rounded px-2 py-1 hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate text-xs text-foreground">
                            {r.fileName}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {formatSize(r.size)}
                          </span>
                          <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[10px] font-mono uppercase text-muted-foreground">
                            {r.fileType}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(reqId, r.fileName)}
                          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Remove ${r.fileName}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
