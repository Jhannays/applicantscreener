"use client";

import { Upload, FileText, X, FolderOpen } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { JobFile } from "@/lib/types";

interface JobRequirementsInputProps {
  files: JobFile[];
  onFilesChange: (files: JobFile[]) => void;
}

function extractReqId(fileName: string): string | null {
  const match = fileName.match(/^(\d+)/);
  return match ? match[1] : null;
}

export function JobRequirementsInput({
  files,
  onFilesChange,
}: JobRequirementsInputProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (fileList: FileList) => {
      const newFiles: JobFile[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (!file.name.endsWith(".txt") && !file.name.endsWith(".md")) continue;
        const reqId = extractReqId(file.name);
        if (!reqId) continue;
        if (!files.some((f) => f.reqId === reqId)) {
          newFiles.push({ reqId, fileName: file.name, file });
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
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const removeFile = useCallback(
    (reqId: string) => {
      onFilesChange(files.filter((f) => f.reqId !== reqId));
    },
    [files, onFilesChange]
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Job Requirements
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
          Upload .txt files from your{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">
            ./jobs/
          </code>{" "}
          folder. Each filename must start with the requisition number (e.g.{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">
            25004678_job_requirements.txt
          </code>
          ).
        </p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
        aria-label="Upload job requirement files"
      >
        <FolderOpen className="mb-2 h-7 w-7 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          Drop job requirement files here
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          .txt files -- select multiple
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) processFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            {files.length} job{files.length !== 1 ? "s" : ""} loaded
          </p>
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {files.map((f) => (
              <div
                key={f.reqId}
                className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate text-sm font-mono text-foreground">
                    {f.reqId}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {f.fileName}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(f.reqId);
                  }}
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Remove ${f.fileName}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
