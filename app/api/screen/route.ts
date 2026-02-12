export const maxDuration = 300; // 5 minutes for large batches

import { generateText, Output } from "ai";
import { z } from "zod";
import type {
  ApplicantResult,
  GapAnalysis,
  GapEntry,
  RoleRelevance,
  ExpectationCheck,
  ParsedResume,
  WorkExperience,
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
      category: z.enum(["minimum", "preferred"]),
      status: z.enum(["Met", "Partially Met", "Not Evident"]),
      evidence: z.string(),
    })
  ),
});

// ─── Text extraction ──────────────────────────────────────

async function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".txt") || lower.endsWith(".md")) {
    return buffer.toString("utf-8");
  }

  if (lower.endsWith(".pdf")) {
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

  if (lower.endsWith(".docx") || lower.endsWith(".doc")) {
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

  throw new Error(`Unsupported file type: ${fileName}`);
}

// ─── AI: Parse resume ─────────────────────────────────────

async function parseResumeWithAI(resumeText: string): Promise<ParsedResume> {
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
  if (!output) {
    throw new Error("AI returned empty output when parsing resume");
  }
  return output as ParsedResume;
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
        `Role ${i + 1}: ${r.title} at ${r.employer} (${r.startDate} - ${r.endDate})\nResponsibilities: ${r.bullets.join("; ")}`
    )
    .join("\n\n");

  const { output } = await generateText({
    model: "openai/gpt-4o-mini",
    output: Output.object({ schema: roleRelevanceSchema }),
    prompt: `You are an expert HR recruiter performing a transparent, auditable relevance evaluation. For EACH role below, determine if it is RELEVANT to what the job posting EXPLICITLY requires.

CRITICAL: Only compare against requirements that are EXPLICITLY STATED in the job posting. Do NOT infer or assume requirements that are not written.

A role is relevant ONLY if the work performed directly relates to skills, domain, or experience EXPLICITLY listed in the job posting.

STRICT RULES:
- If the job posting asks for healthcare/nursing experience, a daycare or food-service role is NOT relevant.
- If the job posting asks for software engineering, a retail role is NOT relevant.
- Generic administrative or supervisory experience is NOT relevant unless the job posting explicitly asks for it.
- "Relevant" means the daily duties align with what the job posting explicitly describes.
- Do NOT reward or penalize based on inferred requirements -- only what the posting states.

JOB REQUIREMENTS:
${jobRequirements}

CANDIDATE ROLES:
${rolesDesc}

For each role you MUST return:
- isRelevant: true or false
- reason: A DETAILED explanation (2-4 sentences) that:
  1. Names the specific job requirement(s) the role does or does not match
  2. References specific duties or bullets from the role
  3. Explains the connection or mismatch clearly
  Example GOOD reason: "This role involved direct patient care including medication administration and vitals monitoring, which aligns with the RN clinical experience requirement. The charge nurse duties also satisfy the leadership expectation."
  Example GOOD reason: "While this role involved working with children, the duties (lesson planning, classroom management) do not align with the clinical nursing, patient assessment, or medical documentation requirements of this position."`,
  });
  return (
    (
      output as {
        evaluations: {
          employer: string;
          title: string;
          isRelevant: boolean;
          reason: string;
        }[];
      }
    )?.evaluations || []
  );
}

// ─── AI: Expectations check ───────────────────────────────

