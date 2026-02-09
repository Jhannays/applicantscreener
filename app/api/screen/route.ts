import { generateText, Output } from "ai";
import { z } from "zod";
import type {
  JobFile,
  ResumeFile,
  ApplicantResult,
  GapAnalysis,
  GapEntry,
  RoleRelevance,
  ExpectationCheck,
  ParsedResume,
  WorkExperience,
  Education,
} from "@/lib/types";
import {
  parseMonthYear,
  monthsBetweenInclusive,
  monthsToYearsMonths,
  formatMonthYear,
} from "@/lib/date-utils";

// ─── Schemas ──────────────────────────────────────────────

const parsedResumeSchema = z.object({
  candidateName: z.string(),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string(),
      startDate: z.string(),
      endDate: z.string(),
    })
  ),
  skills: z.array(z.string()),
  certifications: z.array(z.string()),
  workExperience: z.array(
    z.object({
      employer: z.string(),
      title: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      bullets: z.array(z.string()),
    })
  ),
});

const roleRelevanceSchema = z.object({
  evaluations: z.array(
    z.object({
      employer: z.string(),
      title: z.string(),
      isRelevant: z.boolean(),
      reason: z.string(),
    })
  ),
});

const expectationsSchema = z.object({
  checks: z.array(
    z.object({
      expectation: z.string(),
      status: z.enum(["Met", "Partially Met", "Not Evident"]),
      evidence: z.string(),
    })
  ),
});

// ─── Text extraction ──────────────────────────────────────

async function extractText(
  content: string,
  fileType: "text" | "pdf" | "docx"
): Promise<string> {
  if (fileType === "text") return content;

  // Decode base64 to Buffer
  const buffer = Buffer.from(content, "base64");

  if (fileType === "pdf") {
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      return data.text;
    } catch (e) {
      throw new Error(
        `PDF parsing failed: ${e instanceof Error ? e.message : "unknown"}`
      );
    }
  }

  if (fileType === "docx") {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (e) {
      throw new Error(
        `DOCX parsing failed: ${e instanceof Error ? e.message : "unknown"}`
      );
    }
  }

  throw new Error(`Unsupported file type: ${fileType}`);
}

// ─── AI: Parse resume ─────────────────────────────────────

async function parseResumeWithAI(
  resumeText: string
): Promise<ParsedResume | null> {
  try {
    const { output } = await generateText({
      model: "openai/gpt-4o-mini",
      output: Output.object({ schema: parsedResumeSchema }),
      prompt: `Parse the following resume and extract structured information.

RULES:
- Normalize all dates to "Month YYYY" format (e.g. "Oct 2023"). Use "Present" for current roles.
- If only a year is given, use "Jan YYYY".
- Deduplicate skills and certifications.
- For work experience, include bullet-point descriptions of responsibilities/achievements.
- If candidate name is not found, use "Unknown Candidate".

RESUME TEXT:
${resumeText}`,
    });
    return output as ParsedResume;
  } catch {
    return null;
  }
}

// ─── AI: Role relevance ───────────────────────────────────

async function evaluateRoleRelevance(
  workExperience: WorkExperience[],
  jobRequirements: string
): Promise<
  { employer: string; title: string; isRelevant: boolean; reason: string }[]
> {
  const rolesDesc = workExperience
    .map(
      (r, i) =>
        `Role ${i + 1}: ${r.title} at ${r.employer} (${r.startDate} – ${r.endDate})\nResponsibilities: ${r.bullets.join("; ")}`
    )
    .join("\n\n");

  try {
    const { output } = await generateText({
      model: "openai/gpt-4o-mini",
      output: Output.object({ schema: roleRelevanceSchema }),
      prompt: `You are an expert HR recruiter. For EACH role below, determine if it is RELEVANT to the job requirements.

A role is relevant ONLY if the work performed directly relates to the skills, domain, or experience the job requires. Be strict:
- If the job asks for healthcare experience, a daycare role is NOT relevant.
- If the job asks for software engineering, a retail role is NOT relevant.

JOB REQUIREMENTS:
${jobRequirements}

CANDIDATE ROLES:
${rolesDesc}

For each role, return isRelevant (true/false) and a brief reason.`,
    });
    return (
      (output as { evaluations: { employer: string; title: string; isRelevant: boolean; reason: string }[] })
        ?.evaluations || []
    );
  } catch {
    return workExperience.map((r) => ({
      employer: r.employer,
      title: r.title,
      isRelevant: false,
      reason: "Evaluation failed",
    }));
  }
}

// ─── AI: Expectations check ───────────────────────────────

