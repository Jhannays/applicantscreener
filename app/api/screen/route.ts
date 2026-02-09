import { generateText, Output } from "ai";
import { z } from "zod";
import type { ApplicantResult, ResumeFile } from "@/lib/types";

const resumeSchema = z.object({
  name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  summary: z.string(),
  roles: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      description: z.string(),
    })
  ),
});

const evaluationSchema = z.object({
  totalYearsExperience: z.number(),
  relevantYearsExperience: z.number(),
  roleEvaluations: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      dateRange: z.string(),
      isRelevant: z.boolean(),
      relevanceReason: z.string(),
    })
  ),
  overallScore: z.number(),
  verdict: z.enum(["Strong Match", "Potential Match", "Weak Match", "No Match"]),
  verdictReason: z.string(),
});

async function parseResume(resumeContent: string) {
  const { output } = await generateText({
    model: "openai/gpt-4o-mini",
    output: Output.object({ schema: resumeSchema }),
    prompt: `Parse the following resume and extract structured information. Extract the person's name, email, phone, a brief professional summary, and all their work roles (company, title, start date, end date, description).

If a field is not found, use null for optional fields or "Unknown" for required fields. For dates, use formats like "Jan 2020" or "2020" if only the year is available. Use "Present" for current roles.

Resume:
${resumeContent}`,
  });

  return output;
}

async function evaluateResume(
  parsedResume: z.infer<typeof resumeSchema>,
  jobRequirements: string
) {
  const rolesDescription = parsedResume.roles
    .map(
      (r) =>
        `- ${r.title} at ${r.company} (${r.startDate} - ${r.endDate}): ${r.description}`
    )
    .join("\n");

  const { output } = await generateText({
    model: "openai/gpt-4o-mini",
    output: Output.object({ schema: evaluationSchema }),
    prompt: `You are an expert HR recruiter. Evaluate this candidate against the job requirements.

JOB REQUIREMENTS:
${jobRequirements}

CANDIDATE PROFILE:
Name: ${parsedResume.name}
Summary: ${parsedResume.summary}

WORK HISTORY:
${rolesDescription}

Instructions:
1. Calculate total years of experience across all roles
2. For each role, determine if it is relevant to the job requirements and explain why
3. Calculate relevant years of experience (only counting relevant roles)
4. Give an overall score from 0-100 based on how well the candidate matches
5. Provide a verdict: "Strong Match" (score 75-100), "Potential Match" (50-74), "Weak Match" (25-49), or "No Match" (0-24)
6. Explain the verdict in 1-2 sentences

Be fair, thorough, and consistent in your evaluations.`,
  });

  return output;
}

export async function POST(req: Request) {
  try {
    const { jobRequirements, resumes } = (await req.json()) as {
      jobRequirements: string;
      resumes: ResumeFile[];
    };

    if (!jobRequirements || !resumes || resumes.length === 0) {
      return Response.json(
        { error: "Job requirements and at least one resume are required." },
        { status: 400 }
      );
    }

    const results: ApplicantResult[] = [];

    // Use a streaming approach: send results one at a time using NDJSON
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for (let i = 0; i < resumes.length; i++) {
          const resume = resumes[i];

          // Send progress update
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "progress",
                current: i + 1,
                total: resumes.length,
                fileName: resume.name,
              }) + "\n"
            )
          );

          try {
            // Step 1: Parse the resume
            const parsed = await parseResume(resume.content);

            if (!parsed) {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "error",
                    fileName: resume.name,
                    error: "Failed to parse resume",
                  }) + "\n"
                )
              );
              continue;
            }

            // Step 2: Evaluate against job requirements
            const evaluation = await evaluateResume(parsed, jobRequirements);

            if (!evaluation) {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "error",
                    fileName: resume.name,
                    error: "Failed to evaluate resume",
                  }) + "\n"
                )
              );
              continue;
            }

            const result: ApplicantResult = {
              fileName: resume.name,
              name: parsed.name || "Unknown",
              email: parsed.email || "",
              phone: parsed.phone || "",
              summary: parsed.summary,
              totalYearsExperience: evaluation.totalYearsExperience,
              relevantYearsExperience: evaluation.relevantYearsExperience,
              roleEvaluations: evaluation.roleEvaluations,
              overallScore: evaluation.overallScore,
              verdict: evaluation.verdict,
              verdictReason: evaluation.verdictReason,
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
                  fileName: resume.name,
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
