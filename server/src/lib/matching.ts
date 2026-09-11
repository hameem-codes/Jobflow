import { logger } from "./logger.js";

export interface MatchInput {
  resumeText: string | null;
  resumeSkills?: string[] | null;
  targetRole?: string | null;
  userTitle?: string | null;
  jobRole: string;
  jobSkills?: string[] | null;
  jobCompany?: string;
}

export interface MatchResult {
  score: number;
  insufficientData?: boolean;
  matchedSkills: string[];
  missingSkills: string[];
  breakdown: {
    skillMatchPercentage: number;
    roleAlignmentScore: number;
    matchedCount: number;
    totalRequiredCount: number;
    roleAlignment: "Strong" | "Moderate" | "Low";
  };
}

// Canonical tech and professional skill dictionary for extraction
const KNOWN_SKILLS = new Set([
  "javascript", "typescript", "react", "node.js", "nodejs", "express", "python", "sql",
  "postgresql", "postgres", "aws", "docker", "git", "graphql", "tailwind", "css", "html",
  "agile", "rest api", "rest", "api", "ci/cd", "kubernetes", "java", "c++", "go", "golang",
  "ruby", "devops", "system design", "testing", "jest", "vitest", "redux", "next.js", "nextjs",
  "mongodb", "redis", "drizzle", "orm", "prisma", "vue", "angular", "flutter", "dart",
  "microservices", "kafka", "elasticsearch", "gcp", "azure", "linux", "jira", "figma",
  "webpack", "vite", "unit testing", "integration testing", "e2e testing", "playwright",
]);

/**
 * Extracts a normalized list of skills from a text block or explicit skills array
 */
export function extractSkills(text: string | null, explicitSkills: string[] = []): Set<string> {
  const skills = new Set<string>();

  // Add explicit skills first
  for (const s of explicitSkills) {
    if (s && typeof s === "string") {
      skills.add(s.trim().toLowerCase());
    }
  }

  if (!text) return skills;

  const lowerText = text.toLowerCase();

  // Match known skills
  for (const skill of Array.from(KNOWN_SKILLS)) {
    // Word boundary or non-alphanumeric wrap check
    const pattern = new RegExp(`(?:^|[^a-z0-9+#])${escapeRegex(skill)}(?:$|[^a-z0-9+#])`, "i");
    if (pattern.test(lowerText)) {
      skills.add(skill);
    }
  }

  // Also extract words from comma/bullet separated lists in text
  const tokens = lowerText.split(/[,;\n\u2022\u25cf]/);
  for (const token of tokens) {
    const trimmed = token.trim();
    if (trimmed.length >= 2 && trimmed.length <= 30 && !trimmed.includes("http")) {
      // If it looks like a skill token (1-3 words)
      const words = trimmed.split(/\s+/);
      if (words.length <= 3 && /^[a-z0-9 .#+-]+$/i.test(trimmed)) {
        skills.add(trimmed);
      }
    }
  }

  return skills;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Computes an explainable, deterministic match score between a user resume/profile and a job posting
 */
export function calculateJobMatch(input: MatchInput): MatchResult {
  const userSkills = extractSkills(input.resumeText, input.resumeSkills || []);

  if (userSkills.size === 0 && (!input.resumeText || input.resumeText.trim().length === 0)) {
    return {
      score: 0,
      insufficientData: true,
      matchedSkills: [],
      missingSkills: [],
      breakdown: {
        skillMatchPercentage: 0,
        roleAlignmentScore: 0,
        matchedCount: 0,
        totalRequiredCount: 0,
        roleAlignment: "Low",
      },
    };
  }
  const jobSkills = extractSkills(null, input.jobSkills || []);

  // Also extract skills from job role title if jobSkills array is small
  const roleSkills = extractSkills(input.jobRole);
  for (const s of Array.from(roleSkills)) {
    jobSkills.add(s);
  }

  // If no job skills extracted at all, derive from jobRole words
  if (jobSkills.size === 0) {
    const roleWords = input.jobRole.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    for (const w of roleWords) jobSkills.add(w);
  }

  const userSkillList = Array.from(userSkills);
  const jobSkillList = Array.from(jobSkills);

  const matchedSkillsSet = new Set<string>();
  const missingSkillsSet = new Set<string>();

  for (const skill of jobSkillList) {
    if (userSkills.has(skill) || userSkillList.some(us => us.includes(skill) || skill.includes(us))) {
      matchedSkillsSet.add(skill);
    } else {
      missingSkillsSet.add(skill);
    }
  }

  const matchedSkills = Array.from(matchedSkillsSet);
  const missingSkills = Array.from(missingSkillsSet);

  const totalRequired = jobSkillList.length || 1;
  const matchedCount = matchedSkills.length;
  const skillMatchPercentage = Math.round((matchedCount / totalRequired) * 100);

  // Role Alignment score
  let roleAlignmentScore = 50; // default baseline role score
  const targetRole = (input.targetRole || input.userTitle || "").toLowerCase().trim();
  const jobRoleLower = input.jobRole.toLowerCase().trim();

  if (targetRole && jobRoleLower) {
    const targetWords = targetRole.split(/\s+/);
    const matchedRoleWords = targetWords.filter(w => w.length > 2 && jobRoleLower.includes(w));
    if (matchedRoleWords.length > 0) {
      roleAlignmentScore = Math.min(100, Math.round((matchedRoleWords.length / targetWords.length) * 100));
    } else {
      roleAlignmentScore = 30;
    }
  }

  let roleAlignmentLabel: "Strong" | "Moderate" | "Low" = "Moderate";
  if (roleAlignmentScore >= 75) roleAlignmentLabel = "Strong";
  else if (roleAlignmentScore < 45) roleAlignmentLabel = "Low";

  // Weighted Score: 70% Skill Match + 30% Role Alignment
  const finalScore = Math.min(100, Math.max(0, Math.round(skillMatchPercentage * 0.7 + roleAlignmentScore * 0.3)));

  logger.info(
    {
      score: finalScore,
      skillMatchPercentage,
      roleAlignmentScore,
      matchedCount,
      totalRequired,
    },
    "Computed job match score"
  );

  return {
    score: finalScore,
    matchedSkills,
    missingSkills,
    breakdown: {
      skillMatchPercentage,
      roleAlignmentScore,
      matchedCount,
      totalRequiredCount: totalRequired,
      roleAlignment: roleAlignmentLabel,
    },
  };
}
