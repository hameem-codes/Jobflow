import { groq } from "./groq.js";
import { env } from "../config/env.js";
import { logger } from "./logger.js";
import { ApiError } from "./ApiError.js";
import { z } from "zod";

export interface ResumeEvaluationResult {
  contentClarity: number;
  atsReadiness: number;
  roleAlignment: number;
  recommendation: string;
}

export type EvaluateResumeResponse =
  | {
      insufficientData: true;
      message: string;
    }
  | ({
      insufficientData: false;
    } & ResumeEvaluationResult);

const evaluationSchema = z.object({
  contentClarity: z.coerce.number().min(0).max(100),
  atsReadiness: z.coerce.number().min(0).max(100),
  roleAlignment: z.coerce.number().min(0).max(100),
  recommendation: z.string().min(5),
});

/**
 * Evaluates real resume text against an optional target role using Groq LLM.
 * Strictly adheres to non-fabricated scoring and honest insufficient-data returns.
 */
export async function evaluateResumeText(
  resumeText: string | null | undefined,
  targetRole?: string | null
): Promise<EvaluateResumeResponse> {
  const cleanText = (resumeText || "").trim();
  if (cleanText.length < 40) {
    return {
      insufficientData: true,
      message: "Resume has insufficient extracted text for meaningful evaluation.",
    };
  }

  const roleDesc = targetRole ? `Target Role: "${targetRole}"` : "Target Role: None specified (infer from resume text)";

  const systemPrompt = `You are an expert, objective resume evaluation engine.
Evaluate the resume text strictly based on the provided text. Never fabricate details, hallucinate achievements, or give generic canned advice.

Evaluate across these 4 criteria:
1. contentClarity (0-100): How clear, impactful, and well-written the resume content is (action verbs, quantifiable metrics, concise structure).
2. atsReadiness (0-100): How well-structured and parseable the text is for Applicant Tracking Systems (clear sections like Experience, Education, Skills; standard headings; no weird text artifacts). Note: This is a text-based heuristic estimate, not true ATS software simulation.
3. roleAlignment (0-100): How well the candidate's skills and experience match the ${roleDesc}. If target role is unspecified or empty, evaluate alignment with the primary title/profession evident in the resume.
4. recommendation (string): EXACTLY ONE specific, actionable improvement tied directly to real content or a specific bullet point in this resume (e.g., citing a specific project, technology, or metric in the text that could be strengthened). Do NOT output generic advice.

Return ONLY a valid JSON object matching this schema:
{
  "contentClarity": <integer 0-100>,
  "atsReadiness": <integer 0-100>,
  "roleAlignment": <integer 0-100>,
  "recommendation": "<specific actionable string>"
}`;

  const userPrompt = `${roleDesc}\n\nResume Extracted Text:\n${cleanText.slice(0, 8000)}`;

  const modelToUse = env.GROQ_MODEL || "openai/gpt-oss-120b";

  try {
    const completion = await groq.chat.completions.create({
      model: modelToUse,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      throw new ApiError(502, "PROVIDER_FAILED", "Empty response received from LLM provider");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      throw new ApiError(502, "PROVIDER_FAILED", "Failed to parse evaluation response as JSON");
    }

    const validated = evaluationSchema.safeParse(parsed);
    if (!validated.success) {
      logger.warn({ rawContent, error: validated.error }, "Invalid evaluation JSON schema from Groq");
      throw new ApiError(502, "PROVIDER_FAILED", "Evaluation response did not meet expected schema");
    }

    const { contentClarity, atsReadiness, roleAlignment, recommendation } = validated.data;

    return {
      insufficientData: false,
      contentClarity: Math.max(0, Math.min(100, Math.round(contentClarity))),
      atsReadiness: Math.max(0, Math.min(100, Math.round(atsReadiness))),
      roleAlignment: Math.max(0, Math.min(100, Math.round(roleAlignment))),
      recommendation: recommendation.trim(),
    };
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error({ err: error }, "Groq resume evaluation error");
    throw new ApiError(502, "PROVIDER_FAILED", error?.message || "Failed to evaluate resume with AI");
  }
}
