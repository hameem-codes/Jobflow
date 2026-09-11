import { providerRegistry } from "../lib/providers/registry.js";

async function main() {
  console.log("=== STARTING PROVIDER REGISTRY VERIFICATION ===");

  const searchInput = { query: "Software Engineer", location: "Remote", page: 1, limit: 5 };
  const result = await providerRegistry.search(searchInput);

  console.log("Returned job count:", result.jobs.length);
  if (result.error) {
    console.error("Provider returned error:", result.error);
    throw new Error(`Provider failed: ${result.error}`);
  }

  if (result.jobs.length === 0) {
    throw new Error("Expected Adzuna to return jobs!");
  }

  console.log("Sample returned job title:", result.jobs[0].title);
  console.log("Sample returned job company:", result.jobs[0].company);
  console.log("Sample returned job source:", result.jobs[0].source);

  if (result.jobs[0].source !== "adzuna") {
    console.warn("Unexpected source:", result.jobs[0].source);
  }

  console.log("=== ALL PROVIDER REGISTRY VERIFICATION CHECKS PASSED ===");
  process.exit(0);
}

main().catch((err) => {
  console.error("VERIFICATION FAILED:", err);
  process.exit(1);
});
