import { generateText, Output } from "ai";
import { z } from "zod";

const lessonSchema = z.object({
  lesson: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, reqId, context } = body as {
      type: "relevance" | "expectation";
      reqId: string;
      context: {
        jobRequirements: string;
        candidateName: string;
        original: string;
        corrected: string;
        roleOrExpectation: string;
        evidence?: string;
      };
    };

    let prompt = "";

    if (type === "relevance") {
      prompt = `A human HR reviewer has OVERRIDDEN an AI screening decision. Analyze the override and generate a concise lesson so the AI does not repeat this mistake.

CONTEXT:
- Requisition: ${reqId}
- Candidate: ${context.candidateName}
- Role being evaluated: ${context.roleOrExpectation}
- AI's original determination: ${context.original}
- Human's correction: ${context.corrected}
- AI's original reasoning: ${context.evidence || "N/A"}

JOB REQUIREMENTS:
${context.jobRequirements}

Generate a concise, specific lesson (2-3 sentences) that explains:
1. What the AI got wrong in its relevance assessment
2. What the correct interpretation should be
3. A generalizable rule the AI should follow for similar roles in the future

The lesson should be phrased as an instruction, e.g. "When evaluating [type of role], consider [factor] as relevant because [reason]."`;
    } else {
      prompt = `A human HR reviewer has OVERRIDDEN an AI screening decision about a job requirement. Analyze the override and generate a concise lesson.

CONTEXT:
- Requisition: ${reqId}
- Candidate: ${context.candidateName}
- Requirement: ${context.roleOrExpectation}
- AI's original status: ${context.original}
- Human's corrected status: ${context.corrected}
- AI's evidence: ${context.evidence || "N/A"}

JOB REQUIREMENTS:
${context.jobRequirements}

Generate a concise, specific lesson (2-3 sentences) that explains:
1. What the AI got wrong in assessing this requirement
2. What evidence or interpretation the AI missed or misjudged
3. A generalizable rule for evaluating similar requirements

The lesson should be phrased as an instruction, e.g. "When evaluating [requirement type], consider [factor] as meeting/not meeting the requirement because [reason]."`;
    }

    const { output } = await generateText({
      model: "openai/gpt-4o-mini",
      output: Output.object({ schema: lessonSchema }),
      prompt,
    });

    const lesson = (output as { lesson: string })?.lesson || "Override recorded.";

    return Response.json({ lesson });
  } catch (err) {
    return Response.json(
      { lesson: "Override recorded but analysis failed." },
      { status: 200 }
    );
  }
}
