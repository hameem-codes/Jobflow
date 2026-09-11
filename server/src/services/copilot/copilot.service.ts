import { groq } from "../../lib/groq.js";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { ApiError } from "../../lib/ApiError.js";
import { COPILOT_SYSTEM_PROMPT, formatContextMessage } from "./prompts.js";
import { copilotContextService } from "./context.service.js";

export type CopilotMode =
  | "general"
  | "resume_feedback"
  | "interview_prep"
  | "cover_letter"
  | "job_search"
  | "application_tracking";

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CopilotChatParams {
  jobflowId: string;
  message: string;
  history?: ChatHistoryMessage[];
  mode?: CopilotMode;
  jobId?: string;
  applicationId?: string;
}

export class CopilotService {
  /**
   * Classifies user message and request parameters into an intent.
   */
  classifyIntent(message: string, mode?: CopilotMode, jobId?: string): string {
    const text = message.toLowerCase().trim();

    // 1. Explicit mode overrides (when explicitly selected by user or UI action)
    if (
      mode === "resume_feedback" ||
      text.includes("review my resume") ||
      text.includes("check my resume") ||
      text.includes("my resume") ||
      text.includes("skills on my resume") ||
      text.includes("what skills are on my resume") ||
      text.includes("ats ready") ||
      text.includes("ats score") ||
      text.includes("what should i improve") ||
      text.includes("improve my resume")
    ) {
      return "RESUME_ANALYSIS";
    }

    if (
      mode === "interview_prep" ||
      text.includes("prepare for an interview") ||
      text.includes("help me prepare for my interview") ||
      text.includes("how should i prepare") ||
      text.includes("interview prep") ||
      text.includes("practice interview") ||
      text.includes("mock interview") ||
      text.includes("prepare for interview") ||
      text.includes("interview questions")
    ) {
      return "INTERVIEW_PREPARATION";
    }

    if (
      mode === "job_search" ||
      text.startsWith("find ") ||
      text.startsWith("search ") ||
      text.startsWith("show me ") ||
      text.startsWith("look for ") ||
      text.includes("find internships") ||
      text.includes("find jobs") ||
      text.includes("search jobs") ||
      text.includes("search internships") ||
      text.includes("internships for me") ||
      text.includes("jobs for me")
    ) {
      return "JOB_SEARCH";
    }

    if (
      mode === "application_tracking" ||
      text.includes("my application") ||
      text.includes("what applications do i have") ||
      text.includes("what jobs have i applied to") ||
      text.includes("track the application") ||
      text.includes("follow up on") ||
      text.includes("follow up") ||
      text.includes("when should i follow up") ||
      text.includes("active applications") ||
      text.includes("tracked applications") ||
      text.includes("status of my application") ||
      text.includes("what should i say to the recruiter") ||
      text.includes("which applications need attention")
    ) {
      return "APPLICATION_TRACKING";
    }

    // 2. Personal profile intent
    if (
      text.includes("target role") ||
      text.includes("my profile") ||
      text.includes("my title") ||
      text.includes("my location") ||
      text.includes("where do i live") ||
      text.includes("what location am i looking for") ||
      text.includes("what have i put in my profile")
    ) {
      return "PERSONAL_PROFILE";
    }

    // 3. Match score intent
    if (
      text.includes("match score") ||
      text.includes("best match") ||
      text.includes("which job is best") ||
      text.includes("which job is my best") ||
      text.includes("why is my score") ||
      text.includes("am i a good fit") ||
      text.includes("good match") ||
      text.includes("bad match") ||
      text.includes("fit for this job") ||
      text.includes("tell me about this job") ||
      text.includes("why should i apply") ||
      text.includes("why shouldn't i apply") ||
      (jobId && (text.includes("match") || text.includes("score") || text.includes("fit") || text.includes("apply")))
    ) {
      return "JOB_MATCHING";
    }

    // 4. Jobflow product help
    if (
      text.includes("how does jobflow work") ||
      text.includes("what is jobflow") ||
      text.includes("what can you do") ||
      text.includes("how do match scores work") ||
      text.includes("how does matching work") ||
      text.includes("jobflow features")
    ) {
      return "JOBFLOW_HELP";
    }

    // 5. Greetings / Chit-chat
    if (
      /^(hey|hello|hi|good morning|good afternoon|good evening|howdy|sup|greetings|yo)[\s!.,?]*$/i.test(text) ||
      text === "hey" ||
      text === "hello" ||
      text === "hi"
    ) {
      return "GENERAL_CONVERSATION";
    }

    // 6. Career guidance (general)
    if (
      text.includes("internship") ||
      text.includes("career") ||
      text.includes("apply") ||
      text.includes("advice") ||
      text.includes("tips") ||
      text.includes("improve my chances") ||
      text.includes("cover letter")
    ) {
      return "CAREER_GUIDANCE";
    }

    return "GENERAL_CONVERSATION";
  }

