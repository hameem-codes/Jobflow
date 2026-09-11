import { db } from "../server/src/db/index.js";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("Applying profiles migration...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "profiles" (
        "user_id" varchar(255) PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "headline" varchar(255),
        "about" text,
        "location" varchar(255),
        "country" varchar(100),
        "phone" varchar(50),
        "target_roles" jsonb DEFAULT '[]'::jsonb,
        "career_level" varchar(100),
        "target_industries" jsonb DEFAULT '[]'::jsonb,
        "employment_types" jsonb DEFAULT '[]'::jsonb,
        "internship_preference" boolean DEFAULT false,
        "availability" varchar(100),
        "preferred_locations" jsonb DEFAULT '[]'::jsonb,
        "remote_preference" boolean DEFAULT false,
        "hybrid_preference" boolean DEFAULT false,
        "onsite_preference" boolean DEFAULT false,
        "willing_to_relocate" boolean DEFAULT false,
        "preferred_countries" jsonb DEFAULT '[]'::jsonb,
        "salary_expectation" integer,
        "work_authorization" varchar(100),
        "sponsorship_required" boolean DEFAULT false,
        "skills" jsonb DEFAULT '[]'::jsonb,
        "languages" jsonb DEFAULT '[]'::jsonb,
        "education" jsonb DEFAULT '[]'::jsonb,
        "experience" jsonb DEFAULT '[]'::jsonb,
        "certifications" jsonb DEFAULT '[]'::jsonb,
        "courses" jsonb DEFAULT '[]'::jsonb,
        "projects" jsonb DEFAULT '[]'::jsonb,
        "awards" jsonb DEFAULT '[]'::jsonb,
        "publications" jsonb DEFAULT '[]'::jsonb,
        "volunteer_experience" jsonb DEFAULT '[]'::jsonb,
        "github_url" varchar(255),
        "linkedin_url" varchar(255),
        "portfolio_url" varchar(255),
        "website_url" varchar(255),
        "other_links" jsonb DEFAULT '[]'::jsonb,
        "strongest_skills" jsonb DEFAULT '[]'::jsonb,
        "skills_learning" jsonb DEFAULT '[]'::jsonb,
        "skills_wanting_to_develop" jsonb DEFAULT '[]'::jsonb,
        "preferred_roles" jsonb DEFAULT '[]'::jsonb,
        "roles_willing_to_consider" jsonb DEFAULT '[]'::jsonb,
        "preferred_industries" jsonb DEFAULT '[]'::jsonb,
        "companies_interested_in" jsonb DEFAULT '[]'::jsonb,
        "job_types_to_avoid" jsonb DEFAULT '[]'::jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles';
    `);

    console.log("Profiles table columns:", (result as any).rows?.length || (result as any).length);
    console.log("MIGRATION_SUCCESS");
    process.exit(0);
  } catch (err) {
    console.error("MIGRATION_ERROR:", err);
    process.exit(1);
  }
}

run();
