import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env.js";

import * as usersSchema from "./schema/users.js";
import * as jobsSchema from "./schema/jobs.js";
import * as applicationsSchema from "./schema/applications.js";
import * as contactsSchema from "./schema/contacts.js";
import * as interviewRoundsSchema from "./schema/interview_rounds.js";
import * as starStoriesSchema from "./schema/star_stories.js";
import * as resumesSchema from "./schema/resumes.js";
import * as offersSchema from "./schema/offers.js";
import * as idempotencySchema from "./schema/idempotency.js";
import * as profilesSchema from "./schema/profiles.js";

const schema = {
  ...usersSchema,
  ...jobsSchema,
  ...applicationsSchema,
  ...contactsSchema,
  ...interviewRoundsSchema,
  ...starStoriesSchema,
  ...resumesSchema,
  ...offersSchema,
  ...idempotencySchema,
  ...profilesSchema,
};

// If DATABASE_URL is not provided, we can still load the module for types, 
// but attempting to query will fail or use dummy URL.
const connectionString = env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy";

// Setup single client connection (pg connection pool configuration suitable for serverless / small instances)
const client = postgres(connectionString, { max: 1 });

export const db = drizzle(client, { schema });
