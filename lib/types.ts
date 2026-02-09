// ──────────────────────────────────────────────
// Upload / Input Types
// ──────────────────────────────────────────────

/** A single uploaded file (job req or resume) with raw bytes */
export interface UploadedFile {
  name: string;
  /** base64-encoded content for binary files, or plain text */
  content: string;
  size: number;
  type: "text" | "pdf" | "docx";
}

/** A job-requirements file keyed by requisition id */
export interface JobFile {
  reqId: string;
  fileName: string;
  content: string; // plain text of the job requirements
}

/** A resume grouped under a requisition */
export interface ResumeFile {
  reqId: string;
  fileName: string;
  content: string; // base64 for binary, plain text for .txt/.md
  fileType: "text" | "pdf" | "docx";
  size: number;
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
  /** true when some non-relevant roles exist (total exp > relevant exp) */
  nonRelevantExperienceCounted: boolean;
  /** true when an ambiguity is detected: gaps, mixed relevance, low evidence, etc. */
  isEdgeCase: boolean;
  notes: string;
}

// ──────────────────────────────────────────────
// App State
// ──────────────────────────────────────────────

export interface ScreeningState {
  status: "upload" | "screening" | "complete" | "error";
  jobFiles: JobFile[];
  resumeFiles: ResumeFile[];
  results: ApplicantResult[];
  errors: string[];
  progress: number;
  totalToProcess: number;
  currentFile: string;
}
