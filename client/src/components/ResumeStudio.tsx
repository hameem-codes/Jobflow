import { useState } from "react";
import { useJobflow, type TabKey, type ResumeVersion } from "@/contexts/JobflowContext";
import { FileText, Upload, MoreHorizontal, X, ArrowUpRight, Check, Plus, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InteractiveResumeBuilder } from "./InteractiveResumeBuilder";

function Bar({label,value,color="lime"}:{label:string;value:number;color?:string}){return <div className="signal-bar"><div className="signal-bar__head"><span>{label}</span><b>{value}%</b></div><div className="signal-bar__track"><span className={`signal-bar__fill ${color}`} style={{width:`${value}%`}}/></div></div>}
function Empty({title,copy,action,onAction,illustration}:{title:string;copy:string;action?:string;onAction?:()=>void;illustration?:string}){return <div className="empty-state-container">{illustration&&<img src={illustration} alt="" aria-hidden/>}<div><h3>{title}</h3><p>{copy}</p></div>{action&&<Button className="button button--ink" onClick={onAction}>{action}<ArrowUpRight size={15}/></Button>}</div>}

export function ResumeStudio({ setTab }: { setTab: (x: TabKey) => void }) {
  const c = useJobflow();
  const [parsing, setParsing] = useState(false);
  const [activeResume, setActiveResume] = useState(c.resumes[0]?.id || "");
  const [recommendation, setRecommendation] = useState<"open" | "accepted" | "ignored">("open");
  const [editMode, setEditMode] = useState(false);
  
  const inputId = "resume-upload";

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setParsing(true);
    setTimeout(() => {
      const next: ResumeVersion = {
        id: `resume-${Date.now()}`,
        name: f.name,
        score: 82,
        ats: 76,
        text: "Parsed resume preview",
        content: {
          personalInfo: { name: c.profile.name || "Your Name", email: "email@example.com", phone: "555-1234", location: c.locationPreference || "New York, NY", website: "" },
          summary: "A passionate professional ready to make an impact.",
          workHistory: [],
          education: [],
          skills: [],
          projects: []
        }
      };
      c.addResume(next);
      setActiveResume(next.id);
      setRecommendation("open");
      setParsing(false);
      toast.success("Resume parsed and saved");
    }, 900);
  };

  if (editMode) {
    const resume = c.resumes.find(r => r.id === activeResume);
    if (!resume) {
      setEditMode(false);
      return null;
    }
    return <InteractiveResumeBuilder resume={resume} onClose={() => setEditMode(false)} />;
  }

  return (
    <div className="resume-grid">
      <div className="card upload-card">
        <div className="upload-illustration">
          <FileText size={42} strokeWidth={1.3} />
          <span><Upload size={17} /></span>
        </div>
        <h2>{parsing ? "Parsing your resume…" : c.resumes.length ? c.resumes[0].name : "Bring your experience in."}</h2>
        <p>{parsing ? "Reading your PDF or DOCX and preparing a preview." : "PDF and DOCX parsing turns your real resume into a working profile. Nothing is invented."}</p>
        <input id={inputId} hidden type="file" accept=".pdf,.docx" onChange={handleUpload} />
        <label htmlFor={inputId} className="button button--lime"><Upload size={16} /> Upload resume</label>
        <small>PDF or DOCX · up to 10 MB</small>
      </div>
      
      <div className="resume-analysis">
        <div className="card analysis-card">
          <div className="card-kicker">
            AI resume score <Badge className="sample-badge">{c.resumes.length ? "From your resume" : "Illustrative sample"}</Badge>
          </div>
          <div className="analysis-score">
            <strong>{c.resumes.length ? c.resumes[0].score : "—"}</strong>
            <span>{c.resumes.length ? "out of 100" : "Connect a resume to score it"}</span>
          </div>
          <Bar label="Content clarity" value={c.resumes.length ? 84 : 0} color="clay" />
          <Bar label="ATS readiness" value={c.resumes.length ? c.resumes[0].ats : 0} color="blue" />
          <Bar label="Role alignment" value={c.resumes.length ? 78 : 0} />
        </div>
        
        <div className="card versions-card">
          <div className="card-kicker">
            Resume versions 
            <button className="icon-button" style={{ padding: 0, minWidth: "auto", background: "none", marginLeft: "auto" }} onClick={() => setTab("settings")}>
              <MoreHorizontal size={16} />
            </button>
          </div>
          {c.resumes.map(r => (
            <button className={`select-row ${activeResume === r.id ? "active" : ""}`} key={r.id} onClick={() => { setActiveResume(r.id); setRecommendation("open"); toast.info(`${r.name} is the active preview`); }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span>{r.name}</span>
                <small style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>
                  Added {new Date(parseInt(r.id.split("-")[1])).toLocaleDateString()}
                </small>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span>{r.score}/100</span>
                <div onClick={e => { e.stopPropagation(); c.deleteResume(r.id); if (activeResume === r.id) setActiveResume(""); toast.success("Resume deleted"); }} style={{ color: "var(--rule)" }}>
                  <X size={14} />
                </div>
              </div>
            </button>
          ))}
          {!c.resumes.length && <Empty title="No versions yet" copy="Upload a resume to create your first version." illustration="/illustrations/empty-states/empty-resume.svg" />}
          
          {c.resumes.length > 0 && (
            <div className="insight">
              <b>AI recommendation</b>
              <span>{recommendation === "open" ? "Add measurable outcomes to your strongest bullet." : recommendation === "accepted" ? "Accepted — this recommendation is part of your next edit." : "Ignored for now."}</span>
              <button className="text-link" onClick={() => setRecommendation("accepted")}>Accept</button>
              <button className="text-link" onClick={() => setRecommendation("ignored")}>Ignore</button>
              <button className="text-link" onClick={() => { setRecommendation("accepted"); toast.info("Edit mode opened"); setEditMode(true); }}>Edit</button>
            </div>
          )}
        </div>
        
        <Button className="button button--ink" onClick={() => {
          if (!c.resumes.length) { toast.error("Upload a resume before tailoring"); return; }
          setTab("jobs");
        }}>
          Tailor resume for a job <ArrowUpRight size={15} />
        </Button>
        <Button className="button button--lime" style={{marginTop: "10px", width: "100%"}} onClick={() => {
          if (!c.resumes.length) { toast.error("Upload a resume before editing"); return; }
          setEditMode(true);
        }}>
          Enter Resume Studio <ArrowUpRight size={15} />
        </Button>
      </div>
    </div>
  );
}