async function evaluateExpectations(
  resumeText: string,
  jobRequirements: string
): Promise<ExpectationCheck[]> {
  const { output } = await generateText({
    model: "openai/gpt-4o-mini",
    output: Output.object({ schema: expectationsSchema }),
    prompt: `You are an expert HR recruiter performing a transparent, auditable evaluation.

CRITICAL RULES:
1. ONLY evaluate against requirements that are EXPLICITLY STATED in the job posting below. Do NOT infer, assume, or add requirements that are not written in the posting.
2. Classify each requirement as either "minimum" or "preferred":
   - "minimum" = the posting says "required", "must have", "minimum", "mandatory", or lists it as a basic qualification
   - "preferred" = the posting says "preferred", "desired", "nice to have", "plus", "ideally", or lists it under preferred qualifications
   - If the posting does not clearly distinguish, treat it as "minimum" by default.
3. A candidate must NOT be penalized for missing a "preferred" requirement. Only "minimum" requirements affect the core evaluation.

JOB REQUIREMENTS (posted text):
${jobRequirements}

RESUME TEXT:
${resumeText}

For each requirement found in the job posting:
- "Met" = clear, direct evidence in the resume
- "Partially Met" = some related evidence but not a full match (explain what is present AND what is missing)
- "Not Evident" = no evidence found in the resume

IMPORTANT:
- For "Met": Quote or closely paraphrase the specific resume text that satisfies it.
- For "Partially Met": Describe what the resume shows AND what gap remains.
- For "Not Evident": Leave evidence as empty string.
- Do NOT fabricate requirements. Every expectation you return must be traceable to specific text in the job posting.

Return all requirements found in the posting (typically 8-20).`,
  });
  return (output as { checks: ExpectationCheck[] })?.checks || [];
}

// ─── Gap Analysis ─────────────────────────────────────────

function computeGapAnalysis(workExperience: WorkExperience[]): GapAnalysis {
  if (workExperience.length < 2) {
    return { gaps: [], gapCount: 0, largestGapMonths: 0, totalGapMonths: 0 };
  }

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

    let gapStartMonth = currentEnd.month + 1;
    let gapStartYear = currentEnd.year;
    if (gapStartMonth > 11) {
      gapStartMonth = 0;
      gapStartYear++;
    }

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
  const largestGapMonths =
    gaps.length > 0 ? Math.max(...gaps.map((g) => g.months)) : 0;

  return { gaps, gapCount: gaps.length, largestGapMonths, totalGapMonths };
}

// ─── Experience calculation ───────────────────────────────

function computeExperience(
  workExperience: WorkExperience[],
  relevanceResults: {
    employer: string;
    title: string;
    isRelevant: boolean;
    reason: string;
  }[]
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
): {
  match: "Strong" | "Medium" | "Weak";
  metCount: number;
  missingCount: number;
  minimumScore: number;
  preferredScore: number;
} {
  // Split into minimum vs preferred
  const minimumReqs = expectations.filter((e) => e.category === "minimum");
  const preferredReqs = expectations.filter((e) => e.category === "preferred");

  // Score minimum requirements (these determine the match)
  const minMet = minimumReqs.filter((e) => e.status === "Met").length;
  const minPartial = minimumReqs.filter((e) => e.status === "Partially Met").length;
  const minTotal = minimumReqs.length || 1;
  const minimumScore = (minMet + minPartial * 0.5) / minTotal;

  // Score preferred requirements (bonus only, cannot hurt)
  const prefMet = preferredReqs.filter((e) => e.status === "Met").length;
  const prefPartial = preferredReqs.filter((e) => e.status === "Partially Met").length;
  const prefTotal = preferredReqs.length || 1;
  const preferredScore = preferredReqs.length > 0
    ? (prefMet + prefPartial * 0.5) / prefTotal
    : 0;

  // Overall counts (across all requirements for display)
  const metCount = expectations.filter((e) => e.status === "Met").length;
  const missingCount = expectations.filter((e) => e.status === "Not Evident").length;

  // Match is determined ONLY by minimum requirements + relevant experience
  let match: "Strong" | "Medium" | "Weak";
  if (minimumScore >= 0.7 && relevantMonthsTotal >= 12) {
    match = "Strong";
  } else if (minimumScore >= 0.4) {
    match = "Medium";
  } else {
    match = "Weak";
  }

  return { match, metCount, missingCount, minimumScore, preferredScore };
}

