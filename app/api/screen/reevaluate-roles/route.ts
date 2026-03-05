import { generateText, Output } from "ai";
import { z } from "zod";
import type { WorkExperience, RoleRelevance } from "@/lib/types";

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roles, jobRequirements, correctionRules } = body as {
      roles: WorkExperience[];
      jobRequirements: string;
      correctionRules?: string;
    };

    if (!roles || roles.length === 0) {
      return Response.json(
        { error: "No roles provided for re-evaluation" },
        { status: 400 }
      );
    }

    const rolesDesc = roles
      .map(
        (r, i) =>
          `${i + 1}. ${r.employer} | ${r.title} | ${r.startDate} – ${r.endDate}\n   Duties: ${r.duties || "Not specified"}`
      )
      .join("\n");

    const correctionSection = correctionRules
      ? `\nCORRECTION RULES (prioritize these learnings from previous overrides):\n${correctionRules}\n`
      : "";

    const { output } = await generateText({
      model: "openai/gpt-4o-mini",
      output: Output.object({ schema: roleRelevanceSchema }),
      prompt: `You are an expert HR recruiter. Evaluate whether each of the following work experience roles is RELEVANT to the job requirements.

IMPORTANT:
- A role is "Relevant" if the daily duties align with what the job posting explicitly describes.
- Do NOT reward or penalize based on inferred requirements -- only what the posting states.
- You MUST evaluate EVERY role listed below. Do not skip any roles.
${correctionSection}
JOB REQUIREMENTS:
${jobRequirements}

ROLES TO EVALUATE:
${rolesDesc}

For each role, determine:
- "isRelevant": true if the role experience is relevant to the job requirements
- "reason": A concise explanation of why the role is or is not relevant

CRITICAL: Return exactly ${roles.length} evaluations, one for each role listed above. Do not omit any roles.`,
    });

    const evaluations =
      (output as { evaluations: Array<{ employer: string; title: string; isRelevant: boolean; reason: string }> })
        ?.evaluations || [];

    // Map evaluations back to role relevance format
    const results: Partial<RoleRelevance>[] = roles.map((role) => {
      const evaluation = evaluations.find(
        (e) =>
          e.employer === role.employer && e.title === role.title
      ) || evaluations.find(
        (e) =>
          e.employer.toLowerCase().includes(role.employer.toLowerCase()) ||
          role.employer.toLowerCase().includes(e.employer.toLowerCase()) ||
          e.title.toLowerCase().includes(role.title.toLowerCase()) ||
          role.title.toLowerCase().includes(e.title.toLowerCase())
      );

      return {
        employer: role.employer,
        title: role.title,
        startDate: role.startDate,
        endDate: role.endDate,
        isRelevant: evaluation?.isRelevant ?? false,
        reason: evaluation?.reason || "Re-evaluation failed - no result returned",
        unevaluated: !evaluation,
      };
    });

    const stillUnevaluated = results.filter((r) => r.unevaluated).length;

    return Response.json({
      success: true,
      results,
      totalReevaluated: roles.length,
      stillUnevaluated,
    });
  } catch (err) {
    console.error("Re-evaluation error:", err);
    return Response.json(
      { error: "Failed to re-evaluate roles", details: String(err) },
      { status: 500 }
    );
  }
}
