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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type {
  ApplicantResult,
  ExpectationCheck,
  ScreeningError,
} from "@/lib/types";

interface ResultsDashboardProps {
  results: ApplicantResult[];
  errors: ScreeningError[];
  globalErrors: string[];
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

const PAGE_SIZE = 15;

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
  const [showFullRationale, setShowFullRationale] = useState(false);

  return (
    <tr>
      <td
        colSpan={11}
        className="border-b border-border bg-muted/10 px-4 py-5"
      >
        <div className="space-y-5">
          {/* Screening Logic Rationale */}
          {result.screeningRationale && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  <FileText className="h-3.5 w-3.5" />
                  Screening Logic & Rationale
                </h4>
                <button
                  onClick={() => setShowFullRationale(!showFullRationale)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {showFullRationale ? "Collapse" : "View Full Rationale"}
                </button>
              </div>
              {showFullRationale ? (
                <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground font-mono">{result.screeningRationale}</pre>
              ) : (
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-foreground">
                  <span>
                    Relevant: <strong>{result.relevantYears}y {result.relevantMonths}m</strong> ({result.roleRelevance.filter((r) => r.isRelevant).length} of {result.roleRelevance.length} roles)
                  </span>
                  <span>
                    Requirements: <strong>{result.keyRequirementsMetCount}</strong> met / <strong>{result.expectations.filter((e) => e.status === "Partially Met").length}</strong> partial / <strong>{result.keyRequirementsMissingCount}</strong> not evident
                  </span>
                  <span>
                    Score: <strong>{result.expectations.length > 0 ? ((result.keyRequirementsMetCount + result.expectations.filter((e) => e.status === "Partially Met").length * 0.5) / result.expectations.length * 100).toFixed(0) : 0}%</strong>
                  </span>
                  {result.isEdgeCase && (
                    <span className="font-medium text-amber-700">Edge case -- manual review recommended</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Education / Skills / Certs */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
              <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
              <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                  </tr>
                </thead>
                <tbody>
                  {result.roleRelevance.map((r, i) => (
                    <tbody key={i}>
                      <tr
                        className="border-b border-border/50"
                      >
                        <td className="px-3 py-2 text-sm font-medium text-foreground">
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
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Relevant
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500">
                              <XCircle className="h-3.5 w-3.5" />
                              Not Relevant
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr className="border-b border-border last:border-0">
                        <td colSpan={5} className="px-3 pb-3 pt-0">
                          <div className={`rounded-md px-3 py-2 text-xs leading-relaxed ${r.isRelevant ? "bg-emerald-500/5 text-emerald-900" : "bg-red-500/5 text-red-900"}`}>
                            <span className="font-semibold">{r.isRelevant ? "Why relevant: " : "Why excluded: "}</span>
                            {r.reason}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gap Analysis */}
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                    Gaps:{" "}
                    <strong className="text-foreground">
                      {result.gapAnalysis.gapCount}
                    </strong>
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
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
  globalErrors,
  onReset,
}: ResultsDashboardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("relevantExp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterMatch, setFilterMatch] = useState<string>("All");
  const [filterReqId, setFilterReqId] = useState<string>("All");
  const [page, setPage] = useState(0);
  const [showErrorsExpanded, setShowErrorsExpanded] = useState(false);

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
    setPage(0);
  };

  const filtered = useMemo(() => {
    let f = results;
    if (filterMatch !== "All")
      f = f.filter((r) => r.overallMatch === filterMatch);
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
          return (
            dir *
            ((order[a.overallMatch] || 0) - (order[b.overallMatch] || 0))
          );
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

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const strongCount = results.filter(
    (r) => r.overallMatch === "Strong"
  ).length;
  const mediumCount = results.filter(
    (r) => r.overallMatch === "Medium"
  ).length;
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

  const csvEscape = (value: string) => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
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
      "Relevant Roles",
      "Non-Relevant Roles",
      "Requirements Met",
      "Requirements Not Met",
      "Screening Rationale",
    ];

    const rows = results.map((r) => {
      const educationStr = r.education
        .map((e) => `${e.degree} - ${e.institution}`)
        .join("; ");
      const skillsStr = r.skills.join("; ");
      const certsStr = r.certifications.join("; ");
      const yoeStr = `${r.relevantYears} years ${r.relevantMonths} months relevant / ${r.totalYears} years ${r.totalMonths} months total`;
      const gapPresent = r.gapAnalysis.gapCount > 0 ? "Y" : "N";
      const nonRelevant = r.nonRelevantExperienceCounted ? "Y" : "N";
      const edgeCase = r.isEdgeCase ? "Y" : "N";

      const relevantRolesStr = r.roleRelevance
        .filter((rr) => rr.isRelevant)
        .map((rr) => `${rr.title} at ${rr.employer} (${Math.floor(rr.durationMonths / 12)}y ${rr.durationMonths % 12}m): ${rr.reason}`)
        .join("; ");
      const nonRelevantRolesStr = r.roleRelevance
        .filter((rr) => !rr.isRelevant)
        .map((rr) => `${rr.title} at ${rr.employer} (${Math.floor(rr.durationMonths / 12)}y ${rr.durationMonths % 12}m): ${rr.reason}`)
        .join("; ");
      const reqMetStr = r.expectations
        .filter((e) => e.status === "Met")
        .map((e) => `${e.expectation}: ${e.evidence}`)
        .join("; ");
      const reqNotMetStr = r.expectations
        .filter((e) => e.status === "Not Evident")
        .map((e) => e.expectation)
        .join("; ");

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
        csvEscape(relevantRolesStr || "None"),
        csvEscape(nonRelevantRolesStr || "None"),
        csvEscape(reqMetStr || "None"),
        csvEscape(reqNotMetStr || "None"),
        csvEscape(r.screeningRationale || ""),
      ].join(",");
    });

    // Also add errored resumes at the bottom
    if (errors.length > 0) {
      rows.push(""); // blank line
      rows.push("# FAILED RESUMES");
      errors.forEach((e) => {
        rows.push(
          [
            csvEscape(e.reqId),
            csvEscape(e.fileName),
            csvEscape(`ERROR: ${e.error}`),
            "",
            "",
            "",
            "",
            "",
            "",
          ].join(",")
        );
      });
    }

    downloadFile(
      [headers.join(","), ...rows].join("\n"),
      "all_candidates.csv",
      "text/csv"
    );
  };

  const exportJSON = () => {
    downloadFile(
      JSON.stringify({ results, errors }, null, 2),
      "all_candidates.json",
      "application/json"
    );
  };

  const exportMarkdown = () => {
    let md = "# Applicant Screening Results\n\n";
    md += `Generated: ${new Date().toISOString()}\n\n`;

    md += "## Summary\n\n";
    md += "| REQ ID | Resume | Candidate | Relevant Exp | Total Exp | Gaps | Req Met | Match |\n";
    md += "|--------|--------|-----------|-------------|-----------|------|---------|-------|\n";
    results.forEach((r) => {
      md += `| ${r.reqId} | ${r.resumeFile} | ${r.candidateName} | ${r.relevantYears}y ${r.relevantMonths}m | ${r.totalYears}y ${r.totalMonths}m | ${r.gapAnalysis.gapCount} | ${r.keyRequirementsMetCount}/${r.keyRequirementsMetCount + r.keyRequirementsMissingCount} | ${r.overallMatch} |\n`;
    });

    if (errors.length > 0) {
      md += "\n## Failed Resumes\n\n";
      md += "| REQ ID | File | Error |\n";
      md += "|--------|------|-------|\n";
      errors.forEach((e) => {
        md += `| ${e.reqId} | ${e.fileName} | ${e.error} |\n`;
      });
    }

    md += "\n---\n\n";

    results.forEach((r) => {
      md += `## ${r.candidateName} (REQ ${r.reqId})\n\n`;
      md += `**File:** ${r.resumeFile}\n\n`;
      md += `**Overall Match:** ${r.overallMatch}\n`;
      md += `**Relevant Experience:** ${r.relevantYears} years ${r.relevantMonths} months\n`;
      md += `**Total Experience:** ${r.totalYears} years ${r.totalMonths} months\n\n`;

      if (r.screeningRationale) {
        md += "### Screening Rationale\n\n";
        md += "```\n" + r.screeningRationale + "\n```\n\n";
      }

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
      {/* Failed Resumes Section */}
      {(errors.length > 0 || globalErrors.length > 0) && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5">
          <button
            onClick={() => setShowErrorsExpanded(!showErrorsExpanded)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">
                {errors.length} Resume{errors.length !== 1 ? "s" : ""} Failed
              </span>
              {globalErrors.length > 0 && (
                <span className="text-xs text-destructive/70">
                  + {globalErrors.length} warning
                  {globalErrors.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {showErrorsExpanded ? (
              <ChevronUp className="h-4 w-4 text-destructive/70" />
            ) : (
              <ChevronDown className="h-4 w-4 text-destructive/70" />
            )}
          </button>

          {showErrorsExpanded && (
            <div className="border-t border-destructive/20 px-4 py-3">
              {globalErrors.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-destructive/60">
                    Warnings
                  </p>
                  {globalErrors.map((e, i) => (
                    <p key={i} className="text-xs text-destructive/80">
                      {e}
                    </p>
                  ))}
                </div>
              )}

              {errors.length > 0 && (
                <div className="overflow-x-auto rounded-md border border-destructive/20">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-destructive/20 bg-destructive/5">
                        <th className="px-3 py-2 text-left text-xs font-medium text-destructive/70">
                          REQ
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-destructive/70">
                          File
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-destructive/70">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {errors.map((e, i) => (
                        <tr
                          key={i}
                          className="border-b border-destructive/10 last:border-0"
                        >
                          <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-destructive/80">
                            {e.reqId}
                          </td>
                          <td className="px-3 py-2 text-xs text-destructive/80">
                            {e.fileName}
                          </td>
                          <td className="max-w-md px-3 py-2 text-xs text-destructive/70">
                            {e.error}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
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
        {errors.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">
                {errors.length}
              </p>
              <p className="text-xs text-destructive/70">Failed</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {["All", "Strong", "Medium", "Weak"].map((v) => (
            <button
              key={v}
              onClick={() => {
                setFilterMatch(v);
                setPage(0);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filterMatch === v
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {v}
            </button>
          ))}

          {reqIds.length > 2 && (
            <select
              value={filterReqId}
              onChange={(e) => {
                setFilterReqId(e.target.value);
                setPage(0);
              }}
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
                  <span className="text-xs font-medium text-muted-foreground">
                    Gap?
                  </span>
                </th>
                <th className="hidden px-3 py-3 text-left xl:table-cell">
                  <span className="text-xs font-medium text-muted-foreground">
                    Non-Rel?
                  </span>
                </th>
                <th className="hidden px-3 py-3 text-left xl:table-cell">
                  <span className="text-xs font-medium text-muted-foreground">
                    Edge?
                  </span>
                </th>
                <th className="px-3 py-3 text-left">
                  <SortButton label="Match" sortKeyName="match" />
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.map((result) => {
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
                          <span className="text-xs text-muted-foreground">
                            0
                          </span>
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
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            result.gapAnalysis.gapCount > 0
                              ? "bg-amber-500/10 text-amber-700"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {result.gapAnalysis.gapCount > 0 ? "Y" : "N"}
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-3 xl:table-cell">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            result.nonRelevantExperienceCounted
                              ? "bg-amber-500/10 text-amber-700"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {result.nonRelevantExperienceCounted ? "Y" : "N"}
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-3 xl:table-cell">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            result.isEdgeCase
                              ? "bg-red-500/10 text-red-700"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing {page * PAGE_SIZE + 1} -{" "}
              {Math.min((page + 1) * PAGE_SIZE, sorted.length)} of{" "}
              {sorted.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent disabled:opacity-30"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-xs text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setPage(Math.min(totalPages - 1, page + 1))
                }
                disabled={page >= totalPages - 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent disabled:opacity-30"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
