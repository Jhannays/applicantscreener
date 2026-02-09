export interface ResumeFile {
  name: string;
  content: string;
  size: number;
}

export interface RoleEntry {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ParsedResume {
  fileName: string;
  name: string;
  email: string;
  phone: string;
  summary: string;
  roles: RoleEntry[];
}

export interface RoleEvaluation {
  company: string;
  title: string;
  dateRange: string;
  isRelevant: boolean;
  relevanceReason: string;
}

export interface ApplicantResult {
  fileName: string;
  name: string;
  email: string;
  phone: string;
  summary: string;
  totalYearsExperience: number;
  relevantYearsExperience: number;
  roleEvaluations: RoleEvaluation[];
  overallScore: number;
  verdict: "Strong Match" | "Potential Match" | "Weak Match" | "No Match";
  verdictReason: string;
}

export interface ScreeningState {
  status: "idle" | "uploading" | "screening" | "complete" | "error";
  jobRequirements: string;
  resumeFiles: ResumeFile[];
  results: ApplicantResult[];
  error: string | null;
  progress: number;
  currentResume: string;
}
