"use client";

import { Upload, FileText, X, FolderOpen, Table2, AlertTriangle } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { JobFile, RequisitionCSVRow } from "@/lib/types";
import { parseRequisitionCSV } from "@/lib/parse-requisition-csv";

interface JobRequirementsInputProps {
  files: JobFile[];
  onFilesChange: (files: JobFile[]) => void;
  requisitionCSV: RequisitionCSVRow[];
  onRequisitionCSVChange: (rows: RequisitionCSVRow[]) => void;
}

function extractReqId(fileName: string): string | null {
  const match = fileName.match(/^(\d+)/);
  return match ? match[1] : null;
}

export function JobRequirementsInput({
  files,
  onFilesChange,
  requisitionCSV,
  onRequisitionCSVChange,
}: JobRequirementsInputProps) {
  const [dragActive, setDragActive] = useState(false);
  const [csvDragActive, setCsvDragActive] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

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

  const processCSV = useCallback(
    async (file: File) => {
      setCsvError(null);
      try {
        const text = await file.text();
        const rows = parseRequisitionCSV(text);
        if (rows.length === 0) {
          setCsvError(
            "No valid requisition rows found. Ensure the CSV has a Requisition.Number column and data rows after the 2-line header."
          );
          return;
        }
        setCsvFileName(file.name);
        onRequisitionCSVChange(rows);
      } catch (err) {
        setCsvError(
          `Failed to parse CSV: ${err instanceof Error ? err.message : "unknown error"}`
        );
      }
    },
    [onRequisitionCSVChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleCSVDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setCsvDragActive(false);
      const fileList = e.dataTransfer.files;
      if (fileList.length > 0) processCSV(fileList[0]);
    },
    [processCSV]
  );

  const removeFile = useCallback(
    (reqId: string) => {
      onFilesChange(files.filter((f) => f.reqId !== reqId));
    },
    [files, onFilesChange]
  );

  const removeCSV = useCallback(() => {
    onRequisitionCSVChange([]);
    setCsvFileName(null);
    setCsvError(null);
  }, [onRequisitionCSVChange]);

  const csvReqNumbers = requisitionCSV.map((r) => r.requisitionNumber);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Job Requirements
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
          Upload a requisition CSV with structured job data. The CSV contains
          all qualifications, certifications, and experience requirements needed
          for screening. Individual .txt files are optional overrides.
        </p>
      </div>

      {/* ── Requisition CSV upload zone (PRIMARY) ── */}
      <div>
        <div className="mb-2">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Table2 className="h-3.5 w-3.5" />
            Requisition CSV
          </h4>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            Workday/HRIS export with Min/Preferred Years, Certifications,
            Education, Qualifications, etc.
          </p>
        </div>

        {requisitionCSV.length === 0 ? (
          <div
            onDrop={handleCSVDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setCsvDragActive(true);
            }}
            onDragLeave={() => setCsvDragActive(false)}
            onClick={() => csvInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 transition-colors ${
              csvDragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                csvInputRef.current?.click();
            }}
            aria-label="Upload requisition CSV"
          >
            <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Drop requisition CSV here
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              .csv file with structured job requirement data
            </p>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) processCSV(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </div>
        ) : (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <Table2 className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {csvFileName || "requisition.csv"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {requisitionCSV.length} requisition
                    {requisitionCSV.length !== 1 ? "s" : ""} loaded
                    <span className="ml-1.5 text-foreground/70">
                      (REQs: {csvReqNumbers.slice(0, 5).join(", ")}
                      {csvReqNumbers.length > 5
                        ? `, +${csvReqNumbers.length - 5} more`
                        : ""}
                      )
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={removeCSV}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label="Remove requisition CSV"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {csvError && (
          <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-700">{csvError}</p>
          </div>
        )}
      </div>

      {/* ── Optional: Individual .txt job files ── */}
      <div className="border-t border-border pt-4">
        <div className="mb-2">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            Individual Job Files
            <span className="font-normal text-muted-foreground">(optional)</span>
          </h4>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            Upload .txt files with full job posting text. If provided alongside
            the CSV, these supply additional context for the AI evaluator. Not
            needed if the CSV already has your job qualifications.
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
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-5 transition-colors ${
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
          <FolderOpen className="mb-1.5 h-5 w-5 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Drop .txt job files here
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Optional -- select multiple
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
          <div className="mt-2 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {files.length} job file{files.length !== 1 ? "s" : ""} loaded
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
    </div>
  );
}