// ─── POST handler ─────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // Parse the manifest which describes file -> reqId mappings
    const manifestStr = formData.get("manifest") as string;
    if (!manifestStr) {
      return Response.json(
        { error: "Missing upload manifest." },
        { status: 400 }
      );
    }

    const manifest = JSON.parse(manifestStr) as {
      jobs: { fieldName: string; reqId: string; fileName: string }[];
      resumes: {
        fieldName: string;
        reqId: string;
        fileName: string;
      }[];
    };

    if (!manifest.jobs?.length || !manifest.resumes?.length) {
      return Response.json(
        { error: "Both job requirement files and resume files are required." },
        { status: 400 }
      );
    }

    // Read job files into a map
    const jobMap = new Map<string, string>();
    for (const job of manifest.jobs) {
      const file = formData.get(job.fieldName) as File | null;
      if (!file) continue;
      const text = await file.text();
      jobMap.set(job.reqId, text);
    }

    // Collect matched pairs
    const matchedPairs: {
      reqId: string;
      jobContent: string;
      fileName: string;
      file: File;
    }[] = [];
    const skippedErrors: string[] = [];

    for (const resume of manifest.resumes) {
      const jobContent = jobMap.get(resume.reqId);
      if (!jobContent) {
        skippedErrors.push(
          `Skipped REQ ${resume.reqId}: no matching job requirements file found`
        );
        continue;
      }
      const file = formData.get(resume.fieldName) as File | null;
      if (!file) continue;
      matchedPairs.push({
        reqId: resume.reqId,
        jobContent,
        fileName: resume.fileName,
        file,
      });
    }

    const totalCount = matchedPairs.length;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
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
        const BATCH_SIZE = 3; // Process 3 resumes concurrently

        // Helper to send a message
        const send = (msg: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(JSON.stringify(msg) + "\n"));
        };

        // Process a single resume
        async function processOne(item: {
          reqId: string;
          jobContent: string;
          fileName: string;
          file: File;
        }) {
          const { reqId, jobContent, fileName, file } = item;

          // Each resume has 3 sub-steps for smoother progress
          const baseIndex = matchedPairs.indexOf(item);
          const sendSubProgress = (subStep: number) => {
            // subStep: 0 = extracting, 1 = parsing, 2 = evaluating
            send({
              type: "sub-progress",
              current: baseIndex,
              subStep,
              subStepTotal: 3,
              total: totalCount,
              fileName,
              reqId,
            });
          };

          send({
            type: "step",
            fileName,
            reqId,
            step: "extracting",
            message: `Extracting text from ${fileName}`,
          });
          sendSubProgress(0);

          try {
            // 1. Extract text
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const resumeText = await extractTextFromBuffer(buffer, fileName);

            if (!resumeText || resumeText.trim().length < 20) {
              send({
                type: "error",
                fileName,
                reqId,
                error: "Could not extract meaningful text from file",
              });
              return;
            }

            // 2. Parse resume with AI
            send({
              type: "step",
              fileName,
              reqId,
              step: "parsing",
              message: `AI is parsing resume structure for ${fileName}`,
            });
            sendSubProgress(1);
            const parsed = await parseResumeWithAI(resumeText);

            // 3. Run role relevance + expectations IN PARALLEL
            send({
              type: "step",
              fileName,
              reqId,
              step: "evaluating",
              message: `Evaluating relevance & expectations for ${parsed.candidateName || fileName}`,
            });
            sendSubProgress(2);

            const [relevanceResults, expectations] = await Promise.all([
              evaluateRoleRelevance(parsed.workExperience, jobContent),
              evaluateExpectations(resumeText, jobContent),
            ]);

            // 4. Compute experience (deterministic, instant)
            const experience = computeExperience(
              parsed.workExperience,
              relevanceResults
            );

            // 5. Gap analysis (deterministic, instant)
            const gapAnalysis = computeGapAnalysis(parsed.workExperience);

            // 6. Overall match
            const totalRelevantMonths =
              experience.relevantYears * 12 + experience.relevantMonths;
            const { match, metCount, missingCount, minimumScore, preferredScore } = computeOverallMatch(
              expectations,
              totalRelevantMonths
            );

            // 7. Compute flags
            const totalExpMonths =
              experience.totalYears * 12 + experience.totalMonths;
            const nonRelevantExperienceCounted =
              totalExpMonths > totalRelevantMonths;

            const hasGaps = gapAnalysis.gapCount > 0;
            const hasMixedRelevance =
              experience.roleRelevance.some((r) => r.isRelevant) &&
              experience.roleRelevance.some((r) => !r.isRelevant);
            const lowEvidenceRatio =
              expectations.length > 0 && metCount / expectations.length < 0.5;
            const veryShortRelevant = totalRelevantMonths < 6;
            const isEdgeCase =
              (hasGaps && hasMixedRelevance) ||
              (hasGaps && lowEvidenceRatio) ||
              veryShortRelevant;

            // 8b. Build transparent screening rationale
            const relevantRoles = experience.roleRelevance.filter((r) => r.isRelevant);
            const nonRelevantRoles = experience.roleRelevance.filter((r) => !r.isRelevant);

            const minimumReqs = expectations.filter((e) => e.category === "minimum");
            const preferredReqs = expectations.filter((e) => e.category === "preferred");
            const minMet = minimumReqs.filter((e) => e.status === "Met").length;
            const minPartial = minimumReqs.filter((e) => e.status === "Partially Met").length;
            const minNotEvident = minimumReqs.filter((e) => e.status === "Not Evident").length;
            const prefMet = preferredReqs.filter((e) => e.status === "Met").length;
            const prefPartial = preferredReqs.filter((e) => e.status === "Partially Met").length;
            const prefNotEvident = preferredReqs.filter((e) => e.status === "Not Evident").length;

            let rationale = `SCREENING LOGIC FOR ${(parsed.candidateName || "Unknown Candidate").toUpperCase()} (REQ ${reqId})\n\n`;

            rationale += `1. EXPERIENCE ANALYSIS\n`;
            rationale += `   Total work history: ${experience.totalYears} years ${experience.totalMonths} months across ${parsed.workExperience.length} role(s).\n`;
            rationale += `   Relevant experience: ${experience.relevantYears} years ${experience.relevantMonths} months (${relevantRoles.length} of ${parsed.workExperience.length} roles deemed relevant).\n\n`;

            if (relevantRoles.length > 0) {
              rationale += `   RELEVANT ROLES (counted toward experience):\n`;
              for (const r of relevantRoles) {
                const yrs = Math.floor(r.durationMonths / 12);
                const mos = r.durationMonths % 12;
                rationale += `   - ${r.title} at ${r.employer} (${r.startDate}-${r.endDate}, ${yrs}y ${mos}m)\n`;
                rationale += `     Why relevant: ${r.reason}\n`;
              }
              rationale += `\n`;
            }

            if (nonRelevantRoles.length > 0) {
              rationale += `   NON-RELEVANT ROLES (excluded from relevant experience count):\n`;
              for (const r of nonRelevantRoles) {
                const yrs = Math.floor(r.durationMonths / 12);
                const mos = r.durationMonths % 12;
                rationale += `   - ${r.title} at ${r.employer} (${r.startDate}-${r.endDate}, ${yrs}y ${mos}m)\n`;
                rationale += `     Why excluded: ${r.reason}\n`;
              }
              rationale += `\n`;
            }

            rationale += `2. MINIMUM REQUIREMENTS (from job posting -- these determine the score)\n`;
            rationale += `   ${minimumReqs.length} minimum requirement(s) found in posting.\n`;
            rationale += `   Met: ${minMet} | Partially Met: ${minPartial} | Not Evident: ${minNotEvident}\n`;
            rationale += `   Minimum requirements score: ${(minimumScore * 100).toFixed(0)}%\n`;
            for (const e of minimumReqs) {
              const icon = e.status === "Met" ? "[MET]" : e.status === "Partially Met" ? "[PARTIAL]" : "[MISSING]";
              rationale += `   ${icon} ${e.expectation}\n`;
              if (e.evidence) rationale += `         Evidence: ${e.evidence}\n`;
            }
            rationale += `\n`;

            if (preferredReqs.length > 0) {
              rationale += `3. PREFERRED REQUIREMENTS (bonus only -- cannot lower score)\n`;
              rationale += `   ${preferredReqs.length} preferred requirement(s) found in posting.\n`;
              rationale += `   Met: ${prefMet} | Partially Met: ${prefPartial} | Not Evident: ${prefNotEvident}\n`;
              rationale += `   Preferred score: ${(preferredScore * 100).toFixed(0)}% (informational only)\n`;
              for (const e of preferredReqs) {
                const icon = e.status === "Met" ? "[MET]" : e.status === "Partially Met" ? "[PARTIAL]" : "[N/A]";
                rationale += `   ${icon} ${e.expectation}\n`;
                if (e.evidence) rationale += `         Evidence: ${e.evidence}\n`;
              }
              rationale += `\n`;
            }

            rationale += `${preferredReqs.length > 0 ? "4" : "3"}. GAP ANALYSIS\n`;
            if (gapAnalysis.gapCount === 0) {
              rationale += `   No employment gaps detected in work history.\n\n`;
            } else {
              rationale += `   ${gapAnalysis.gapCount} gap(s) detected totaling ${gapAnalysis.totalGapMonths} months (largest: ${gapAnalysis.largestGapMonths} months).\n\n`;
            }

            const sectionNum = preferredReqs.length > 0 ? 5 : 4;
            rationale += `${sectionNum}. OVERALL MATCH: ${match}\n`;
            rationale += `   Scoring method: (Minimum_Met + Minimum_Partial*0.5) / Total_Minimum_Reqs = ${(minimumScore * 100).toFixed(0)}%\n`;
            rationale += `   NOTE: Preferred requirements do NOT count against the candidate.\n`;
            if (match === "Strong") {
              rationale += `   Minimum score >= 70% AND relevant experience >= 12 months.\n`;
            } else if (match === "Medium") {
              rationale += `   Minimum score >= 40% but ${totalRelevantMonths < 12 ? "relevant experience < 12 months" : "minimum score < 70%"}.\n`;
            } else {
              rationale += `   Minimum score < 40%, indicating limited evidence of meeting minimum job requirements.\n`;
            }

            if (isEdgeCase) {
              rationale += `\n${sectionNum + 1}. EDGE CASE FLAG: YES\n`;
              const reasons: string[] = [];
              if (hasGaps && hasMixedRelevance) reasons.push("employment gaps combined with mixed role relevance");
              if (hasGaps && lowEvidenceRatio) reasons.push("employment gaps combined with low evidence ratio");
              if (veryShortRelevant) reasons.push("less than 6 months of relevant experience");
              rationale += `   Reason: ${reasons.join("; ")}. Manual review recommended.\n`;
            }

            const result: ApplicantResult = {
              reqId,
              resumeFile: fileName,
              candidateName: parsed.candidateName || "Unknown Candidate",
              education: parsed.education,
              skills: [...new Set(parsed.skills)],
              certifications: [...new Set(parsed.certifications)],
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
              screeningRationale: rationale,
              nonRelevantExperienceCounted,
              isEdgeCase,
              notes: `Processed ${parsed.workExperience.length} roles. ${gapAnalysis.gapCount} gap(s) detected.`,
            };

            send({ type: "result", data: result });
          } catch (err) {
            let errorMessage = "Unknown error";
            if (err instanceof Error) {
              errorMessage = err.message;
              if (err.cause && err.cause instanceof Error) {
                errorMessage += `: ${err.cause.message}`;
              }
            }
            send({ type: "error", fileName, reqId, error: errorMessage });
          } finally {
            processed++;
            send({
              type: "progress",
              current: processed,
              total: totalCount,
              fileName,
              reqId,
            });
          }
        }

        // Process in batches of BATCH_SIZE
        for (let i = 0; i < matchedPairs.length; i += BATCH_SIZE) {
          const batch = matchedPairs.slice(i, i + BATCH_SIZE);
          await Promise.all(batch.map(processOne));
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
