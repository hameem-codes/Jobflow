import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJobflow, type InterviewStage } from "@/contexts/JobflowContext";
import { Plus, CalendarClock, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function InterviewScheduler({ appId, interviews = [] }: { appId: string, interviews?: InterviewStage[] }) {
  const c = useJobflow();
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<InterviewStage["type"]>("Recruiter Screen");
  const [date, setDate] = useState("");

  const handleSave = () => {
    if (!date) return toast.error("Date is required");
    c.addApplicationInterview(appId, {
      type, date
    });
    setAdding(false);
    setDate("");
    toast.success("Interview stage scheduled");
  };

  return (
    <div style={{ marginTop: "20px", marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <small style={{ color: "var(--muted)", fontWeight: "bold" }}>Interview Schedule</small>
        {!adding && (
          <button className="text-link" onClick={() => setAdding(true)}>
            <Plus size={14} /> Add Round
          </button>
        )}
      </div>

      {adding && (
        <div style={{ border: "1px solid var(--rule)", padding: "10px", borderRadius: "8px", marginBottom: "15px", display: "grid", gap: "10px" }}>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" 
            value={type} 
            onChange={e => setType(e.target.value as any)}
          >
            <option>Recruiter Screen</option>
            <option>Hiring Manager 1:1</option>
            <option>Technical Assessment</option>
            <option>System Design</option>
            <option>Executive Final</option>
          </select>
          <Input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <Button variant="outline" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            <Button size="sm" className="button button--lime" onClick={handleSave}>Save</Button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {interviews.sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime()).map(int => (
          <div key={int.id} style={{ border: "1px solid var(--rule)", padding: "10px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <CalendarClock size={16} style={{ color: "var(--lime)" }} />
              <div>
                <b style={{ fontSize: "13px" }}>{int.type}</b>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>{new Date(int.date).toLocaleString()}</div>
              </div>
            </div>
            <button className="icon-button" style={{ color: "var(--muted)", padding: 0 }} onClick={() => {c.deleteApplicationInterview(appId, int.id); toast.success("Interview deleted")}}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {interviews.length === 0 && !adding && (
          <div style={{ fontSize: "12px", color: "var(--muted)" }}>No interviews scheduled.</div>
        )}
      </div>
    </div>
  );
}
