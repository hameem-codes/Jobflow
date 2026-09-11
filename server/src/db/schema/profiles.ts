import { pgTable, timestamp, varchar, text, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const profiles = pgTable("profiles", {
  userId: varchar("user_id", { length: 255 })
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),

  // Identity
  headline: varchar("headline", { length: 255 }),
  about: text("about"),
  location: varchar("location", { length: 255 }),
  country: varchar("country", { length: 100 }),
  phone: varchar("phone", { length: 50 }),

  // Career
  targetRoles: jsonb("target_roles").$type<string[]>().default([]),
  careerLevel: varchar("career_level", { length: 100 }), // Entry, Mid, Senior, Lead, Intern
  targetIndustries: jsonb("target_industries").$type<string[]>().default([]),
  employmentTypes: jsonb("employment_types").$type<string[]>().default([]), // Full-time, Part-time, Contract, Internship
  internshipPreference: boolean("internship_preference").default(false),
  availability: varchar("availability", { length: 100 }),

  // Job Preferences
  preferredLocations: jsonb("preferred_locations").$type<string[]>().default([]),
  remotePreference: boolean("remote_preference").default(false),
  hybridPreference: boolean("hybrid_preference").default(false),
  onsitePreference: boolean("onsite_preference").default(false),
  willingToRelocate: boolean("willing_to_relocate").default(false),
  preferredCountries: jsonb("preferred_countries").$type<string[]>().default([]),
  salaryExpectation: integer("salary_expectation"),
  workAuthorization: varchar("work_authorization", { length: 100 }),
  sponsorshipRequired: boolean("sponsorship_required").default(false),

  // Professional
  skills: jsonb("skills").$type<string[]>().default([]),
  languages: jsonb("languages").$type<Array<{ language: string; proficiency: string }>>().default([]),
  education: jsonb("education").$type<Array<{
    id: string;
    school: string;
    degree: string;
    field: string;
    year: string;
    gpa?: string | null;
  }>>().default([]),
  experience: jsonb("experience").$type<Array<{
    id: string;
    company: string;
    role: string;
    location?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    current?: boolean;
    bullets?: string[];
  }>>().default([]),
  certifications: jsonb("certifications").$type<Array<{
    id: string;
    name: string;
    issuer: string;
    issueDate?: string | null;
    url?: string | null;
  }>>().default([]),
  courses: jsonb("courses").$type<Array<{
    id: string;
    name: string;
    provider: string;
  }>>().default([]),
  projects: jsonb("projects").$type<Array<{
    id: string;
    name: string;
    description: string;
    link?: string | null;
    bullets?: string[];
  }>>().default([]),
  awards: jsonb("awards").$type<Array<{
    id: string;
    title: string;
    issuer?: string | null;
    date?: string | null;
  }>>().default([]),
  publications: jsonb("publications").$type<Array<{
    id: string;
    title: string;
    publisher?: string | null;
    url?: string | null;
    date?: string | null;
  }>>().default([]),
  volunteerExperience: jsonb("volunteer_experience").$type<Array<{
    id: string;
    organization: string;
    role: string;
    bullets?: string[];
  }>>().default([]),

  // Portfolio
  githubUrl: varchar("github_url", { length: 255 }),
  linkedinUrl: varchar("linkedin_url", { length: 255 }),
  portfolioUrl: varchar("portfolio_url", { length: 255 }),
  websiteUrl: varchar("website_url", { length: 255 }),
  otherLinks: jsonb("other_links").$type<Array<{ label: string; url: string }>>().default([]),

  // AI & Career Preferences
  strongestSkills: jsonb("strongest_skills").$type<string[]>().default([]),
  skillsLearning: jsonb("skills_learning").$type<string[]>().default([]),
  skillsWantingToDevelop: jsonb("skills_wanting_to_develop").$type<string[]>().default([]),
  preferredRoles: jsonb("preferred_roles").$type<string[]>().default([]),
  rolesWillingToConsider: jsonb("roles_willing_to_consider").$type<string[]>().default([]),
  preferredIndustries: jsonb("preferred_industries").$type<string[]>().default([]),
  companiesInterestedIn: jsonb("companies_interested_in").$type<string[]>().default([]),
  jobTypesToAvoid: jsonb("job_types_to_avoid").$type<string[]>().default([]),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
