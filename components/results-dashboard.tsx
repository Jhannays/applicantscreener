"use client";

import { useState, useMemo } from "react";
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
  AlertTriangle,
  Clock,
  Briefcase,
  GraduationCap,
  Award,
  Wrench,
} from "lucide-react";
import type { ApplicantResult, ExpectationCheck } from "@/lib/types";

interface ResultsDashboardProps {
  results: ApplicantResult[];
  errors: string[];
  onReset: () => void;
}

const matchStyles: Record<string, string> = {
  Strong: "bg-emerald-500/10 text-emerald-700",
  Medium: "bg-amber-500/10 text-amber-700",
  Weak: "bg-red-500/10 text-red-700",
};

const statusStyles: Record<string, string> = {
  Met: "bg-emerald-500/10 text-emerald-700",
  "Partially Met": "bg-amber-500/10 text-amber-700",
  "Not Evident": "bg-red-500/10 text-red-700",
};

function ExpectationsTable({ checks }: { checks: ExpectationCheck[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              Expectation
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              Status
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              Evidence
            </th>
          </tr>
        </thead>
        <tbody>
          {checks.map((c, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              <td className="px-3 py-2 text-sm text-foreground">
                {c.expectation}
              </td>
              <td className="px-3 py-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[c.status] || ""}`}
                >
                  {c.status}
                </span>
              </td>
              <td className="max-w-xs px-3 py-2 text-xs text-muted-foreground">
                {c.evidence || "--"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ApplicantExpandedRow({ result }: { result: ApplicantResult }) {
  return (
    <tr>
      <td colSpan={11} className="border-b border-border bg-muted/10 px-4 py-5">
        <div className="space-y-5">
          {/* Education / Skills / Certs */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <GraduationCap className="h-3.5 w-3.5" />
                Education
              </h4>
              {result.education.length > 0 ? (
                <ul className="space-y-1">
                  {result.education.map((e, i) => (
                    <li key={i} className="text-sm text-foreground">
                      {e.degree} -- {e.institution}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({e.startDate} - {e.endDate})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Not available</p>
              )}
            </div>
            <div>
              <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Wrench className="h-3.5 w-3.5" />
                Skills
              </h4>
              {result.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {result.skills.map((s, i) => (
                    <span
                      key={i}
                      className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Not listed</p>
              )}
            </div>
            <div>
              <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Award className="h-3.5 w-3.5" />
                Certifications
              </h4>
              {result.certifications.length > 0 ? (
                <ul className="space-y-0.5">
                  {result.certifications.map((c, i) => (
                    <li key={i} className="text-sm text-foreground">
                      {c}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">None listed</p>
              )}
            </div>
          </div>

          {/* Role Relevance */}
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Briefcase className="h-3.5 w-3.5" />
              Role-by-Role Relevance
            </h4>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      Employer
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      Title
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      Dates
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      Duration
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
                  {result.roleRelevance.map((r, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 text-sm text-foreground">
                        {r.employer}
                      </td>
                      <td className="px-3 py-2 text-sm text-foreground">
                        {r.title}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                        {r.startDate} - {r.endDate}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                        {Math.floor(r.durationMonths / 12)}y{" "}
                        {r.durationMonths % 12}m
                      </td>
                      <td className="px-3 py-2">
                        {r.isRelevant ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <CheckCircle className="h-3 w-3" />
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                            <XCircle className="h-3 w-3" />
                            No
                          </span>
                        )}
                      </td>
                      <td className="max-w-xs px-3 py-2 text-xs text-muted-foreground">
                        {r.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gap Analysis */}
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5" />
              Gap Analysis
            </h4>
            {result.gapAnalysis.gapCount === 0 ? (
              <p className="text-xs text-muted-foreground">
                No employment gaps detected.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>
                    Gaps: <strong className="text-foreground">{result.gapAnalysis.gapCount}</strong>
                  </span>
                  <span>
                    Largest:{" "}
                    <strong className="text-foreground">
                      {result.gapAnalysis.largestGapMonths} months
                    </strong>
                  </span>
                  <span>
                    Total:{" "}
                    <strong className="text-foreground">
                      {result.gapAnalysis.totalGapMonths} months
                    </strong>
                  </span>
                </div>
                <div className="space-y-1">
                  {result.gapAnalysis.gaps.map((g, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded bg-amber-500/5 px-2 py-1 text-xs"
                    >
                      <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />
                      <span className="text-foreground">
                        {g.from} -- {g.to}
                      </span>
                      <span className="text-muted-foreground">
                        ({g.months} month{g.months !== 1 ? "s" : ""})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Expectations */}
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <CheckCircle className="h-3.5 w-3.5" />
              Job Expects vs Resume Shows
            </h4>
            {result.expectations.length > 0 ? (
              <ExpectationsTable checks={result.expectations} />
            ) : (
              <p className="text-xs text-muted-foreground">
                No expectations data available.
              </p>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

type SortKey =
  | "name"
  | "reqId"
  | "relevantExp"
  | "totalExp"
  | "match"
  | "gapCount"
  | "metCount";
type SortDir = "asc" | "desc";

export function ResultsDashboard({
  results,
  errors,
  onReset,
}: ResultsDashboardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("relevantExp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterMatch, setFilterMatch] = useState<string>("All");
  const [filterReqId, setFilterReqId] = useState<string>("All");

  const reqIds = useMemo(
    () => ["All", ...new Set(results.map((r) => r.reqId))],
    [results]
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let f = results;
    if (filterMatch !== "All") f = f.filter((r) => r.overallMatch === filterMatch);
    if (filterReqId !== "All") f = f.filter((r) => r.reqId === filterReqId);
    return f;
  }, [results, filterMatch, filterReqId]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "name":
          return dir * a.candidateName.localeCompare(b.candidateName);
        case "reqId":
          return dir * a.reqId.localeCompare(b.reqId);
        case "relevantExp":
          return (
            dir *
            (a.relevantYears * 12 +
              a.relevantMonths -
              (b.relevantYears * 12 + b.relevantMonths))
          );
        case "totalExp":
          return (
            dir *
            (a.totalYears * 12 +
              a.totalMonths -
              (b.totalYears * 12 + b.totalMonths))
          );
        case "match": {
          const order = { Strong: 3, Medium: 2, Weak: 1 };
          return dir * ((order[a.overallMatch] || 0) - (order[b.overallMatch] || 0));
        }
        case "gapCount":
          return dir * (a.gapAnalysis.gapCount - b.gapAnalysis.gapCount);
        case "metCount":
          return (
            dir * (a.keyRequirementsMetCount - b.keyRequirementsMetCount)
          );
        default:
          return 0;
      }
    });
  }, [filtered, sortKey, sortDir]);

  const strongCount = results.filter((r) => r.overallMatch === "Strong").length;
  const mediumCount = results.filter((r) => r.overallMatch === "Medium").length;
  const weakCount = results.filter((r) => r.overallMatch === "Weak").length;

  // ─── Export functions ───────────────────────────────────

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = [
      "Requisition#",
      "Candidate Name",
      "Education",
      "Skills",
      "Years of Experience",
      "Certifications",
      "Gap Present? (Y/N)",
      "Non-Relevant Experience Counted? (Y/N)",
      "Edge Case? (Y/N)",
    ];

    const csvEscape = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const rows = results.map((r) => {
      const educationStr = r.education
        .map((e) => `${e.degree} - ${e.institution}`)
        .join("; ");
      const skillsStr = r.skills.join("; ");
      const certsStr = r.certifications.join("; ");
      const yoeStr = `${r.relevantYears}y ${r.relevantMonths}m relevant / ${r.totalYears}y ${r.totalMonths}m total`;
      const gapPresent = r.gapAnalysis.gapCount > 0 ? "Y" : "N";
      const nonRelevant = r.nonRelevantExperienceCounted ? "Y" : "N";
      const edgeCase = r.isEdgeCase ? "Y" : "N";

      return [
        csvEscape(r.reqId),
        csvEscape(r.candidateName),
        csvEscape(educationStr || "N/A"),
        csvEscape(skillsStr || "N/A"),
        csvEscape(yoeStr),
        csvEscape(certsStr || "N/A"),
        gapPresent,
        nonRelevant,
        edgeCase,
      ].join(",");
    });

    downloadFile(
      [headers.join(","), ...rows].join("\n"),
      "all_candidates.csv",
      "text/csv"
    );
  };

  const exportJSON = () => {
    downloadFile(
      JSON.stringify(results, null, 2),
      "all_candidates.json",
      "application/json"
    );
  };

  const exportMarkdown = () => {
    let md = "# Applicant Screening Results\n\n";
    md += `Generated: ${new Date().toISOString()}\n\n`;

    // Summary table
    md += "## Summary\n\n";
    md += "| REQ ID | Resume | Candidate | Relevant Exp | Total Exp | Gaps | Req Met | Match |\n";
    md += "|--------|--------|-----------|-------------|-----------|------|---------|-------|\n";
    results.forEach((r) => {
      md += `| ${r.reqId} | ${r.resumeFile} | ${r.candidateName} | ${r.relevantYears}y ${r.relevantMonths}m | ${r.totalYears}y ${r.totalMonths}m | ${r.gapAnalysis.gapCount} | ${r.keyRequirementsMetCount}/${r.keyRequirementsMetCount + r.keyRequirementsMissingCount} | ${r.overallMatch} |\n`;
    });

    md += "\n---\n\n";

    // Per-resume details
    results.forEach((r) => {
      md += `## ${r.candidateName} (REQ ${r.reqId})\n\n`;
      md += `**File:** ${r.resumeFile}\n\n`;
      md += `**Overall Match:** ${r.overallMatch}\n`;
      md += `**Relevant Experience:** ${r.relevantYears} years ${r.relevantMonths} months\n`;
      md += `**Total Experience:** ${r.totalYears} years ${r.totalMonths} months\n\n`;

      if (r.education.length > 0) {
        md += "### Education\n\n";
        r.education.forEach((e) => {
          md += `- ${e.degree} -- ${e.institution} (${e.startDate} - ${e.endDate})\n`;
        });
        md += "\n";
      }

      if (r.skills.length > 0) {
        md += `### Skills\n\n${r.skills.join(", ")}\n\n`;
      }

      if (r.certifications.length > 0) {
        md += `### Certifications\n\n${r.certifications.join(", ")}\n\n`;
      }

      md += "### Role Relevance\n\n";
      md += "| Employer | Title | Dates | Duration | Relevant | Reason |\n";
      md += "|----------|-------|-------|----------|----------|--------|\n";
      r.roleRelevance.forEach((rr) => {
        md += `| ${rr.employer} | ${rr.title} | ${rr.startDate} - ${rr.endDate} | ${Math.floor(rr.durationMonths / 12)}y ${rr.durationMonths % 12}m | ${rr.isRelevant ? "Yes" : "No"} | ${rr.reason} |\n`;
      });
      md += "\n";

      if (r.gapAnalysis.gapCount > 0) {
        md += "### Gap Analysis\n\n";
        r.gapAnalysis.gaps.forEach((g) => {
          md += `- ${g.from} -- ${g.to} (${g.months} months)\n`;
        });
        md += `\nTotal gap: ${r.gapAnalysis.totalGapMonths} months | Largest: ${r.gapAnalysis.largestGapMonths} months\n\n`;
      }

      if (r.expectations.length > 0) {
        md += "### Job Expects vs Resume Shows\n\n";
        md += "| Expectation | Status | Evidence |\n";
        md += "|-------------|--------|----------|\n";
        r.expectations.forEach((e) => {
          md += `| ${e.expectation} | ${e.status} | ${e.evidence || "--"} |\n`;
        });
        md += "\n";
      }

      md += "---\n\n";
    });

    downloadFile(md, "screening_results.md", "text/markdown");
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
      {/* Errors log */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            Warnings
          </h3>
          <ul className="space-y-1">
            {errors.map((e, i) => (
              <li key={i} className="text-xs text-amber-700">
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {results.length}
            </p>
            <p className="text-xs text-muted-foreground">Screened</p>
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
            <p className="text-2xl font-bold text-foreground">{mediumCount}</p>
            <p className="text-xs text-muted-foreground">Medium</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{weakCount}</p>
            <p className="text-xs text-muted-foreground">Weak</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {/* Match filter */}
          {["All", "Strong", "Medium", "Weak"].map((v) => (
            <button
              key={v}
              onClick={() => setFilterMatch(v)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filterMatch === v
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {v}
            </button>
          ))}

          {/* Req ID filter */}
          {reqIds.length > 2 && (
            <select
              value={filterReqId}
              onChange={(e) => setFilterReqId(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Filter by requisition"
            >
              {reqIds.map((id) => (
                <option key={id} value={id}>
                  {id === "All" ? "All Requisitions" : `REQ ${id}`}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
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
                <th className="w-8 px-3 py-3" />
                <th className="px-3 py-3 text-left">
                  <SortButton label="REQ" sortKeyName="reqId" />
                </th>
                <th className="px-3 py-3 text-left">
                  <SortButton label="Candidate" sortKeyName="name" />
                </th>
                <th className="hidden px-3 py-3 text-left md:table-cell">
                  <SortButton label="Relevant Exp" sortKeyName="relevantExp" />
                </th>
                <th className="hidden px-3 py-3 text-left lg:table-cell">
                  <SortButton label="Total Exp" sortKeyName="totalExp" />
                </th>
                <th className="hidden px-3 py-3 text-left lg:table-cell">
                  <SortButton label="Gaps" sortKeyName="gapCount" />
                </th>
                <th className="hidden px-3 py-3 text-left md:table-cell">
                  <SortButton label="Req Met" sortKeyName="metCount" />
                </th>
                <th className="hidden px-3 py-3 text-left xl:table-cell">
                  <span className="text-xs font-medium text-muted-foreground">Gap?</span>
                </th>
                <th className="hidden px-3 py-3 text-left xl:table-cell">
                  <span className="text-xs font-medium text-muted-foreground">Non-Rel?</span>
                </th>
                <th className="hidden px-3 py-3 text-left xl:table-cell">
                  <span className="text-xs font-medium text-muted-foreground">Edge?</span>
                </th>
                <th className="px-3 py-3 text-left">
                  <SortButton label="Match" sortKeyName="match" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((result) => {
                const rowId = `${result.reqId}-${result.resumeFile}`;
                const isExpanded = expandedId === rowId;
                return (
                  <tbody key={rowId}>
                    <tr
                      onClick={() =>
                        setExpandedId(isExpanded ? null : rowId)
                      }
                      className="cursor-pointer border-b border-border transition-colors hover:bg-muted/30"
                    >
                      <td className="px-3 py-3">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-muted-foreground">
                        {result.reqId}
                      </td>
                      <td className="px-3 py-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {result.candidateName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {result.resumeFile}
                          </p>
                        </div>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-3 md:table-cell">
                        <span className="font-semibold text-foreground">
                          {result.relevantYears}y {result.relevantMonths}m
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-3 text-muted-foreground lg:table-cell">
                        {result.totalYears}y {result.totalMonths}m
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-3 lg:table-cell">
                        {result.gapAnalysis.gapCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                            <AlertTriangle className="h-3 w-3" />
                            {result.gapAnalysis.gapCount}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-3 text-xs md:table-cell">
                        <span className="text-foreground">
                          {result.keyRequirementsMetCount}
                        </span>
                        <span className="text-muted-foreground">
                          /
                          {result.keyRequirementsMetCount +
                            result.keyRequirementsMissingCount}
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-3 xl:table-cell">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          result.gapAnalysis.gapCount > 0
                            ? "bg-amber-500/10 text-amber-700"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {result.gapAnalysis.gapCount > 0 ? "Y" : "N"}
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-3 xl:table-cell">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          result.nonRelevantExperienceCounted
                            ? "bg-amber-500/10 text-amber-700"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {result.nonRelevantExperienceCounted ? "Y" : "N"}
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-3 xl:table-cell">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          result.isEdgeCase
                            ? "bg-red-500/10 text-red-700"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {result.isEdgeCase ? "Y" : "N"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${matchStyles[result.overallMatch] || ""}`}
                        >
                          {result.overallMatch}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <ApplicantExpandedRow result={result} />
                    )}
                  </tbody>
                );
              })}
            </tbody>
          </table>
        </div>

        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="mb-2 h-8 w-8" />
            <p className="text-sm">No results match the current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
