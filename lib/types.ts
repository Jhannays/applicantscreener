// ──────────────────────────────────────────────
// Requisition CSV Row (structured import)
// ──────────────────────────────────────────────

/** One row from a Workday/HRIS requisition CSV export. Blank = no posted requirement. */
export interface RequisitionCSVRow {
  requisitionNumber: string;
  preferredYearsExperience?: string;
  minYearsExperience?: string;
  jobQualifications?: string;
  certificationsPreferred?: string;
  certificationsRequired?: string;
  degreeTypePreferred?: string;
  experienceDataverse?: string;
  experienceNeeded?: string;
  reqIdentifier?: string;
  qualifications?: string;
  preferredCertifications?: string;
  certificationNeeded?: string;
  educationNeeded?: string;
}

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
  /** true when a human reviewer has overridden the AI's relevance determination */
  manualOverride?: boolean;
}

// ──────────────────────────────────────────────
// Job Expects vs Resume Shows
// ──────────────────────────────────────────────

export interface ExpectationCheck {
  expectation: string;
  /** Whether this requirement is a minimum (must-have) or preferred (nice-to-have) */
  category: "minimum" | "preferred";
  /** When the requirement must be fulfilled */
  timing: "upon_hire" | "after_hire" | "unspecified";
  status: "Met" | "Partially Met" | "Not Evident";
  evidence: string;
  /** true when a human reviewer has overridden the AI's status determination */
  manualOverride?: boolean;
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
  /** Transparent explanation of the overall screening logic and decision */
  screeningRationale: string;
  /** true when some non-relevant roles exist (total exp > relevant exp) */
  nonRelevantExperienceCounted: boolean;
  /** true when an ambiguity is detected: gaps, mixed relevance, low evidence, etc. */
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
// SME Notes (human-in-the-loop relevancy logic)
// ──────────────────────────────────────────────

/** A note attached to a specific role's relevance determination */
export interface RoleNote {
  /** Composite key: `${reqId}::${roleIndex}` */
  roleKey: string;
  note: string;
  createdAt: string;
}

/** A session-level SME conversation entry */
export interface SMESessionNote {
  id: string;
  note: string;
  createdAt: string;
}

/** A saved SME session that can be recalled later */
export interface SMESession {
  id: string;
  name: string;
  createdAt: string;
  sessionNotes: SMESessionNote[];
  roleNotes: RoleNote[];
  correctionRules: CorrectionRule[];
}

// ──────────────────────────────────────────────
// Correction Rules (human-in-the-loop learning)
// ──────────────────────────────────────────────

export interface CorrectionRule {
  /** Which type of override this was */
  type: "relevance" | "expectation";
  /** The requisition this correction applies to */
  reqId: string;
  /** What the AI originally determined */
  original: string;
  /** What the human corrected it to */
  corrected: string;
  /** AI-generated explanation of the mistake and the correct interpretation */
  lesson: string;
  /** Timestamp */
  createdAt: string;
}

// ────────────────���─────────────────────────────
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
  /** Optional structured requisition data from CSV upload */
  requisitionCSV: RequisitionCSVRow[];
  results: ApplicantResult[];
  errors: ScreeningError[];
  globalErrors: string[];
  progress: number;
  totalToProcess: number;
  currentFile: string;
  currentStep: string;
  activityLog: ActivityLogEntry[];
  /** Accumulated correction rules from human overrides -- fed back into AI prompts */
  correctionRules: CorrectionRule[];
  /** Per-role SME notes on relevance logic */
  roleNotes: RoleNote[];
  /** Global SME session conversation notes */
  smeSessionNotes: SMESessionNote[];
}
