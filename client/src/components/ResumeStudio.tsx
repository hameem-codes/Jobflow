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
  const [evaluating, setEvaluating] = useState(false);
  const [activeResume, setActiveResume] = useState(c.resumes[0]?.id || "");
  const [recommendation, setRecommendation] = useState<"open" | "accepted" | "ignored">("open");
  const [editMode, setEditMode] = useState(false);
  
  const inputId = "resume-upload";

  const handleEvaluate = async (resumeId: string) => {
    if (!resumeId) return;
    setEvaluating(true);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/evaluate`, {
        method: "POST",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Evaluation failed" }));
        toast.error(err.message || "Failed to evaluate resume");
        return;
      }

      const data = await res.json();
      if (data.insufficientData) {
        toast.info(data.message || "Resume has insufficient text to evaluate.");
        return;
      }

      c.updateResumeEvaluation(
        resumeId,
        {
          contentClarity: data.contentClarity,
          atsReadiness: data.atsReadiness,
          roleAlignment: data.roleAlignment,
          recommendation: data.recommendation,
        },
        data.contentClarity,
        data.atsReadiness
      );
      setRecommendation("open");
      toast.success("Resume evaluation complete!");
    } catch (err: any) {
      console.error("Evaluation error:", err);
      toast.error(err.message || "Network error during evaluation");
    } finally {
      setEvaluating(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // Reset input value so re-selecting the same file triggers onChange
    const inputElement = e.target;

    setParsing(true);
    const formData = new FormData();
    formData.append("file", f);

    try {
      const res = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Upload failed" }));
        toast.error(errorData.message || `Upload failed with status ${res.status}`);
        setParsing(false);
        inputElement.value = "";
        return;
      }

      const data = await res.json();
      if (!data?.resume) {
        toast.error("Invalid response from server");
        setParsing(false);
        inputElement.value = "";
        return;
      }

      const uploadedResume: ResumeVersion = {
        id: data.resume.id,
        name: data.resume.name,
        score: data.resume.score || 0,
        ats: data.resume.ats || 0,
        text: data.resume.text || "",
        content: data.resume.content || {
          personalInfo: {
            name: c.profile.name || "",
            email: c.profile.email || "",
            phone: "",
            location: c.locationPreference || "",
            website: "",
          },
          summary: "",
          workHistory: [],
          education: [],
          skills: [],
          projects: [],
        },
      };

      c.addUploadedResume(uploadedResume);
      setActiveResume(uploadedResume.id);
      setRecommendation("open");
      toast.success("Resume uploaded and parsed successfully!");

      // Auto-trigger evaluation right after successful upload
      handleEvaluate(uploadedResume.id);
    } catch (err: any) {
      console.error("Resume upload error:", err);
      toast.error(err.message || "Network error. Please try again.");
    } finally {
      setParsing(false);
      inputElement.value = "";
    }
  };

  if (editMode) {
    const resume = c.resumes.find(r => r.id === activeResume);
    if (!resume) {
      setEditMode(false);
      return null;
    }
    return <InteractiveResumeBuilder resume={resume} onClose={() => setEditMode(false)} />;
  }

  const currentResume = c.resumes.find(r => r.id === activeResume) || c.resumes[0];
  const evalData = currentResume?.evaluation || (currentResume?.content as any)?.evaluation;
  const hasEvaluation = Boolean(evalData && (evalData.contentClarity > 0 || evalData.atsReadiness > 0 || evalData.roleAlignment > 0));

  return (
    <div className="resume-grid">
      <div className="card upload-card">
        <div className="upload-illustration">
          <FileText size={42} strokeWidth={1.3} />
          <span><Upload size={17} /></span>
        </div>
        <h2>{parsing ? "Uploading & parsing resume…" : c.resumes.length ? c.resumes[0].name : "Bring your experience in."}</h2>
        <p>{parsing ? "Extracting text and saving to workspace." : "Upload your resume into your private workspace. Nothing is invented."}</p>
        <input id={inputId} hidden type="file" accept=".pdf,.docx,.txt,.md,.json" onChange={handleUpload} disabled={parsing} />
        <label htmlFor={inputId} className={`button button--lime ${parsing ? "opacity-50 pointer-events-none" : ""}`} style={{ pointerEvents: parsing ? "none" : "auto", opacity: parsing ? 0.6 : 1 }}>
          <Upload size={16} /> {parsing ? "Uploading..." : "Upload resume"}
        </label>
        <small>PDF, DOCX, TXT or JSON · up to 10 MB</small>
      </div>
      
      <div className="resume-analysis">
        <div className="card analysis-card">
          <div className="card-kicker" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Resume evaluation</span>
            {currentResume && (
              <button
                className="text-link"
                disabled={evaluating}
                onClick={() => handleEvaluate(currentResume.id)}
                style={{ fontSize: "11px", fontWeight: 600, cursor: evaluating ? "not-allowed" : "pointer" }}
              >
                {evaluating ? "Analyzing…" : hasEvaluation ? "Re-analyze" : "Analyze resume"}
              </button>
            )}
          </div>
          <div className="analysis-score">
            <strong>{evaluating ? "…" : hasEvaluation ? evalData.contentClarity : "—"}</strong>
            <span>
              {evaluating
                ? "Analyzing with AI…"
                : hasEvaluation
                ? "out of 100"
                : currentResume
                ? "Not yet analyzed"
                : "Connect a resume to score it"}
            </span>
          </div>
          <Bar label="Content clarity" value={hasEvaluation ? evalData.contentClarity : 0} color="clay" />
          <Bar label="ATS readiness" value={hasEvaluation ? evalData.atsReadiness : 0} color="blue" />
          <Bar label="Role alignment" value={hasEvaluation ? evalData.roleAlignment : 0} />
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
                  Active version
                </small>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span>{r.score > 0 ? `${r.score}/100` : "Unscored"}</span>
                <div onClick={e => { e.stopPropagation(); c.deleteResume(r.id); if (activeResume === r.id) setActiveResume(""); }} style={{ color: "var(--rule)" }}>
                  <X size={14} />
                </div>
              </div>
            </button>
          ))}
          {!c.resumes.length && <Empty title="No versions yet" copy="Upload a resume to create your first version." illustration="/illustrations/empty-states/empty-resume.svg" />}
          
          {currentResume && evalData?.recommendation ? (
            <div className="insight">
              <b>AI recommendation</b>
              <span>
                {recommendation === "open"
                  ? evalData.recommendation
                  : recommendation === "accepted"
                  ? "Accepted — this recommendation is part of your next edit."
                  : "Ignored for now."}
              </span>
              <button className="text-link" onClick={() => setRecommendation("accepted")}>Accept</button>
              <button className="text-link" onClick={() => setRecommendation("ignored")}>Ignore</button>
              <button className="text-link" onClick={() => { setRecommendation("accepted"); toast.info("Edit mode opened"); setEditMode(true); }}>Edit</button>
            </div>
          ) : currentResume ? (
            <div className="insight" style={{ color: "var(--muted)" }}>
              <span>Not yet analyzed. Click "Analyze resume" to generate a tailored recommendation based on your resume text.</span>
            </div>
          ) : null}
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
