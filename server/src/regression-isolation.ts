import { app } from "./app.js";
import request from "supertest";
import { supabaseAdmin } from "./lib/supabase.js";
import { db } from "./db/index.js";
import { users } from "./db/schema/users.js";
import { applications } from "./db/schema/applications.js";
import { contacts } from "./db/schema/contacts.js";
import { interviewRounds } from "./db/schema/interview_rounds.js";
import { eq } from "drizzle-orm";

async function runIsolationRegression() {
  console.log("==================================================");
  console.log("RUNNING USER ISOLATION REGRESSION TEST");
  console.log("==================================================\n");

  const ts = Date.now();
  const emailA = `iso_a_${ts}@gmail.com`;
  const emailB = `iso_b_${ts}@gmail.com`;
  const pass = `IsoPass!${ts}`;

  let uuidA: string | null = null;
  let uuidB: string | null = null;
  let cookieA: string | null = null;
  let cookieB: string | null = null;

  // 1. Create two test accounts
  const signupA = await request(app).post("/api/auth/signup").send({ email: emailA, password: pass, name: "User A" });
  uuidA = signupA.body?.user?.id;
  const cookiesA: string[] = Array.isArray(signupA.headers["set-cookie"]) ? signupA.headers["set-cookie"] : [];
  cookieA = cookiesA.find(c => c.startsWith("app_session_id="))?.split(";")[0] || null;

  const signupB = await request(app).post("/api/auth/signup").send({ email: emailB, password: pass, name: "User B" });
  uuidB = signupB.body?.user?.id;
  const cookiesB: string[] = Array.isArray(signupB.headers["set-cookie"]) ? signupB.headers["set-cookie"] : [];
  cookieB = cookiesB.find(c => c.startsWith("app_session_id="))?.split(";")[0] || null;

  if (!cookieA || !cookieB || !uuidA || !uuidB) {
    console.error("Failed to set up test accounts");
    process.exit(1);
  }

  // 2. User B creates a custom job first
  const jobB = await request(app)
    .post("/api/jobs")
    .set("Cookie", [cookieB, "csrf-token=test-csrf"])
    .set("x-csrf-token", "test-csrf")
    .send({ company: "Iso Corp", role: "Iso Engineer" });

  const jobBId = jobB.body.id;

  // User B creates an application, contact, and interview
  const appB = await request(app)
    .post("/api/applications")
    .set("Cookie", [cookieB, "csrf-token=test-csrf"])
    .set("x-csrf-token", "test-csrf")
    .send({ jobId: jobBId });

  const appBId = appB.body.id;

  const contactB = await request(app)
    .post(`/api/applications/${appBId}/contacts`)
    .set("Cookie", [cookieB, "csrf-token=test-csrf"])
    .set("x-csrf-token", "test-csrf")
    .send({ name: "User B Contact", title: "Recruiter" });

  const contactBId = contactB.body.id;

  const intB = await request(app)
    .post(`/api/applications/${appBId}/interviews`)
    .set("Cookie", [cookieB, "csrf-token=test-csrf"])
    .set("x-csrf-token", "test-csrf")
    .send({ type: "Screening", date: new Date().toISOString() });

  const intBId = intB.body.id;

  console.log(`Created User B resources: App=${appBId}, Contact=${contactBId}, Interview=${intBId}`);

  // 3. User A attempts to UPDATE User B's contact -> Expecting HTTP 404
  const hackContactPut = await request(app)
    .put(`/api/applications/${appBId}/contacts/${contactBId}`)
    .set("Cookie", [cookieA, "csrf-token=test-csrf"])
    .set("x-csrf-token", "test-csrf")
    .send({ name: "Hacked by User A" });

  console.log(`User A -> PUT User B's contact HTTP status: ${hackContactPut.status}`);

  // 4. User A attempts to DELETE User B's contact -> Expecting HTTP 404
  const hackContactDel = await request(app)
    .delete(`/api/applications/${appBId}/contacts/${contactBId}`)
    .set("Cookie", [cookieA, "csrf-token=test-csrf"])
    .set("x-csrf-token", "test-csrf");

  console.log(`User A -> DELETE User B's contact HTTP status: ${hackContactDel.status}`);

  // 5. User A attempts to DELETE User B's interview -> Expecting HTTP 404
  const hackIntDel = await request(app)
    .delete(`/api/applications/${appBId}/interviews/${intBId}`)
    .set("Cookie", [cookieA, "csrf-token=test-csrf"])
    .set("x-csrf-token", "test-csrf");

  console.log(`User A -> DELETE User B's interview HTTP status: ${hackIntDel.status}`);

  // 6. Verify User B's contact and interview remain unchanged in DB
  const [checkContact] = await db.select().from(contacts).where(eq(contacts.id, contactBId));
  const [checkInt] = await db.select().from(interviewRounds).where(eq(interviewRounds.id, intBId));

  const contactIsIntact = checkContact && checkContact.name === "User B Contact";
  const intIsIntact = !!checkInt;

  console.log(`Contact intact: ${contactIsIntact} (name: '${checkContact?.name}')`);
  console.log(`Interview intact: ${intIsIntact}`);

  // Cleanup
  if (uuidA) {
    await supabaseAdmin.auth.admin.deleteUser(uuidA).catch(() => {});
    await db.delete(users).where(eq(users.id, uuidA)).catch(() => {});
  }
  if (uuidB) {
    await supabaseAdmin.auth.admin.deleteUser(uuidB).catch(() => {});
    await db.delete(users).where(eq(users.id, uuidB)).catch(() => {});
  }

  if (hackContactPut.status === 404 && hackContactDel.status === 404 && hackIntDel.status === 404 && contactIsIntact && intIsIntact) {
    console.log("\n==================================================");
    console.log("REGRESSION RESULT: PASS - USER ISOLATION CONFIRMED");
    console.log("==================================================\n");
    process.exit(0);
  } else {
    console.error("\n==================================================");
    console.error("REGRESSION RESULT: FAIL - ISOLATION DEFECT REMAINS");
    console.error("==================================================\n");
    process.exit(1);
  }
}

runIsolationRegression().catch(err => {
  console.error("Regression script failed:", err);
  process.exit(1);
});
