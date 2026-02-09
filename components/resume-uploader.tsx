"use client";

import { Upload, FileText, X, File } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { ResumeFile } from "@/lib/types";

interface ResumeUploaderProps {
  files: ResumeFile[];
  onFilesChange: (files: ResumeFile[]) => void;
}

export function ResumeUploader({ files, onFilesChange }: ResumeUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (fileList: FileList) => {
      const newFiles: ResumeFile[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (
          file.type === "text/plain" ||
          file.type === "text/markdown" ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".md") ||
          file.name.endsWith(".pdf")
        ) {
          const content = await file.text();
          newFiles.push({
            name: file.name,
            content,
            size: file.size,
          });
        }
      }
      onFilesChange([...files, ...newFiles]);
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
    (index: number) => {
      onFilesChange(files.filter((_, i) => i !== index));
    },
    [files, onFilesChange]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">
        Resumes
      </label>
      <p className="text-xs text-muted-foreground">
        Upload one or more resume files (.txt or .md format). Each file will be
        screened against the job requirements.
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ")
            fileInputRef.current?.click();
        }}
        aria-label="Upload resume files"
      >
        <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          Drop resume files here or click to upload
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          .txt and .md files supported -- upload multiple at once
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
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {files.length} resume{files.length !== 1 ? "s" : ""} uploaded
          </p>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <File className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate text-sm text-foreground">
                    {file.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatSize(file.size)}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Remove ${file.name}`}
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
