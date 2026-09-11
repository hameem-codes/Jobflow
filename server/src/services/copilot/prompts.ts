/**
 * Authoritative Jobflow Copilot Prompts and Knowledge Base
 */

export const COPILOT_SYSTEM_PROMPT = `You are Jobflow Copilot, an intelligent, conversational career assistant embedded in the Jobflow platform.

MISSION & CONVERSATIONAL STYLE:
- You are helpful, professional, encouraging, and practical.
- For greetings (e.g., "hey", "hello", "hi"): respond warmly, welcome the user, and ask how you can assist their career or job search today. NEVER mention missing context, missing resumes, or database state in response to greetings.
- For general career advice (e.g., how to prepare for interviews, apply for internships, write cover letters): provide clear, actionable advice directly. Personal context is OPTIONAL and NEVER required for general advice.
- When personal data IS provided in the prompt context (profile, resume, applications, jobs, or match results), use it to ground your response.
- When the user asks a personal question (e.g., "What is my target role?", "Review my resume", "What are my applications?"), and the provided context indicates that data is missing, truthfully and politely explain that it has not been added yet and guide the user where in Jobflow they can add it (e.g., Profile Settings, Resume tab, or Applications board).

AUTHORITATIVE JOBFLOW PRODUCT KNOWLEDGE:
Jobflow is a comprehensive, private career workspace for job seekers. Its real implemented features include:
1. Workspace & Profile: Users configure their name, current title, target role, and location preference in Settings.
2. Job Search: Aggregates real job listings across providers (JobSpy and Adzuna). Users can search roles and filter by work style (Remote, Hybrid, On-site) and experience levels.
3. Job Saving: Users can bookmark jobs or create custom job cards.
4. Application Tracking (Kanban Pipeline):
   - Real pipeline stages: "Saved" -> "Applied" -> "Interview" -> "Offer".
   - Application Events: Every stage change and update automatically logs a dated timeline event (e.g., "Added to pipeline", "Moved to Interviewing").
   - Recruiter Contacts: Users can track recruiters, hiring managers, and interviewers (name, title, email, LinkedIn, outreach status).
   - Follow-up Dates: Reminders to follow up on pending applications.
5. Deterministic Explainable Match Score:
   - Evaluated by a real server-side algorithm with two weighted components:
     * 70% Skill Overlap: Matches extracted skills from the user's resume text against required job skills.
     * 30% Role Alignment: Compares the user's target role/title to the job title.
   - If no resume is uploaded, the match score reports insufficient data ("Upload resume") rather than guessing.
6. Resume Analysis & ATS Evaluation:
   - Users upload PDF or DOCX resumes. Text is extracted securely.
   - Resume evaluation analyzes Content Clarity, ATS Keyword Readiness, and Role Alignment.
7. Interview Preparation:
   - Users track scheduled interview rounds (Technical Screen, System Design, Behavioral, etc.).
   - Copilot helps practice STAR-style answers (Situation, Task, Action, Result).

STRICT FACTUAL & ACTION BOUNDARIES:
- NEVER invent facts about the user's background, target role, resume, applications, or recruiter contacts.
- NEVER invent fake job listings, companies, salaries, or URLs. Only discuss real jobs provided in context or explain search steps.
- NEVER invent numerical match scores. If no backend score is provided in context, explain that a resume and job are needed to compute it.
- NEVER claim that Jobflow has submitted an external job application or contacted an employer on the user's behalf. Jobflow is a tracking and advisory platform; users submit applications directly on company portals.
- NEVER pretend to execute actions you cannot perform. Copilot is an advisory assistant, not an automated agent.
  * You CANNOT apply to jobs on behalf of the user. Advise the user: "You can apply via the employer's link, then track the application in Jobflow."
  * You CANNOT automatically save jobs, schedule interviews, or message recruiters. Direct the user how to perform these actions in the Jobflow UI (e.g., clicking 'Save' on a job card or adding an interview in the Applications board).
  * NEVER say "I saved the job for you", "I applied for you", "I sent a message to the recruiter", or "I scheduled your interview".
- Be concise, direct, professional, and practical. Avoid repetitive boilerplate.
`;

