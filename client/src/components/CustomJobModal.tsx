import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJobflow } from "@/contexts/JobflowContext";
import { Plus } from "lucide-react";
import { toast } from "sonner";

// Common tech and business skills for keyword extraction
const SKILL_KEYWORDS = [
  "React", "Vue", "Angular", "TypeScript", "JavaScript", "Python", "Java", "Go", "Rust", "C++",
  "Node.js", "Express", "Django", "FastAPI", "Spring", "AWS", "Azure", "GCP", "Docker", "Kubernetes",
  "PostgreSQL", "MongoDB", "Redis", "SQL", "GraphQL", "REST", "API", "Microservices", "DevOps",
  "CI/CD", "Git", "Linux", "Agile", "Scrum", "Leadership", "Management", "Communication",
  "Project management", "Product thinking", "Data analysis", "Machine learning", "Analytics",
  "Design", "UX", "UI", "Figma", "Adobe", "Prototyping", "User research", "Accessibility",
  "HTML", "CSS", "Frontend", "Backend", "Full-stack", "Mobile", "iOS", "Android", "React Native",
  "Web development", "Software architecture", "System design", "Database", "Performance",
  "Testing", "QA", "Security", "Authentication", "Authorization", "Cloud", "Serverless",
  "Consulting", "Strategy", "Operations", "Finance", "Sales", "Marketing", "Business analysis",
  "Data science", "Statistics", "Tableau", "Power BI", "Excel", "Salesforce", "CRM", "ERP"
];

function extractKeywords(text: string): string[] {
  if (!text) return [];

  // Split by common delimiters and extract capitalized phrases
  const words = text.match(/\b[\w]+(?:[\s-][\w]+)*\b/g) || [];
  const extracted = new Set<string>();

  // Check for exact skill matches
  SKILL_KEYWORDS.forEach(skill => {
    if (text.toLowerCase().includes(skill.toLowerCase())) {
      extracted.add(skill);
    }
  });

  // Extract capitalized phrases and compound words
  words.forEach(word => {
    if (word.length > 3 && /^[A-Z]/.test(word)) {
      extracted.add(word);
    }
  });

  return Array.from(extracted).slice(0, 10);
}

function validateUrl(url: string): boolean {
  if (!url) return true; // URL is optional
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function CustomJobModal() {
  const c = useJobflow();
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [salary, setSalary] = useState("");
  const [place, setPlace] = useState("");
  const [remote, setRemote] = useState<"Remote" | "Hybrid" | "On-site" | "All">("Remote");
  const [experience, setExperience] = useState<"Entry" | "Mid" | "Senior" | "All">("Mid");
  const [skills, setSkills] = useState("");
  const [url, setUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const handleExtractKeywords = () => {
    if (!jobDescription.trim()) {
      toast.error("Paste a job description to extract keywords");
      return;
    }
    const extracted = extractKeywords(jobDescription);
    if (extracted.length === 0) {
      toast.info("No keywords extracted. Try adding skills manually.");
      return;
    }
    const allSkills = skills
      ? [...new Set([...skills.split(",").map(s => s.trim()).filter(Boolean), ...extracted])]
      : extracted;
    setSkills(allSkills.join(", "));
    toast.success(`Extracted ${extracted.length} skills from description`);
  };

  const handleSave = () => {
    // Validation: required fields
    if (!company || !role || !salary || !place) {
      toast.error("Company, Role, Salary, and Location are required.");
      return;
    }

    // Validation: URL format if provided
    if (url && !validateUrl(url)) {
      toast.error("Invalid URL format");
      return;
    }

    const skillList = skills.split(",").map(s => s.trim()).filter(Boolean);

    c.addCustomJob({
      company,
      role,
      place,
      remote,
      experience,
      salary: Number(salary.replace(/,/g, '')) || 0,
      skills: skillList,
      url
    });
    toast.success("Custom job added to Opportunity Desk, Match Breakdown, and Cover Letter Studio");
    setOpen(false);
    setCompany(""); setRole(""); setSalary(""); setPlace(""); setSkills(""); setUrl(""); setJobDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="button button--ink" style={{ marginLeft: "10px" }}>
          <Plus size={16} style={{ marginRight: "5px" }} /> Add Custom Job
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]" style={{ fontFamily: "var(--sans)" }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--serif)", fontSize: "20px" }}>Add Custom Job</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label style={{ fontSize: "12px", color: "var(--muted)" }}>Company *</label>
            <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Acme Corp" />
          </div>
          <div className="grid gap-2">
            <label style={{ fontSize: "12px", color: "var(--muted)" }}>Role *</label>
            <Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Senior Frontend Engineer" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label style={{ fontSize: "12px", color: "var(--muted)" }}>Location *</label>
              <Input value={place} onChange={e => setPlace(e.target.value)} placeholder="e.g. New York" />
            </div>
            <div className="grid gap-2">
              <label style={{ fontSize: "12px", color: "var(--muted)" }}>Type</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={remote} onChange={e => setRemote(e.target.value as any)}>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label style={{ fontSize: "12px", color: "var(--muted)" }}>Salary (Annual) *</label>
              <Input type="text" value={salary} onChange={e => setSalary(e.target.value)} placeholder="150,000" />
            </div>
            <div className="grid gap-2">
              <label style={{ fontSize: "12px", color: "var(--muted)" }}>Experience</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={experience} onChange={e => setExperience(e.target.value as any)}>
                <option value="Entry">Entry</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
              </select>
            </div>
          </div>
          <div className="grid gap-2">
            <label style={{ fontSize: "12px", color: "var(--muted)" }}>Skills (comma separated or auto-extract)</label>
            <Input value={skills} onChange={e => setSkills(e.target.value)} placeholder="React, TypeScript, UI" />
          </div>
          <div className="grid gap-2">
            <label style={{ fontSize: "12px", color: "var(--muted)" }}>Job Description (paste to extract keywords)</label>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste job description here to auto-extract skills..."
              style={{
                minHeight: "100px",
                padding: "8px 12px",
                border: "1px solid var(--input)",
                borderRadius: "6px",
                fontFamily: "var(--sans)",
                fontSize: "12px"
              }}
            />
            <Button
              className="button button--ink"
              size="sm"
              onClick={handleExtractKeywords}
              style={{ alignSelf: "flex-start" }}
            >
              Extract Keywords
            </Button>
          </div>
          <div className="grid gap-2">
            <label style={{ fontSize: "12px", color: "var(--muted)" }}>Link to Job Description (optional)</label>
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="button button--lime" onClick={handleSave}>Save Job</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
