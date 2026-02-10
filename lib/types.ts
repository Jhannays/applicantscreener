// ──────────────────────────────────────────────
// Upload / Input Types
// ──────────────────────────────────────────────

/** A job-requirements file keyed by requisition id */
export interface JobFile {
  reqId: string;
  fileName: string;
  /** The raw File object (for FormData upload) */
  file: File;
}

/** A resume grouped under a requisition */
export interface ResumeFile {
  reqId: string;
  fileName: string;
  /** The raw File object (for FormData upload) */
  file: File;
  size: number;
  fileType: "text" | "pdf" | "docx";
}

// ──────────────────────────────────────────────
// Parsed / Extracted Types
// ──────────────────────────────────────────────

export interface WorkExperience {
  employer: string;
  title: string;
  startDate: string; // "Month YYYY"
  endDate: string; // "Month YYYY" or "Present"
  bullets: string[];
}

export interface Education {
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
}

export interface ParsedResume {
  candidateName: string;
  education: Education[];
  skills: string[];
  certifications: string[];
  workExperience: WorkExperience[];
}

// ──────────────────────────────────────────────
// Gap Analysis
// ──────────────────────────────────────────────

export interface GapEntry {
  from: string; // "Month YYYY"
  to: string; // "Month YYYY"
  months: number;
}

export interface GapAnalysis {
  gaps: GapEntry[];
  gapCount: number;
  largestGapMonths: number;
  totalGapMonths: number;
}

// ──────────────────────────────────────────────
// Role Relevance
// ──────────────────────────────────────────────

export interface RoleRelevance {
  employer: string;
  title: string;
  startDate: string;
  endDate: string;
  isRelevant: boolean;
  reason: string;
  durationMonths: number;
}

// ──────────────────────────────────────────────
// Job Expects vs Resume Shows
// ──────────────────────────────────────────────

export interface ExpectationCheck {
  expectation: string;
  status: "Met" | "Partially Met" | "Not Evident";
  evidence: string;
}

// ──────────────────────────────────────────────
// Per-Resume Result
// ──────────────────────────────────────────────

export interface ApplicantResult {
  reqId: string;
  resumeFile: string;
  candidateName: string;
  education: Education[];
  skills: string[];
  certifications: string[];
  workExperience: WorkExperience[];
  gapAnalysis: GapAnalysis;
  roleRelevance: RoleRelevance[];
  relevantYears: number;
  relevantMonths: number;
  totalYears: number;
  totalMonths: number;
  expectations: ExpectationCheck[];
  keyRequirementsMetCount: number;
  keyRequirementsMissingCount: number;
  overallMatch: "Strong" | "Medium" | "Weak";
  nonRelevantExperienceCounted: boolean;
  isEdgeCase: boolean;
  notes: string;
}

// ──────────────────────────────────────────────
// Per-Resume Error
// ──────────────────────────────────────────────

export interface ScreeningError {
  reqId: string;
  fileName: string;
  error: string;
}

// ──────────────────────────────────────────────
// App State
// ──────────────────────────────────────────────

export interface ActivityLogEntry {
  time: string;
  message: string;
  type: "info" | "success" | "error" | "step";
}

export interface ScreeningState {
  status: "upload" | "screening" | "complete" | "error";
  jobFiles: JobFile[];
  resumeFiles: ResumeFile[];
  results: ApplicantResult[];
  errors: ScreeningError[];
  globalErrors: string[];
  progress: number;
  totalToProcess: number;
  currentFile: string;
  currentStep: string;
  activityLog: ActivityLogEntry[];
}