  /**
   * Gathers grounded context only when needed for the classified intent.
   */
  async assembleContext(
    intent: string,
    params: CopilotChatParams
  ): Promise<Record<string, any> | null> {
    const { jobflowId, message, jobId, applicationId } = params;
    const contextData: Record<string, any> = {};

    switch (intent) {
      case "GENERAL_CONVERSATION":
      case "JOBFLOW_HELP":
        // No personal data retrieval required
        return null;

      case "CAREER_GUIDANCE":
        // Optional profile check to see if user has targetRole to contextualize general advice
        const profile = await copilotContextService.getProfileContext(jobflowId);
        if (profile.hasTargetRole) {
          contextData.profile = profile;
          return contextData;
        }
        return null;

      case "PERSONAL_PROFILE":
        contextData.profile = await copilotContextService.getProfileContext(jobflowId);
        return contextData;

      case "RESUME_ANALYSIS":
        contextData.profile = await copilotContextService.getProfileContext(jobflowId);
        contextData.resume = await copilotContextService.getResumeContext(jobflowId);
        return contextData;

      case "JOB_SEARCH": {
        const profileContext = await copilotContextService.getProfileContext(jobflowId);
        contextData.profile = profileContext;

        let query = message
          .replace(/^(can you\s+)?(find|search for|search|show me|look for|get me)\s+/i, "")
          .replace(/\s+(for me|please)[\s.!?,]*$/i, "")
          .trim();

        let location = "";
        const inMatch = query.match(/\bin\s+([a-zA-Z\s]+)$/i);
        if (inMatch) {
          location = inMatch[1].trim();
          query = query.replace(/\bin\s+[a-zA-Z\s]+$/i, "").trim();
        } else if (profileContext.location) {
          location = profileContext.location;
        }

        if (!query || query.toLowerCase() === "internships" || query.toLowerCase() === "jobs") {
          query = profileContext.targetRole ? `${profileContext.targetRole} internship` : "software engineer internship";
        }

        contextData.searchResults = await copilotContextService.searchJobsContext(query, location);
        return contextData;
      }

      case "JOB_MATCHING": {
        contextData.profile = await copilotContextService.getProfileContext(jobflowId);
        contextData.resume = await copilotContextService.getResumeContext(jobflowId);
        if (jobId) {
          contextData.job = await copilotContextService.getJobContext(jobId);
        }
        contextData.match = await copilotContextService.getJobMatchContext(jobflowId, jobId);
        return contextData;
      }

      case "APPLICATION_TRACKING":
        contextData.profile = await copilotContextService.getProfileContext(jobflowId);
        contextData.applications = await copilotContextService.getApplicationsContext(jobflowId, applicationId);
        return contextData;

      case "INTERVIEW_PREPARATION":
        contextData.profile = await copilotContextService.getProfileContext(jobflowId);
        contextData.resume = await copilotContextService.getResumeContext(jobflowId);
        if (jobId) {
          contextData.job = await copilotContextService.getJobContext(jobId);
        }
        if (applicationId) {
          contextData.applications = await copilotContextService.getApplicationsContext(jobflowId, applicationId);
        }
        return contextData;

      default:
        return null;
    }
  }

  /**
   * Generates a streaming response from Groq with grounded context and multi-turn history.
   */
  async streamChat(params: CopilotChatParams) {
    const { jobflowId, message, history, mode, jobId } = params;

    const intent = this.classifyIntent(message, mode, jobId);
    logger.info({ jobflowId, intent, mode }, "Copilot intent classified");

    const contextData = await this.assembleContext(intent, params);

    // Build Groq messages array
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: COPILOT_SYSTEM_PROMPT },
    ];

    // If grounded context exists, inject as a system context instruction
    if (contextData && Object.keys(contextData).length > 0) {
      const formattedContext = formatContextMessage(contextData);
      messages.push({
        role: "system",
        content: formattedContext,
      });
    }

    // Append validated conversation history
    if (Array.isArray(history) && history.length > 0) {
      for (const turn of history) {
        if (turn && (turn.role === "user" || turn.role === "assistant") && turn.content) {
          messages.push({
            role: turn.role,
            content: turn.content,
          });
        }
      }
    }

    // Append current user message
    messages.push({
      role: "user",
      content: message,
    });

    try {
      const stream = await groq.chat.completions.create({
        messages,
        model: env.GROQ_MODEL,
        stream: true,
      });

      return stream;
    } catch (error: any) {
      logger.error({ err: error, jobflowId, intent }, "Groq API failure");
      throw new ApiError(502, "PROVIDER_FAILED", error.message || "AI provider failed");
    }
  }
}

export const copilotService = new CopilotService();
