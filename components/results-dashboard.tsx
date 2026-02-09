"use client";

import { useState } from "react";
import {
  Download,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  RotateCcw,
  FileText,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { ApplicantResult } from "@/lib/types";

interface ResultsDashboardProps {
  results: ApplicantResult[];
  onReset: () => void;
}

const verdictStyles: Record<string, string> = {
  "Strong Match": "bg-emerald-500/10 text-emerald-700",
  "Potential Match": "bg-amber-500/10 text-amber-700",
  "Weak Match": "bg-orange-500/10 text-orange-700",
  "No Match": "bg-red-500/10 text-red-700",
};

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-500"
      : score >= 60
        ? "bg-amber-500"
        : score >= 40
          ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-medium text-foreground">{score}</span>
    </div>
  );
}

function RoleEvaluationRow({
  evaluation,
}: {
  evaluation: ApplicantResult["roleEvaluations"][0];
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2 text-sm text-foreground">
        {evaluation.company}
      </td>
      <td className="px-3 py-2 text-sm text-foreground">{evaluation.title}</td>
      <td className="px-3 py-2 text-sm text-muted-foreground">
        {evaluation.dateRange}
      </td>
      <td className="px-3 py-2">
        {evaluation.isRelevant ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
            <CheckCircle className="h-3 w-3" />
            Relevant
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <XCircle className="h-3 w-3" />
            Not Relevant
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {evaluation.relevanceReason}
      </td>
    </tr>
  );
}

function ApplicantExpandedRow({ result }: { result: ApplicantResult }) {
  return (
    <tr>
      <td colSpan={6} className="border-b border-border bg-muted/20 px-4 py-4">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Contact
              </h4>
              <p className="text-sm text-foreground">
                {result.email || "N/A"} | {result.phone || "N/A"}
              </p>
            </div>
            <div>
              <h4 className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Summary
              </h4>
              <p className="text-sm text-foreground">{result.summary}</p>
            </div>
          </div>

          <div>
            <h4 className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Verdict Reason
            </h4>
            <p className="text-sm text-foreground">{result.verdictReason}</p>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Role-by-Role Evaluation
            </h4>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      Company
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      Title
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      Dates
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      Relevant?
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.roleEvaluations.map((evaluation, i) => (
                    <RoleEvaluationRow key={i} evaluation={evaluation} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

type SortKey = "name" | "score" | "totalExp" | "relevantExp" | "verdict";
type SortDir = "asc" | "desc";

export function ResultsDashboard({
  results,
  onReset,
}: ResultsDashboardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState<string>("All");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered =
    filter === "All"
      ? results
      : results.filter((r) => r.verdict === filter);

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortKey) {
      case "name":
        return dir * a.name.localeCompare(b.name);
      case "score":
        return dir * (a.overallScore - b.overallScore);
      case "totalExp":
        return dir * (a.totalYearsExperience - b.totalYearsExperience);
      case "relevantExp":
        return dir * (a.relevantYearsExperience - b.relevantYearsExperience);
      case "verdict":
        return dir * a.verdict.localeCompare(b.verdict);
      default:
        return 0;
    }
  });

  const strongCount = results.filter((r) => r.verdict === "Strong Match").length;
  const potentialCount = results.filter((r) => r.verdict === "Potential Match").length;
  const weakCount = results.filter((r) => r.verdict === "Weak Match").length;
  const noMatchCount = results.filter((r) => r.verdict === "No Match").length;

  const exportCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Total Experience (yrs)",
      "Relevant Experience (yrs)",
      "Score",
      "Verdict",
      "Verdict Reason",
    ];
    const rows = results.map((r) => [
      r.name,
      r.email,
      r.phone,
      r.totalYearsExperience,
      r.relevantYearsExperience,
      r.overallScore,
      r.verdict,
      `"${r.verdictReason.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadFile(csv, "screening-results.csv", "text/csv");
  };

  const exportJSON = () => {
    const json = JSON.stringify(results, null, 2);
    downloadFile(json, "screening-results.json", "application/json");
  };

  const exportMarkdown = () => {
    let md = "# Applicant Screening Results\n\n";
    md += `| Name | Score | Verdict | Total Exp | Relevant Exp |\n`;
    md += `|------|-------|---------|-----------|---------------|\n`;
    results.forEach((r) => {
      md += `| ${r.name} | ${r.overallScore} | ${r.verdict} | ${r.totalYearsExperience} yrs | ${r.relevantYearsExperience} yrs |\n`;
    });
    md += "\n## Detailed Results\n\n";
    results.forEach((r) => {
      md += `### ${r.name}\n\n`;
      md += `- **Score:** ${r.overallScore}/100\n`;
      md += `- **Verdict:** ${r.verdict}\n`;
      md += `- **Reason:** ${r.verdictReason}\n`;
      md += `- **Email:** ${r.email}\n`;
      md += `- **Total Experience:** ${r.totalYearsExperience} years\n`;
      md += `- **Relevant Experience:** ${r.relevantYearsExperience} years\n\n`;
      if (r.roleEvaluations.length > 0) {
        md += `#### Role Evaluations\n\n`;
        r.roleEvaluations.forEach((ev) => {
          md += `- **${ev.title} at ${ev.company}** (${ev.dateRange}): ${ev.isRelevant ? "Relevant" : "Not Relevant"} - ${ev.relevanceReason}\n`;
        });
        md += "\n";
      }
    });
    downloadFile(md, "screening-results.md", "text/markdown");
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortButton = ({
    label,
    sortKeyName,
  }: {
    label: string;
    sortKeyName: SortKey;
  }) => (
    <button
      onClick={() => toggleSort(sortKeyName)}
      className="inline-flex items-center gap-1 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
    >
      {label}
      {sortKey === sortKeyName ? (
        sortDir === "asc" ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{results.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{strongCount}</p>
            <p className="text-xs text-muted-foreground">Strong</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{potentialCount}</p>
            <p className="text-xs text-muted-foreground">Potential</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{weakCount}</p>
            <p className="text-xs text-muted-foreground">Weak</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{noMatchCount}</p>
            <p className="text-xs text-muted-foreground">No Match</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {["All", "Strong Match", "Potential Match", "Weak Match", "No Match"].map(
            (v) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === v
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {v}
              </button>
            )
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
          <button
            onClick={exportJSON}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Download className="h-3.5 w-3.5" />
            JSON
          </button>
          <button
            onClick={exportMarkdown}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Download className="h-3.5 w-3.5" />
            Markdown
          </button>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New Screening
          </button>
        </div>
      </div>

      {/* Results table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-8 px-4 py-3" />
                <th className="px-4 py-3 text-left">
                  <SortButton label="Applicant" sortKeyName="name" />
                </th>
                <th className="hidden px-4 py-3 text-left md:table-cell">
                  <SortButton label="Total Exp" sortKeyName="totalExp" />
                </th>
                <th className="hidden px-4 py-3 text-left md:table-cell">
                  <SortButton label="Relevant Exp" sortKeyName="relevantExp" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton label="Score" sortKeyName="score" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton label="Verdict" sortKeyName="verdict" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((result) => {
                const isExpanded = expandedId === result.fileName;
                return (
                  <>
                    <tr
                      key={result.fileName}
                      onClick={() =>
                        setExpandedId(isExpanded ? null : result.fileName)
                      }
                      className="cursor-pointer border-b border-border transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {result.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {result.fileName}
                          </p>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                        {result.totalYearsExperience} yrs
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                        {result.relevantYearsExperience} yrs
                      </td>
                      <td className="px-4 py-3">
                        <ScoreBar score={result.overallScore} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${verdictStyles[result.verdict] || ""}`}
                        >
                          {result.verdict}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <ApplicantExpandedRow
                        key={`${result.fileName}-expanded`}
                        result={result}
                      />
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="mb-2 h-8 w-8" />
            <p className="text-sm">No results match this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