async function evaluateExpectations(
  resumeText: string,
  jobRequirements: string
): Promise<ExpectationCheck[]> {
  try {
    const { output } = await generateText({
      model: "openai/gpt-4o-mini",
      output: Output.object({ schema: expectationsSchema }),
      prompt: `You are an expert HR recruiter. Extract the KEY expectations/requirements from the job description, then for EACH, determine whether this resume provides evidence.

JOB REQUIREMENTS:
${jobRequirements}

RESUME TEXT:
${resumeText}

For each expectation:
- "Met" = clear evidence in the resume
- "Partially Met" = some related experience but not a direct match
- "Not Evident" = no evidence found

Include a short evidence snippet from the resume for anything Met or Partially Met. For "Not Evident", leave evidence as empty string.

Return 5-15 key expectations.`,
    });
    return (output as { checks: ExpectationCheck[] })?.checks || [];
  } catch {
    return [];
  }
}

// ─── Gap Analysis ─────────────────────────────────────────

function computeGapAnalysis(workExperience: WorkExperience[]): GapAnalysis {
  if (workExperience.length < 2) {
    return { gaps: [], gapCount: 0, largestGapMonths: 0, totalGapMonths: 0 };
  }

  // Parse and sort by start date
  const parsed = workExperience
    .map((w) => ({
      start: parseMonthYear(w.startDate),
      end: parseMonthYear(w.endDate),
      raw: w,
    }))
    .filter((p) => p.start && p.end) as {
    start: { month: number; year: number };
    end: { month: number; year: number };
    raw: WorkExperience;
  }[];

  parsed.sort((a, b) => {
    const aVal = a.start.year * 12 + a.start.month;
    const bVal = b.start.year * 12 + b.start.month;
    return aVal - bVal;
  });

  const gaps: GapEntry[] = [];

  for (let i = 0; i < parsed.length - 1; i++) {
    const currentEnd = parsed[i].end;
    const nextStart = parsed[i + 1].start;

    // Month after current end
    let gapStartMonth = currentEnd.month + 1;
    let gapStartYear = currentEnd.year;
    if (gapStartMonth > 11) {
      gapStartMonth = 0;
      gapStartYear++;
    }

    // Month before next start
    let gapEndMonth = nextStart.month - 1;
    let gapEndYear = nextStart.year;
    if (gapEndMonth < 0) {
      gapEndMonth = 11;
      gapEndYear--;
    }

    const gapStart = { month: gapStartMonth, year: gapStartYear };
    const gapEnd = { month: gapEndMonth, year: gapEndYear };

    const gapMonths = monthsBetweenInclusive(gapStart, gapEnd);

    if (gapMonths > 0) {
      gaps.push({
        from: formatMonthYear(gapStart),
        to: formatMonthYear(gapEnd),
        months: gapMonths,
      });
    }
  }

  const totalGapMonths = gaps.reduce((sum, g) => sum + g.months, 0);
  const largestGapMonths = gaps.length > 0 ? Math.max(...gaps.map((g) => g.months)) : 0;

  return {
    gaps,
    gapCount: gaps.length,
    largestGapMonths,
    totalGapMonths,
  };
}

// ─── Experience calculation ───────────────────────────────

function computeExperience(
  workExperience: WorkExperience[],
  relevanceResults: { employer: string; title: string; isRelevant: boolean; reason: string }[]
): {
  roleRelevance: RoleRelevance[];
  totalYears: number;
  totalMonths: number;
  relevantYears: number;
  relevantMonths: number;
} {
  let totalMonthsCount = 0;
  let relevantMonthsCount = 0;
  const roleRelevance: RoleRelevance[] = [];

  for (const role of workExperience) {
    const start = parseMonthYear(role.startDate);
    const end = parseMonthYear(role.endDate);
    const duration = start && end ? monthsBetweenInclusive(start, end) : 0;

    const relevance = relevanceResults.find(
      (r) => r.employer === role.employer && r.title === role.title
    );
    const isRelevant = relevance?.isRelevant ?? false;

    totalMonthsCount += duration;
    if (isRelevant) relevantMonthsCount += duration;

    roleRelevance.push({
      employer: role.employer,
      title: role.title,
      startDate: role.startDate,
      endDate: role.endDate,
      isRelevant,
      reason: relevance?.reason || "Not evaluated",
      durationMonths: duration,
    });
  }

  const total = monthsToYearsMonths(totalMonthsCount);
  const relevant = monthsToYearsMonths(relevantMonthsCount);

  return {
    roleRelevance,
    totalYears: total.years,
    totalMonths: total.months,
    relevantYears: relevant.years,
    relevantMonths: relevant.months,
  };
}

// ─── Overall match ────────────────────────────────────────

function computeOverallMatch(
  expectations: ExpectationCheck[],
  relevantMonthsTotal: number
): { match: "Strong" | "Medium" | "Weak"; metCount: number; missingCount: number } {
  const metCount = expectations.filter((e) => e.status === "Met").length;
  const partialCount = expectations.filter((e) => e.status === "Partially Met").length;
  const missingCount = expectations.filter((e) => e.status === "Not Evident").length;
  const total = expectations.length || 1;
  const score = (metCount + partialCount * 0.5) / total;

  let match: "Strong" | "Medium" | "Weak";
  if (score >= 0.7 && relevantMonthsTotal >= 12) {
    match = "Strong";
  } else if (score >= 0.4) {
    match = "Medium";
  } else {
    match = "Weak";
  }

  return { match, metCount, missingCount };
}

