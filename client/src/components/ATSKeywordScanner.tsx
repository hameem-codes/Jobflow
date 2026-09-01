import { useState, useMemo } from "react";
import { useJobflow } from "@/contexts/JobflowContext";
import { Badge } from "@/components/ui/badge";
import { Gauge, Plus, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function ATSKeywordScanner({ resumeId }: { resumeId: string }) {
  const c = useJobflow();
  const [jobId, setJobId] = useState("");
  
  const resume = c.resumes.find(r => r.id === resumeId);
  const job = c.jobs.find(j => j.id === jobId);

  const analysis = useMemo(() => {
    if (!resume || !job) return null;
    
    // Simulate keyword extraction from resume structured content
    const content = resume.content;
    const allResumeText = [
      content?.summary || "",
      ...(content?.workHistory.map(w => w.company + " " + w.role + " " + w.bullets.join(" ")) || []),
      ...(content?.education.map(e => e.field + " " + e.degree) || []),
      ...(content?.skills || []),
      resume.text
    ].join(" ").toLowerCase();

    const jobKeywords = job.skills.map(s => s.toLowerCase());
    
    const found: string[] = [];
    const missing: string[] = [];

    jobKeywords.forEach(kw => {
      if (allResumeText.includes(kw)) {
        found.push(kw);
      } else {
        missing.push(kw);
      }
    });

    const score = jobKeywords.length > 0 ? Math.round((found.length / jobKeywords.length) * 100) : 0;

    return { found, missing, score };
  }, [resume, job]);

  const addMissingKeyword = (kw: string) => {
    if (!resume?.content) return;
    const currentSkills = resume.content.skills;
    if (!currentSkills.includes(kw)) {
      c.updateResumeContent(resumeId, { skills: [...currentSkills, kw] });
      toast.success(`Added "${kw}" to your skills section`);
    }
  };

  return (
    <div className="card ats-scanner-card">
      <div className="card-kicker" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Live ATS Keyword Scanner</span>
        <Gauge size={14} color="var(--blue)" />
      </div>

      <div style={{ marginBottom: "15px", marginTop: "10px" }}>
        <select className="select-row" value={jobId} onChange={e => setJobId(e.target.value)}>
          <option value="">Select a target job...</option>
          {c.jobs.map(j => (
            <option key={j.id} value={j.id}>{j.role} · {j.company}</option>
          ))}
        </select>
      </div>

      {!analysis ? (
        <div style={{ fontSize: "12px", color: "var(--muted)", textAlign: "center", padding: "20px 0" }}>
          Select a job to see how well your current resume matches its required skills.
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--rule)", paddingBottom: "15px" }}>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: analysis.score >= 80 ? "var(--lime-dark)" : "var(--ink)" }}>
              {analysis.score}%
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>
              ATS Match Score<br/>Based on {job?.skills.length} extracted keywords.
            </div>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <h4 style={{ fontSize: "12px", textTransform: "uppercase", marginBottom: "8px", display: "flex", alignItems: "center", gap: "5px" }}>
              <AlertTriangle size={14} color="var(--clay)" /> Missing Essential Keywords
            </h4>
            <div className="tag-row" style={{ gap: "6px" }}>
              {analysis.missing.length === 0 ? <span style={{ fontSize: "12px", color: "var(--muted)" }}>None! Great job.</span> : null}
              {analysis.missing.map(kw => (
                <button 
                  key={kw} 
                  onClick={() => addMissingKeyword(kw)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", padding: "4px 8px", borderRadius: "100px", border: "1px solid var(--clay)", background: "transparent", color: "var(--ink)", cursor: "pointer" }}
                  title="Click to add to skills"
                >
                  {kw} <Plus size={10} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: "12px", textTransform: "uppercase", marginBottom: "8px", display: "flex", alignItems: "center", gap: "5px" }}>
              <CheckCircle2 size={14} color="var(--lime-dark)" /> Found Keywords
            </h4>
            <div className="tag-row tag-row--muted" style={{ gap: "6px" }}>
              {analysis.found.length === 0 ? <span style={{ fontSize: "12px", color: "var(--muted)" }}>No keywords found.</span> : null}
              {analysis.found.map(kw => (
                <span key={kw} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", padding: "4px 8px", borderRadius: "100px", border: "1px solid var(--rule)", background: "var(--bg)", color: "var(--muted)" }}>
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
