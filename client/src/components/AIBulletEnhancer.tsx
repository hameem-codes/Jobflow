import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Activity, AlignLeft, Users } from "lucide-react";
import { toast } from "sonner";

export function AIBulletEnhancer({ 
  currentText, 
  onSave, 
  onClose,
  expId,
  bulletIndex
}: { 
  currentText: string; 
  onSave: (text: string) => void; 
  onClose: () => void;
  expId: string;
  bulletIndex: number;
}) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState(currentText);

  const enhance = (type: "metric" | "concise" | "leadership") => {
    setLoading(true);
    setTimeout(() => {
      let result = draft;
      if (type === "metric") {
        result = draft.replace(/Worked on|Developed/g, "Architected") + " resulting in a 24% increase in user engagement and $1.2M ARR growth.";
      } else if (type === "concise") {
        result = draft.split(" ").slice(0, 15).join(" ") + "...";
      } else if (type === "leadership") {
        result = "Led a cross-functional team of 6 to deliver " + draft.toLowerCase() + " ahead of schedule.";
      }
      setDraft(result);
      setLoading(false);
      toast.success("Bullet enhanced");
    }, 800);
  };

  return (
    <div className="mobile-backdrop" style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "500px", width: "100%", padding: "25px" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
          <div className="eyebrow" style={{ display: "flex", gap: "5px", alignItems: "center" }}><Sparkles size={14} color="var(--lime)" /> AI Bullet Enhancer</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={16} /></button>
        </div>
        
        <textarea 
          value={draft}
          onChange={e => setDraft(e.target.value)}
          style={{ width: "100%", minHeight: "100px", padding: "12px", borderRadius: "6px", border: "1px solid var(--rule)", background: "var(--bg)", color: "var(--ink)", fontSize: "14px", lineHeight: "1.5", marginBottom: "15px" }}
        />

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <Button className="button button--ink" style={{ flex: 1, fontSize: "12px", padding: "0 10px" }} onClick={() => enhance("metric")} disabled={loading}>
            <Activity size={14} /> Metric-Driven
          </Button>
          <Button className="button button--ink" style={{ flex: 1, fontSize: "12px", padding: "0 10px" }} onClick={() => enhance("concise")} disabled={loading}>
            <AlignLeft size={14} /> More Concise
          </Button>
          <Button className="button button--ink" style={{ flex: 1, fontSize: "12px", padding: "0 10px" }} onClick={() => enhance("leadership")} disabled={loading}>
            <Users size={14} /> Leadership
          </Button>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <Button className="button button--ink" onClick={onClose}>Cancel</Button>
          <Button className="button button--lime" onClick={() => onSave(draft)}>Save changes</Button>
        </div>
      </div>
    </div>
  );
}
