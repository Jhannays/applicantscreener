"use client";

import { useState, useMemo, useCallback } from "react";
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
  RefreshCw,
  Play,
  Loader2,
  MessageSquare,
  NotebookPen,
  Send,
  Save,
  FolderOpen,
  Trash2,
  Sparkles,
} from "lucide-react";
import type {
  ApplicantResult,
  ExpectationCheck,
  ScreeningError,
  CorrectionRule,
  RoleNote,
  SMESessionNote,
  SMESession,
} from "@/lib/types";

interface ResultsDashboardProps {
  results: ApplicantResult[];
  errors: ScreeningError[];
  globalErrors: string[];
  onReset: () => void;
  onResultsChange: (results: ApplicantResult[]) => void;
  correctionRules: CorrectionRule[];
  onCorrectionRule: (rule: CorrectionRule) => void;
  /** Retry specific failed resumes without going back to upload */
  onRetry: (failedErrors: ScreeningError[]) => void;
  /** Whether a retry is currently in progress */
  isRetrying: boolean;
  /** Per-role SME notes */
  roleNotes: RoleNote[];
  onRoleNoteChange: (roleKey: string, note: string) => void;
  /** Global SME session notes */
  smeSessionNotes: SMESessionNote[];
  onSessionNoteAdd: (note: string) => void;
  onSessionNoteDelete: (id: string) => void;
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

const statusCycle: ExpectationCheck["status"][] = ["Met", "Partially Met", "Not Evident"];

function ExpectationsTable({
  checks,
  onStatusChange,
}: {
  checks: ExpectationCheck[];
  onStatusChange?: (index: number, newStatus: ExpectationCheck["status"]) => void;
}) {
  const minimumChecks = checks.filter((c) => c.category === "minimum");
  const preferredChecks = checks.filter((c) => c.category === "preferred");
  // Fallback for old data that may not have category
  const uncategorized = checks.filter((c) => !c.category);

  const handleCycle = (check: ExpectationCheck) => {
    if (!onStatusChange) return;
    const globalIndex = checks.indexOf(check);
    const currentIdx = statusCycle.indexOf(check.status);
    const nextStatus = statusCycle[(currentIdx + 1) % statusCycle.length];
    onStatusChange(globalIndex, nextStatus);
  };

  const renderRows = (items: ExpectationCheck[]) =>
    items.map((c, i) => (
      <tr key={i} className="border-b border-border last:border-0">
        <td className="px-3 py-2 text-sm text-foreground">
          {c.expectation}
          {c.manualOverride && (
            <span className="ml-1.5 inline-flex items-center rounded bg-blue-500/10 px-1 py-0.5 text-[10px] font-medium text-blue-700">
              OVERRIDDEN
            </span>
          )}
        </td>
        <td className="px-3 py-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleCycle(c); }}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-all hover:ring-2 hover:ring-primary/30 ${statusStyles[c.status] || ""}`}
            title="Click to cycle status: Met / Partially Met / Not Evident"
          >
            <RefreshCw className="h-2.5 w-2.5 opacity-50" />
            {c.status}
          </button>
        </td>
        <td className="max-w-xs px-3 py-2 text-xs text-muted-foreground">
          {c.evidence || "--"}
        </td>
      </tr>
    ));

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              Requirement
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              Status
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              Evidence from Resume
            </th>
          </tr>
        </thead>
        <tbody>
          {minimumChecks.length > 0 && (
            <>
              <tr>
                <td colSpan={3} className="bg-muted/30 px-3 py-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Minimum Requirements
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    (determines score)
                  </span>
                </td>
              </tr>
              {renderRows(minimumChecks)}
            </>
          )}
          {preferredChecks.length > 0 && (
            <>
              <tr>
                <td colSpan={3} className="bg-blue-500/5 px-3 py-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                    Preferred Requirements
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    (bonus only -- does not lower score)
                  </span>
                </td>
              </tr>
              {renderRows(preferredChecks)}
            </>
          )}
          {uncategorized.length > 0 && renderRows(uncategorized)}
        </tbody>
      </table>
    </div>
  );
}