// ─── POST handler ─────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { jobFiles, resumeFiles } = (await req.json()) as {
      jobFiles: JobFile[];
      resumeFiles: ResumeFile[];
    };

    if (!jobFiles?.length || !resumeFiles?.length) {
      return Response.json(
        { error: "Both job requirement files and resume files are required." },
        { status: 400 }
      );
    }

    // Build req ID -> job content map
    const jobMap = new Map<string, string>();
    for (const jf of jobFiles) {
      jobMap.set(jf.reqId, jf.content);
    }

    // Group resumes by req ID
    const resumesByReq = new Map<string, ResumeFile[]>();
    for (const rf of resumeFiles) {
      if (!resumesByReq.has(rf.reqId)) resumesByReq.set(rf.reqId, []);
      resumesByReq.get(rf.reqId)!.push(rf);
    }

    const encoder = new TextEncoder();
    let totalCount = 0;
    const matchedPairs: { reqId: string; jobContent: string; resume: ResumeFile }[] = [];
    const skippedErrors: string[] = [];

    for (const [reqId, resumes] of resumesByReq) {
      const jobContent = jobMap.get(reqId);
      if (!jobContent) {
        skippedErrors.push(
          `Skipped REQ ${reqId}: no matching job requirements file found`
        );
        continue;
      }
      for (const resume of resumes) {
        matchedPairs.push({ reqId, jobContent, resume });
      }
    }

    totalCount = matchedPairs.length;

    const stream = new ReadableStream({
      async start(controller) {
        // Send initial info
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "info",
              totalToProcess: totalCount,
              skippedErrors,
            }) + "\n"
          )
        );

        let processed = 0;

        for (const { reqId, jobContent, resume } of matchedPairs) {
          processed++;

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "progress",
                current: processed,
                total: totalCount,
                fileName: resume.fileName,
                reqId,
              }) + "\n"
            )
          );

          try {
            // 1. Extract text from file
            const resumeText = await extractText(
              resume.content,
              resume.fileType
            );

            if (!resumeText || resumeText.trim().length < 20) {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "error",
                    fileName: resume.fileName,
                    reqId,
                    error: "Could not extract meaningful text from file",
                  }) + "\n"
                )
              );
              continue;
            }

            // 2. Parse resume with AI
            const parsed = await parseResumeWithAI(resumeText);
            if (!parsed) {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "error",
                    fileName: resume.fileName,
                    reqId,
                    error: "AI failed to parse resume",
                  }) + "\n"
                )
              );
              continue;
            }

            // 3. Evaluate role relevance
            const relevanceResults = await evaluateRoleRelevance(
              parsed.workExperience,
              jobContent
            );

            // 4. Compute experience
            const experience = computeExperience(
              parsed.workExperience,
              relevanceResults
            );

            // 5. Gap analysis
            const gapAnalysis = computeGapAnalysis(parsed.workExperience);

            // 6. Job expects vs resume shows
            const expectations = await evaluateExpectations(
              resumeText,
              jobContent
            );

            // 7. Overall match
            const totalRelevantMonths =
              experience.relevantYears * 12 + experience.relevantMonths;
            const { match, metCount, missingCount } = computeOverallMatch(
              expectations,
              totalRelevantMonths
            );

            const result: ApplicantResult = {
              reqId,
              resumeFile: resume.fileName,
              candidateName: parsed.candidateName || "Unknown Candidate",
              education: parsed.education,
              skills: [...new Set(parsed.skills)], // dedupe
              certifications: [...new Set(parsed.certifications)], // dedupe
              workExperience: parsed.workExperience,
              gapAnalysis,
              roleRelevance: experience.roleRelevance,
              relevantYears: experience.relevantYears,
              relevantMonths: experience.relevantMonths,
              totalYears: experience.totalYears,
              totalMonths: experience.totalMonths,
              expectations,
              keyRequirementsMetCount: metCount,
              keyRequirementsMissingCount: missingCount,
              overallMatch: match,
              notes: `Processed ${parsed.workExperience.length} roles. ${gapAnalysis.gapCount} gap(s) detected.`,
            };

            controller.enqueue(
              encoder.encode(
                JSON.stringify({ type: "result", data: result }) + "\n"
              )
            );
          } catch (err) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "error",
                  fileName: resume.fileName,
                  reqId,
                  error:
                    err instanceof Error ? err.message : "Unknown error",
                }) + "\n"
              )
            );
          }
        }

        controller.enqueue(
          encoder.encode(JSON.stringify({ type: "done" }) + "\n")
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error ? err.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
