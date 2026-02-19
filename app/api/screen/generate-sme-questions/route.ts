import { generateText, Output } from "ai";
import { z } from "zod";

const smeQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      context: z.string(),
      category: z.string(),
    })
  ),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      reqId,
      jobText,
      roleRelevanceSummary,
      expectationsSummary,
      correctionRules,
      existingOverrides,
    } = body as {
      reqId: string;
      jobText: string;
      roleRelevanceSummary: string;
      expectationsSummary: string;
      correctionRules: string;
      existingOverrides: string;
    };

    const prompt = `You are an expert HR recruitment consultant helping calibrate an automated resume screening model. Your job is to generate targeted questions for a Subject Matter Expert (SME) who understands what "relevant experience" really means for this specific role.

IMPORTANT CONTEXT: This tool is used to align AI screening logic with how real recruiters evaluate resumes. The SME's answers will become rules the model follows. Your questions should draw out the nuanced, often unwritten logic that experienced recruiters apply.

## Job Posting / Requisition (REQ ${reqId})
${jobText}

## Current Screening Results Summary
### Role Relevance Determinations
${roleRelevanceSummary}

### Requirements Check Summary  
${expectationsSummary}

${correctionRules ? `## Existing Correction Rules (from prior overrides)\n${correctionRules}\n` : ""}
${existingOverrides ? `## Overrides Made This Session\n${existingOverrides}\n` : ""}

## Your Task

First, identify the domain of this job (e.g. nursing/clinical, finance/accounting, IT/engineering, administrative, trades, etc.) and adopt the appropriate SME persona:

**Clinical/Nursing SME**: Focus on license portability between states, clinical setting equivalencies (ICU vs. med-surg vs. home health vs. clinic), scope of practice overlaps between roles, charge nurse vs. staff nurse distinctions, per-diem vs. full-time experience value, travel nurse experience, certification timing (active vs. expired vs. obtainable).

**Finance/Accounting SME**: Focus on CPA/CMA requirements and reciprocity, audit vs. tax vs. advisory track distinctions, public accounting vs. industry experience equivalency, Big 4 vs. regional firm experience weight, industry-specific financial knowledge (banking regulation vs. corporate finance vs. government).

**IT/Engineering SME**: Focus on technology stack relevance and equivalencies (AWS vs. Azure vs. GCP), leadership vs. individual contributor experience, framework/language transferability, certification currency (expired certs), contract vs. FTE experience value, startup vs. enterprise experience.

**Administrative/General SME**: Focus on transferable supervisory skills, industry-specific regulatory knowledge, scope of responsibility (team size, budget authority), customer-facing vs. back-office experience, union vs. non-union environment experience.

**Trades/Skilled Labor SME**: Focus on license/certification reciprocity, journeyman vs. apprentice distinctions, commercial vs. residential experience, specific equipment/tool proficiency, safety certification currency.

Generate 5-8 targeted questions that:
1. Address specific ambiguities or edge cases visible in the screening results
2. Ask about relevance logic the model might be getting wrong (roles it marked relevant that shouldn't be, or excluded roles that should count)
3. Probe timing requirements (what truly must be held upon hire vs. what can be obtained after)
4. Clarify experience equivalencies specific to this domain
5. Ask about the threshold for "Partially Met" vs "Not Evident" for key requirements

Each question should:
- Be specific to the actual screening results, not generic
- Reference specific roles, requirements, or determinations when possible
- Ask for a clear rule the model can follow, not just an opinion
- Include context about WHY you're asking (what ambiguity or assumption prompted it)

For the "category" field, use one of: "Relevance Logic", "Experience Equivalency", "Certification/License", "Timing", "Threshold/Scoring", "Domain Nuance", "Edge Case"`;

    const { output } = await generateText({
      model: "openai/gpt-4o-mini",
      output: Output.object({ schema: smeQuestionsSchema }),
      prompt,
    });

    const questions = (output as { questions: Array<{ question: string; context: string; category: string }> })?.questions || [];

    return Response.json({ questions, reqId });
  } catch (err) {
    console.error("Failed to generate SME questions:", err);
    return Response.json(
      { questions: [], reqId: "", error: "Failed to generate questions" },
      { status: 200 }
    );
  }
}
