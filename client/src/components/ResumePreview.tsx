import type { ResumeVersion } from "@/contexts/JobflowContext";

export function ResumePreview({ resume }: { resume: ResumeVersion }) {
  const content = resume.content;
  if (!content) {
    return (
      <div className="card letter-preview print-only-card" style={{ minHeight: "800px" }}>
        <div className="preview-top">
          <span>{resume.name}</span>
          <div>
            <button onClick={() => window.print()}>Print / Export PDF</button>
          </div>
        </div>
        <div className="letter-paper">
          <p>{resume.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card letter-preview print-only-card" style={{ minHeight: "800px", padding: 0 }}>
      <div className="preview-top hide-in-print" style={{ padding: "15px 20px" }}>
        <span>{resume.name}</span>
        <div>
          <button onClick={() => window.print()}>Print / Export PDF</button>
        </div>
      </div>
      <div className="letter-paper" style={{ padding: "40px", fontFamily: "var(--sans)" }}>
        
        {/* Personal Info */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h1 style={{ margin: "0 0 5px 0", fontSize: "24px" }}>{content.personalInfo.name}</h1>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", fontSize: "12px", color: "#555" }}>
            {content.personalInfo.email && <span>{content.personalInfo.email}</span>}
            {content.personalInfo.phone && <span>• {content.personalInfo.phone}</span>}
            {content.personalInfo.location && <span>• {content.personalInfo.location}</span>}
            {content.personalInfo.website && <span>• {content.personalInfo.website}</span>}
          </div>
        </div>

        {/* Summary */}
        {content.summary && (
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontSize: "13px", lineHeight: "1.5" }}>{content.summary}</p>
          </div>
        )}

        {/* Experience */}
        {content.workHistory.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ borderBottom: "1px solid #ddd", textTransform: "uppercase", fontSize: "12px", paddingBottom: "4px", marginBottom: "10px" }}>Experience</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {content.workHistory.map(exp => (
                <div key={exp.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <b style={{ fontSize: "14px" }}>{exp.company}</b>
                    <span style={{ fontSize: "12px", color: "#666" }}>{exp.startDate} - {exp.endDate}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                    <i style={{ fontSize: "13px", color: "#333" }}>{exp.role}</i>
                    <span style={{ fontSize: "12px", color: "#666" }}>{exp.location}</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", lineHeight: "1.5", color: "#333" }}>
                    {exp.bullets.map((b, i) => <li style={{ marginBottom: "4px" }} key={i}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {content.education.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ borderBottom: "1px solid #ddd", textTransform: "uppercase", fontSize: "12px", paddingBottom: "4px", marginBottom: "10px" }}>Education</h3>
            {content.education.map(edu => (
              <div key={edu.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <div>
                  <b style={{ fontSize: "13px", display: "block" }}>{edu.school}</b>
                  <span style={{ fontSize: "13px" }}>{edu.degree} in {edu.field}</span>
                </div>
                <span style={{ fontSize: "12px", color: "#666" }}>{edu.year}</span>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {content.skills.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ borderBottom: "1px solid #ddd", textTransform: "uppercase", fontSize: "12px", paddingBottom: "4px", marginBottom: "10px" }}>Skills</h3>
            <p style={{ fontSize: "13px", margin: 0 }}>{content.skills.join(" • ")}</p>
          </div>
        )}

        {/* Projects */}
        {content.projects.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ borderBottom: "1px solid #ddd", textTransform: "uppercase", fontSize: "12px", paddingBottom: "4px", marginBottom: "10px" }}>Projects</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {content.projects.map(proj => (
                <div key={proj.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <b style={{ fontSize: "14px" }}>{proj.name}</b>
                    {proj.link && <a href={proj.link} style={{ fontSize: "12px", color: "#0066cc" }}>{proj.link}</a>}
                  </div>
                  {proj.description && (
                    <p style={{ fontSize: "13px", color: "#333", margin: "4px 0 8px 0", lineHeight: "1.5" }}>{proj.description}</p>
                  )}
                  {proj.bullets.length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", lineHeight: "1.5", color: "#333" }}>
                      {proj.bullets.map((b, i) => <li style={{ marginBottom: "4px" }} key={i}>{b}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