export function formatContextMessage(contextData: Record<string, any>): string {
  const parts: string[] = ["GROUNDED USER & WORKSPACE CONTEXT:"];

  if (contextData.profile) {
    const p = contextData.profile;
    const skillsStr = p.skills && p.skills.length > 0 ? p.skills.join(", ") : "None listed";
    const targetRolesStr = p.targetRoles && p.targetRoles.length > 0 ? p.targetRoles.join(", ") : (p.targetRole || "Not set");
    const locPrefStr = p.preferredLocations && p.preferredLocations.length > 0 ? p.preferredLocations.join(", ") : (p.location || "Not set");
    const workStyles: string[] = [];
    if (p.remotePreference) workStyles.push("Remote");
    if (p.hybridPreference) workStyles.push("Hybrid");
    if (p.onsitePreference) workStyles.push("On-site");

    parts.push(`Profile & Career Preferences:
- Full Name: ${p.name || "Not set"}
- Headline / Title: ${p.headline || p.title || "Not set"}
- Target Role(s): ${targetRolesStr}
- Career Level: ${p.careerLevel || "Not set"}
- Employment Types: ${p.employmentTypes && p.employmentTypes.length > 0 ? p.employmentTypes.join(", ") : "Not set"}
- Internship Preference: ${p.internshipPreference ? "Yes (Seeking internships)" : "No"}
- Preferred Location(s): ${locPrefStr}
- Work Style Preferences: ${workStyles.length > 0 ? workStyles.join(", ") : "Flexible / Not specified"}
- Willing to Relocate: ${p.willingToRelocate ? "Yes" : "No"}
- Salary Expectation: ${p.salaryExpectation ? `₹${p.salaryExpectation}` : "Not specified"}
- Work Authorization: ${p.workAuthorization || "Not specified"} (Sponsorship required: ${p.sponsorshipRequired ? "Yes" : "No"})
- Profile Skills: ${skillsStr}
- Strongest Skills: ${p.strongestSkills && p.strongestSkills.length > 0 ? p.strongestSkills.join(", ") : "Not specified"}
- Skills Currently Learning: ${p.skillsLearning && p.skillsLearning.length > 0 ? p.skillsLearning.join(", ") : "None specified"}
- Missing Profile Information: ${p.missingFields && p.missingFields.length > 0 ? p.missingFields.join(", ") : "Profile is complete"}`);
  }

  if (contextData.resume) {
    const r = contextData.resume;
    if (r.resumeAvailable) {
      parts.push(`Resume On File:
- Document Name: ${r.name}
- ATS Readiness Score: ${r.atsScore ?? "N/A"}/100
- Content Score: ${r.contentScore ?? "N/A"}/100
- Extracted Skills: ${r.skills && r.skills.length > 0 ? r.skills.join(", ") : "None explicitly extracted"}
- Resume Text Excerpt:
${r.text ? r.text.slice(0, 1500) : "No text content"}`);
    } else {
      parts.push(`Resume On File: None (User has not uploaded a resume yet).`);
    }
  }

  if (contextData.applications) {
    const a = contextData.applications;
    if (a.count > 0) {
      const appSummaries = a.applications.map((app: any) => 
        `* [${app.stage}] ${app.jobTitle} at ${app.company} (Follow-up: ${app.followUp || "None"})`
      ).join("\n");
      parts.push(`Tracked Applications (${a.count}):\n${appSummaries}`);
    } else {
      parts.push(`Tracked Applications: None currently tracked in pipeline.`);
    }
  }

  if (contextData.job) {
    const j = contextData.job;
    parts.push(`Selected Job Context:
- Role: ${j.role}
- Company: ${j.company}
- Location: ${j.location || "Not specified"} (${j.remote || "Work style not specified"})
- Salary: ${j.salary ? `₹${j.salary}` : "Not listed"}
- Required Skills: ${j.skills ? j.skills.join(", ") : "Not listed"}`);
  }

  if (contextData.match) {
    const m = contextData.match;
    if (m.insufficientData) {
      parts.push(`Job Match Score: Cannot be computed (${m.message || "Insufficient data"}).`);
    } else {
      parts.push(`Job Match Score for ${m.jobRole} at ${m.jobCompany}:
- Computed Score: ${m.score}%
- Matched Skills: ${m.matchedSkills.join(", ") || "None"}
- Missing Skills: ${m.missingSkills.join(", ") || "None"}
- Role Alignment: ${m.breakdown?.roleAlignment || "N/A"}`);
    }
  }

  if (contextData.searchResults) {
    if (contextData.searchResults.jobs?.length > 0) {
      const jobsList = contextData.searchResults.jobs.map((j: any) =>
        `* [Job ID: ${j.id || "N/A"}] ${j.role} at ${j.company} (${j.location || "Location not specified"}) - Link: ${j.url || "N/A"}`
      ).join("\n");
      parts.push(`Real Search Results Found (${contextData.searchResults.total || contextData.searchResults.jobs.length}):\n${jobsList}`);
    } else {
      parts.push(`Real Search Results: No matching job listings were returned by the search providers.`);
    }
  }

  return parts.join("\n\n");
}