function ApplicantExpandedRow({
  result,
  onToggleRelevance,
  onChangeExpectationStatus,
  roleNotes,
  onRoleNoteChange,
}: {
  result: ApplicantResult;
  onToggleRelevance: (roleIndex: number) => void;
  onChangeExpectationStatus: (expIndex: number, newStatus: ExpectationCheck["status"]) => void;
  roleNotes: RoleNote[];
  onRoleNoteChange: (roleKey: string, note: string) => void;
}) {
  const [showFullRationale, setShowFullRationale] = useState(false);
  const [editingNoteKey, setEditingNoteKey] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");

  const hasOverrides = result.roleRelevance.some((r) => r.manualOverride) ||
    result.expectations.some((e) => e.manualOverride);

  return (
    <tr>
      <td
        colSpan={11}
        className="border-b border-border bg-muted/10 px-4 py-5"
      >
        <div className="space-y-5">
          {/* Human override notice */}
          {hasOverrides && (
            <div className="flex items-center gap-2 rounded-md border border-blue-500/20 bg-blue-500/5 px-3 py-2">
              <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">
                This candidate has manual overrides applied. Values shown reflect reviewer adjustments.
              </span>
            </div>
          )}

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
                    Relevant Exp: <strong>{result.relevantYears}y {result.relevantMonths}m</strong> ({result.roleRelevance.filter((r) => r.isRelevant).length} of {result.roleRelevance.length} roles)
                  </span>
                  {(() => {
                    const minReqs = result.expectations.filter((e) => e.category === "minimum");
                    const prefReqs = result.expectations.filter((e) => e.category === "preferred");
                    const minMet = minReqs.filter((e) => e.status === "Met").length;
                    const minPartial = minReqs.filter((e) => e.status === "Partially Met").length;
                    const minTotal = minReqs.length || 1;
                    const minScore = ((minMet + minPartial * 0.5) / minTotal * 100).toFixed(0);
                    return (
                      <>
                        <span>
                          Minimum Reqs: <strong>{minMet}</strong>/{minReqs.length} met ({minScore}%)
                        </span>
                        {prefReqs.length > 0 && (
                          <span className="text-blue-700">
                            Preferred: {prefReqs.filter((e) => e.status === "Met").length}/{prefReqs.length} met (bonus)
                          </span>
                        )}
                      </>
                    );
                  })()}
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
                          <button
                            onClick={(e) => { e.stopPropagation(); onToggleRelevance(i); }}
                            className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-all hover:ring-2 hover:ring-primary/30 ${
                              r.isRelevant
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-red-500/10 text-red-500"
                            }`}
                            title="Click to toggle relevance"
                          >
                            <RefreshCw className="h-2.5 w-2.5 opacity-50" />
                            {r.isRelevant ? "Relevant" : "Not Relevant"}
                          </button>
                          {r.manualOverride && (
                            <span className="ml-1.5 inline-flex items-center rounded bg-blue-500/10 px-1 py-0.5 text-[10px] font-medium text-blue-700">
                              OVERRIDDEN
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td colSpan={5} className="px-3 pb-1 pt-0">
                          <div className={`rounded-md px-3 py-2 text-xs leading-relaxed ${r.isRelevant ? "bg-emerald-500/5 text-emerald-900" : "bg-red-500/5 text-red-900"}`}>
                            <span className="font-semibold">{r.isRelevant ? "Why relevant: " : "Why excluded: "}</span>
                            {r.reason}
                          </div>
                        </td>
                      </tr>
                      {/* SME Note for this role */}
                      <tr className="border-b border-border last:border-0">
                        <td colSpan={5} className="px-3 pb-3 pt-1">
                          {(() => {
                            const roleKey = `${result.reqId}::${i}`;
                            const existingNote = roleNotes.find((n) => n.roleKey === roleKey);
                            const isEditing = editingNoteKey === roleKey;

                            return (
                              <div className="rounded-md border border-dashed border-muted-foreground/20 bg-muted/30 px-3 py-2">
                                {isEditing ? (
                                  <div className="space-y-1.5">
                                    <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                      <MessageSquare className="h-3 w-3" />
                                      SME Note on This Role
                                    </label>
                                    <textarea
                                      value={draftNote}
                                      onChange={(e) => setDraftNote(e.target.value)}
                                      placeholder="Why should the model treat this role differently? What relevance logic should apply?"
                                      className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                                      rows={2}
                                    />
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          if (draftNote.trim()) {
                                            onRoleNoteChange(roleKey, draftNote.trim());
                                          }
                                          setEditingNoteKey(null);
                                          setDraftNote("");
                                        }}
                                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/10"
                                      >
                                        <Save className="h-2.5 w-2.5" />
                                        Save
                                      </button>
                                      <button
                                        onClick={() => { setEditingNoteKey(null); setDraftNote(""); }}
                                        className="rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : existingNote ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-blue-600">
                                        <MessageSquare className="h-3 w-3" />
                                        SME Note
                                      </span>
                                      <button
                                        onClick={() => {
                                          setEditingNoteKey(roleKey);
                                          setDraftNote(existingNote.note);
                                        }}
                                        className="text-[10px] font-medium text-primary hover:underline"
                                      >
                                        Edit
                                      </button>
                                    </div>
                                    <p className="text-xs leading-relaxed text-foreground">
                                      {existingNote.note}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground">
                                      {new Date(existingNote.createdAt).toLocaleTimeString()}
                                    </span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingNoteKey(roleKey);
                                      setDraftNote("");
                                    }}
                                    className="flex w-full items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary"
                                  >
                                    <MessageSquare className="h-3 w-3" />
                                    Add SME note on this role...
                                  </button>
                                )}
                              </div>
                            );
                          })()}
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
              <ExpectationsTable checks={result.expectations} onStatusChange={onChangeExpectationStatus} />
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
  onResultsChange,
  correctionRules,
  onCorrectionRule,
  onRetry,
  isRetrying,
  roleNotes,
  onRoleNoteChange,
  smeSessionNotes,
  onSessionNoteAdd,
  onSessionNoteDelete,
}: ResultsDashboardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedRetries, setSelectedRetries] = useState<Set<number>>(new Set());
  const [smePanelOpen, setSmePanelOpen] = useState(true);
  const [smeInput, setSmeInput] = useState("");
  const [showSavedSessions, setShowSavedSessions] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SMESession[]>([]);
  const [sessionNameInput, setSessionNameInput] = useState("");

  // ─── Anonymization ──────────────────────────────────────
  // Map real candidate names AND file names to anonymous labels.
  // No PII is ever shown in the UI, exports, or sent to the AI.
  const { getDisplayName, getDisplayFile } = useMemo(() => {
    const nameToLabel = new Map<string, string>();
    const fileToLabel = new Map<string, string>();
    let nameCounter = 0;
    let fileCounter = 0;

    const toLetter = (idx: number) => {
      let label = "";
      let n = idx;
      do {
        label = String.fromCharCode(65 + (n % 26)) + label;
        n = Math.floor(n / 26) - 1;
      } while (n >= 0);
      return label;
    };

    for (const r of results) {
      if (!nameToLabel.has(r.candidateName)) {
        nameToLabel.set(r.candidateName, `Candidate ${toLetter(nameCounter++)}`);
      }
      if (!fileToLabel.has(r.resumeFile)) {
        fileToLabel.set(r.resumeFile, `Resume-${toLetter(fileCounter++)}.pdf`);
      }
    }
    // Also map error file names
    for (const e of errors) {
      if (!fileToLabel.has(e.fileName)) {
        fileToLabel.set(e.fileName, `Resume-${toLetter(fileCounter++)}.pdf`);
      }
    }

    return {
      getDisplayName: (real: string) => nameToLabel.get(real) || "Candidate",
      getDisplayFile: (real: string) => fileToLabel.get(real) || "Resume.pdf",
    };
  }, [results, errors]);

  // ─── Session save / load ──────────────────────────────
  const loadSavedSessions = useCallback(() => {
    try {
      const raw = localStorage.getItem("sme-sessions");
      if (raw) setSavedSessions(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const saveSession = useCallback(
    (name: string) => {
      const session: SMESession = {
        id: crypto.randomUUID(),
        name: name || `Session ${new Date().toLocaleDateString()}`,
        createdAt: new Date().toISOString(),
        sessionNotes: smeSessionNotes,
        roleNotes,
        correctionRules,
      };
      const existing = savedSessions.filter((s) => s.name !== name);
      const updated = [session, ...existing];
      localStorage.setItem("sme-sessions", JSON.stringify(updated));
      setSavedSessions(updated);
    },
    [smeSessionNotes, roleNotes, correctionRules, savedSessions]
  );

  const deleteSession = useCallback(
    (id: string) => {
      const updated = savedSessions.filter((s) => s.id !== id);
      localStorage.setItem("sme-sessions", JSON.stringify(updated));
      setSavedSessions(updated);
    },
    [savedSessions]
  );

  // Recalculate derived fields after a toggle and propagate up
  const recalculateAndUpdate = useCallback(
    (resultIndex: number, updatedResult: ApplicantResult) => {
      // Recalculate relevant experience from role relevance
      const totalRelevantMonths = updatedResult.roleRelevance
        .filter((r) => r.isRelevant)
        .reduce((sum, r) => sum + r.durationMonths, 0);
      updatedResult.relevantYears = Math.floor(totalRelevantMonths / 12);
      updatedResult.relevantMonths = totalRelevantMonths % 12;

      // Recalculate non-relevant flag
      const totalMonths = updatedResult.roleRelevance.reduce((sum, r) => sum + r.durationMonths, 0);
      updatedResult.nonRelevantExperienceCounted = totalRelevantMonths < totalMonths;

      // Recalculate expectations-based scores (only minimum reqs determine match)
      const minReqs = updatedResult.expectations.filter((e) => e.category === "minimum");
      const minMet = minReqs.filter((e) => e.status === "Met").length;
      const minPartial = minReqs.filter((e) => e.status === "Partially Met").length;
      const minTotal = minReqs.length || 1;
      const minimumScore = (minMet + minPartial * 0.5) / minTotal;

      updatedResult.keyRequirementsMetCount = updatedResult.expectations.filter((e) => e.status === "Met").length;
      updatedResult.keyRequirementsMissingCount = updatedResult.expectations.filter((e) => e.status === "Not Evident").length;

      if (minimumScore >= 0.7 && totalRelevantMonths >= 12) {
        updatedResult.overallMatch = "Strong";
      } else if (minimumScore >= 0.4) {
        updatedResult.overallMatch = "Medium";
      } else {
        updatedResult.overallMatch = "Weak";
      }

      const newResults = [...results];
      newResults[resultIndex] = { ...updatedResult };
      onResultsChange(newResults);
    },
    [results, onResultsChange]
  );

  // Background call to analyze an override and generate a correction rule
  const analyzeOverride = useCallback(
    async (
      type: "relevance" | "expectation",
      reqId: string,
      candidateName: string,
      original: string,
      corrected: string,
      roleOrExpectation: string,
      evidence?: string
    ) => {
      try {
        const res = await fetch("/api/screen/analyze-override", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            reqId,
            context: {
              jobRequirements: "", // The AI will work from the override context
              candidateName,
              original,
              corrected,
              roleOrExpectation,
              evidence,
            },
          }),
        });
        const data = await res.json();
        const rule: CorrectionRule = {
          type,
          reqId,
          original,
          corrected,
          lesson: data.lesson || "Override recorded.",
          createdAt: new Date().toISOString(),
        };
        onCorrectionRule(rule);
      } catch {
        // Non-fatal: the override still takes effect even if analysis fails
      }
    },
    [onCorrectionRule]
  );

  const handleToggleRelevance = useCallback(
    (resultIndex: number, roleIndex: number) => {
      const result = { ...results[resultIndex] };
      const roles = [...result.roleRelevance];
      const role = { ...roles[roleIndex] };
      const originalRelevant = role.isRelevant;
      role.isRelevant = !role.isRelevant;
      role.manualOverride = true;
      roles[roleIndex] = role;
      result.roleRelevance = roles;
      recalculateAndUpdate(resultIndex, result);

      // Fire background analysis
      analyzeOverride(
        "relevance",
        result.reqId,
        getDisplayName(result.candidateName),
        originalRelevant ? "Relevant" : "Not Relevant",
        role.isRelevant ? "Relevant" : "Not Relevant",
        `${role.title} at ${role.employer}`,
        role.reason
      );
    },
    [results, recalculateAndUpdate, analyzeOverride, getDisplayName]
  );

  const handleChangeExpectationStatus = useCallback(
    (resultIndex: number, expIndex: number, newStatus: ExpectationCheck["status"]) => {
      const result = { ...results[resultIndex] };
      const expectations = [...result.expectations];
      const exp = { ...expectations[expIndex] };
      const originalStatus = exp.status;
      exp.status = newStatus;
      exp.manualOverride = true;
      expectations[expIndex] = exp;
      result.expectations = expectations;
      recalculateAndUpdate(resultIndex, result);

      // Fire background analysis
      analyzeOverride(
        "expectation",
        result.reqId,
        getDisplayName(result.candidateName),
        originalStatus,
        newStatus,
        exp.expectation,
        exp.evidence
      );
    },
    [results, recalculateAndUpdate, analyzeOverride, getDisplayName]
  );
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
          return dir * getDisplayName(a.candidateName).localeCompare(getDisplayName(b.candidateName));
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
      "Relevant Years of Experience",
      "Certifications",
      "Overall Match",
      "Gap Present? (Y/N)",
      "Non-Relevant Experience Counted? (Y/N)",
      "Edge Case? (Y/N)",
      "Relevance Reasoning",
    ];

    const rows = results.map((r) => {
      const educationStr = r.education
        .map((e) => `${e.degree} - ${e.institution}`)
        .join("; ");
      const skillsStr = r.skills.join("; ");
      const certsStr = r.certifications.join("; ");
      const yoeStr = `${r.relevantYears} years ${r.relevantMonths} months`;
      const gapPresent = r.gapAnalysis.gapCount > 0 ? "Y" : "N";
      const nonRelevant = r.nonRelevantExperienceCounted ? "Y" : "N";
      const edgeCase = r.isEdgeCase ? "Y" : "N";

      // Build relevance reasoning: per-role breakdown
      const reasoningParts = r.roleRelevance.map((role) => {
        const yrs = Math.floor(role.durationMonths / 12);
        const mos = role.durationMonths % 12;
        const durationStr = yrs > 0 ? `${yrs}y ${mos}m` : `${mos}m`;
        const relevantTag = role.isRelevant ? "RELEVANT" : "NOT RELEVANT";
        const overrideTag = role.manualOverride ? " [MANUALLY OVERRIDDEN]" : "";
        return `${role.title} at ${role.employer} (${durationStr}, ${relevantTag}${overrideTag}): ${role.reason}`;
      });
      const reasoningStr = reasoningParts.join("; ");

      return [
        csvEscape(r.reqId),
        csvEscape(getDisplayName(r.candidateName)),
        csvEscape(educationStr || "N/A"),
        csvEscape(skillsStr || "N/A"),
        csvEscape(yoeStr),
        csvEscape(certsStr || "N/A"),
        csvEscape(r.overallMatch),
        gapPresent,
        nonRelevant,
        edgeCase,
        csvEscape(reasoningStr || "N/A"),
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
            csvEscape(getDisplayFile(e.fileName)),
            csvEscape(`ERROR: ${e.error}`),
            "",
            "",
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
    const anonymized = results.map((r) => ({
      ...r,
      candidateName: getDisplayName(r.candidateName),
      resumeFile: getDisplayFile(r.resumeFile),
    }));
    downloadFile(
      JSON.stringify({ results: anonymized, errors }, null, 2),
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
      md += `| ${r.reqId} | ${getDisplayFile(r.resumeFile)} | ${getDisplayName(r.candidateName)} | ${r.relevantYears}y ${r.relevantMonths}m | ${r.totalYears}y ${r.totalMonths}m | ${r.gapAnalysis.gapCount} | ${r.keyRequirementsMetCount}/${r.keyRequirementsMetCount + r.keyRequirementsMissingCount} | ${r.overallMatch} |\n`;
    });

    if (errors.length > 0) {
      md += "\n## Failed Resumes\n\n";
      md += "| REQ ID | File | Error |\n";
      md += "|--------|------|-------|\n";
      errors.forEach((e) => {
        md += `| ${e.reqId} | ${getDisplayFile(e.fileName)} | ${e.error} |\n`;
      });
    }

    md += "\n---\n\n";

    results.forEach((r) => {
      md += `## ${getDisplayName(r.candidateName)} (REQ ${r.reqId})\n\n`;
      md += `**File:** ${getDisplayFile(r.resumeFile)}\n\n`;
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

  // ─── Generate Model Developer Prompt ────────────────────
  const generateModelPrompt = () => {
    let prompt = "# Screening Model -- Relevance & Evaluation Logic\n\n";
    prompt += `> Generated from SME review session on ${new Date().toLocaleDateString()}\n`;
    prompt += `> ${smeSessionNotes.length} session notes, ${roleNotes.length} role-level notes, ${correctionRules.length} correction rules\n\n`;
    prompt += "Use the rules and examples below to calibrate your screening logic. These were captured during a live review session with a Subject Matter Expert.\n\n";

    // Section 1: Relevance Logic from Role Notes
    prompt += "---\n\n## 1. Role Relevance Logic\n\n";
    prompt += "The following notes describe how the SME expects role relevance to be determined. Apply these rules when deciding if a candidate's work experience is relevant to a job posting.\n\n";
    if (roleNotes.length > 0) {
      for (const rn of roleNotes) {
        // Find the result and role this note corresponds to
        const [reqId, idxStr] = rn.roleKey.split("::");
        const roleIdx = parseInt(idxStr, 10);
        const matchingResult = results.find((r) => r.reqId === reqId);
        const role = matchingResult?.roleRelevance[roleIdx];
        if (role) {
          const relevance = role.isRelevant ? "RELEVANT" : "NOT RELEVANT";
          prompt += `### ${role.title} at ${role.employer} -- marked ${relevance}\n`;
          prompt += `- **Duration:** ${Math.floor(role.durationMonths / 12)}y ${role.durationMonths % 12}m\n`;
          prompt += `- **AI Reason:** ${role.reason}\n`;
          if (role.manualOverride) prompt += `- **Override:** The SME manually changed this determination.\n`;
          prompt += `- **SME Note:** ${rn.note}\n`;
          prompt += `- **Rule:** ${rn.note}\n\n`;
        } else {
          prompt += `- [REQ ${reqId}, Role #${roleIdx}]: ${rn.note}\n\n`;
        }
      }
    } else {
      prompt += "_No role-level notes were recorded._\n\n";
    }

    // Section 2: Override Examples
    const relevanceOverrides = results.flatMap((r) =>
      r.roleRelevance
        .map((role, idx) => ({ role, idx, result: r }))
        .filter(({ role }) => role.manualOverride)
    );
    const expectationOverrides = results.flatMap((r) =>
      r.expectations
        .map((exp, idx) => ({ exp, idx, result: r }))
        .filter(({ exp }) => exp.manualOverride)
    );

    if (relevanceOverrides.length > 0 || expectationOverrides.length > 0) {
      prompt += "---\n\n## 2. Concrete Override Examples\n\n";
      prompt += "These are specific cases where the AI's initial determination was corrected by the SME. Study these patterns to avoid similar mistakes.\n\n";

      if (relevanceOverrides.length > 0) {
        prompt += "### Relevance Overrides\n\n";
        for (const { role, result } of relevanceOverrides) {
          prompt += `- **${role.title} at ${role.employer}** (REQ ${result.reqId}): The AI marked this as **${role.isRelevant ? "Not Relevant" : "Relevant"}**, but the SME corrected it to **${role.isRelevant ? "Relevant" : "Not Relevant"}**.\n`;
          prompt += `  - AI reasoning: ${role.reason}\n`;
          const roleKey = `${result.reqId}::${result.roleRelevance.indexOf(role)}`;
          const note = roleNotes.find((rn) => rn.roleKey === roleKey);
          if (note) prompt += `  - SME explanation: ${note.note}\n`;
          prompt += "\n";
        }
      }

      if (expectationOverrides.length > 0) {
        prompt += "### Requirement Status Overrides\n\n";
        for (const { exp, result } of expectationOverrides) {
          prompt += `- **${exp.expectation}** (REQ ${result.reqId}): Status changed to **${exp.status}**.\n`;
          prompt += `  - Evidence: ${exp.evidence || "None cited"}\n\n`;
        }
      }
    }

    // Section 3: Correction Rules (AI-generated lessons)
    if (correctionRules.length > 0) {
      prompt += "---\n\n## 3. Learned Correction Rules\n\n";
      prompt += "These rules were generated by analyzing each override. They are generalized instructions the model MUST follow.\n\n";
      const relevanceRules = correctionRules.filter((r) => r.type === "relevance");
      const expectationRules = correctionRules.filter((r) => r.type === "expectation");

      if (relevanceRules.length > 0) {
        prompt += "### Relevance Rules\n\n";
        for (const rule of relevanceRules) {
          prompt += `- ${rule.lesson}\n`;
        }
        prompt += "\n";
      }
      if (expectationRules.length > 0) {
        prompt += "### Requirement Evaluation Rules\n\n";
        for (const rule of expectationRules) {
          prompt += `- ${rule.lesson}\n`;
        }
        prompt += "\n";
      }
    }

    // Section 4: General SME Guidance
    prompt += "---\n\n## 4. General SME Guidance\n\n";
    prompt += "The following notes capture the SME's overall philosophy and edge-case guidance for screening logic.\n\n";
    if (smeSessionNotes.length > 0) {
      for (const n of smeSessionNotes) {
        prompt += `- ${n.note}\n`;
      }
      prompt += "\n";
    } else {
      prompt += "_No session-level notes were recorded._\n\n";
    }

    // Section 5: Summary Statistics
    prompt += "---\n\n## 5. Session Statistics\n\n";
    prompt += `- Candidates reviewed: ${results.length}\n`;
    prompt += `- Relevance overrides: ${relevanceOverrides.length}\n`;
    prompt += `- Requirement status overrides: ${expectationOverrides.length}\n`;
    prompt += `- Correction rules generated: ${correctionRules.length}\n`;
    prompt += `- Role-level SME notes: ${roleNotes.length}\n`;
    prompt += `- Session-level SME notes: ${smeSessionNotes.length}\n`;

    downloadFile(prompt, "model_developer_prompt.md", "text/markdown");
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
            <div className="flex items-center gap-2">
              {errors.length > 0 && !isRetrying && (
                <span className="text-xs font-medium text-destructive/60">
                  Select to retry
                </span>
              )}
              {showErrorsExpanded ? (
                <ChevronUp className="h-4 w-4 text-destructive/70" />
              ) : (
                <ChevronDown className="h-4 w-4 text-destructive/70" />
              )}
            </div>
          </button>

          {showErrorsExpanded && (
            <div className="border-t border-destructive/20 px-4 py-3 space-y-3">
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
                <>
                  {/* Retry controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-destructive/70 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedRetries.size === errors.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRetries(new Set(errors.map((_, i) => i)));
                            } else {
                              setSelectedRetries(new Set());
                            }
                          }}
                          className="rounded border-destructive/30"
                          disabled={isRetrying}
                        />
                        Select all
                      </label>
                      {selectedRetries.size > 0 && (
                        <span className="text-xs text-destructive/60">
                          {selectedRetries.size} selected
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedRetries.size > 0 && (
                        <button
                          onClick={() => {
                            const toRetry = errors.filter((_, i) => selectedRetries.has(i));
                            setSelectedRetries(new Set());
                            onRetry(toRetry);
                          }}
                          disabled={isRetrying}
                          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                          {isRetrying ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                          Retry {selectedRetries.size} Resume{selectedRetries.size !== 1 ? "s" : ""}
                        </button>
                      )}
                      {errors.length > 1 && (
                        <button
                          onClick={() => {
                            setSelectedRetries(new Set());
                            onRetry(errors);
                          }}
                          disabled={isRetrying}
                          className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                        >
                          {isRetrying ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          Retry All
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Retrying indicator */}
                  {isRetrying && (
                    <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span className="text-xs font-medium text-primary">
                        Retrying failed resumes... Results will be added to the table automatically.
                      </span>
                    </div>
                  )}

                  <div className="overflow-x-auto rounded-md border border-destructive/20">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-destructive/20 bg-destructive/5">
                          <th className="w-8 px-3 py-2" />
                          <th className="px-3 py-2 text-left text-xs font-medium text-destructive/70">
                            REQ
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-destructive/70">
                            File
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-destructive/70">
                            Error
                          </th>
                          <th className="w-20 px-3 py-2 text-right text-xs font-medium text-destructive/70">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {errors.map((e, i) => (
                          <tr
                            key={i}
                            className="border-b border-destructive/10 last:border-0"
                          >
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={selectedRetries.has(i)}
                                onChange={(ev) => {
                                  const next = new Set(selectedRetries);
                                  if (ev.target.checked) {
                                    next.add(i);
                                  } else {
                                    next.delete(i);
                                  }
                                  setSelectedRetries(next);
                                }}
                                className="rounded border-destructive/30"
                                disabled={isRetrying}
                              />
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-destructive/80">
                              {e.reqId}
                            </td>
                            <td className="px-3 py-2 text-xs text-destructive/80">
                              {getDisplayFile(e.fileName)}
                            </td>
                            <td className="max-w-md px-3 py-2 text-xs text-destructive/70">
                              {e.error}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => {
                                  onRetry([e]);
                                }}
                                disabled={isRetrying}
                                className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
                                title={`Retry ${getDisplayFile(e.fileName)}`}
                              >
                                {isRetrying ? (
                                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                ) : (
                                  <Play className="h-2.5 w-2.5" />
                                )}
                                Retry
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
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

      {/* SME Review Notes Panel */}
      <div className="rounded-lg border border-border bg-card">
        <button
          onClick={() => setSmePanelOpen(!smePanelOpen)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              SME Review Notes
            </span>
            {smeSessionNotes.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {smeSessionNotes.length}
              </span>
            )}
            {roleNotes.length > 0 && (
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                {roleNotes.length} role note{roleNotes.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Save / Load buttons */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const name = sessionNameInput.trim() || `Session ${new Date().toLocaleDateString()}`;
                saveSession(name);
                setSessionNameInput("");
              }}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/10"
              title="Save current session"
            >
              <Save className="h-3 w-3" />
              Save
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                loadSavedSessions();
                setShowSavedSessions(!showSavedSessions);
              }}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted"
              title="Load a saved session"
            >
              <FolderOpen className="h-3 w-3" />
              Load
            </button>
            {smePanelOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {smePanelOpen && (
          <div className="border-t border-border px-4 py-3 space-y-3">
            {/* Saved sessions dropdown */}
            {showSavedSessions && (
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Saved Sessions
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      value={sessionNameInput}
                      onChange={(e) => setSessionNameInput(e.target.value)}
                      placeholder="Session name..."
                      className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                {savedSessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No saved sessions yet.</p>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {savedSessions.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-md bg-background px-3 py-2 text-xs"
                      >
                        <div>
                          <span className="font-medium text-foreground">{s.name}</span>
                          <span className="ml-2 text-muted-foreground">
                            {new Date(s.createdAt).toLocaleString()} -- {s.sessionNotes.length} notes, {s.roleNotes.length} role notes
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Restore session notes and role notes
                              for (const n of s.sessionNotes) onSessionNoteAdd(n.note);
                              for (const rn of s.roleNotes) onRoleNoteChange(rn.roleKey, rn.note);
                              setShowSavedSessions(false);
                            }}
                            className="rounded px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/10"
                          >
                            Load
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(s.id);
                            }}
                            className="rounded px-1.5 py-1 text-[11px] text-destructive/60 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Conversation log */}
            {smeSessionNotes.length > 0 && (
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {smeSessionNotes.map((n) => (
                  <div
                    key={n.id}
                    className="group flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2"
                  >
                    <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-primary/60" />
                    <div className="flex-1">
                      <p className="text-xs leading-relaxed text-foreground">{n.note}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(n.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <button
                      onClick={() => onSessionNoteDelete(n.id)}
                      className="shrink-0 rounded p-0.5 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex items-start gap-2">
              <textarea
                value={smeInput}
                onChange={(e) => setSmeInput(e.target.value)}
                placeholder="Type SME notes here... e.g. 'Roles in home health should count as relevant for nursing positions because...'"
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && smeInput.trim()) {
                    onSessionNoteAdd(smeInput.trim());
                    setSmeInput("");
                  }
                }}
              />
              <button
                onClick={() => {
                  if (smeInput.trim()) {
                    onSessionNoteAdd(smeInput.trim());
                    setSmeInput("");
                  }
                }}
                disabled={!smeInput.trim()}
                className="rounded-md bg-primary px-3 py-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Press Ctrl+Enter to send. These notes will be included when generating the model developer prompt.
            </p>
          </div>
        )}
      </div>

      {/* Correction Rules Indicator */}
      {correctionRules.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-2.5">
          <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-xs text-blue-700">
            <strong>{correctionRules.length}</strong> correction rule{correctionRules.length !== 1 ? "s" : ""} learned from your overrides.
            {" "}Re-screening will apply these corrections to avoid repeating the same mistakes.
          </span>
        </div>
      )}

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
            onClick={generateModelPrompt}
            disabled={smeSessionNotes.length === 0 && roleNotes.length === 0 && correctionRules.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Generate a structured prompt document distilling all SME notes, overrides, and correction rules for your model developer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate Model Prompt
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
                            {getDisplayName(result.candidateName)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getDisplayFile(result.resumeFile)}
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
                      <ApplicantExpandedRow
                        result={result}
                        onToggleRelevance={(roleIndex) => {
                          const globalIndex = results.indexOf(result);
                          if (globalIndex !== -1) handleToggleRelevance(globalIndex, roleIndex);
                        }}
                        onChangeExpectationStatus={(expIndex, newStatus) => {
                          const globalIndex = results.indexOf(result);
                          if (globalIndex !== -1) handleChangeExpectationStatus(globalIndex, expIndex, newStatus);
                        }}
                        roleNotes={roleNotes}
                        onRoleNoteChange={onRoleNoteChange}
                      />
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
