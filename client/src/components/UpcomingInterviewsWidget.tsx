import { useJobflow, type InterviewStage } from "@/contexts/JobflowContext";
import { CalendarClock, AlertCircle } from "lucide-react";

interface UpcomingInterview extends InterviewStage {
  company: string;
  role: string;
  daysUntil: number;
  appId: string;
}

function getUrgencyColor(daysUntil: number): string {
  if (daysUntil < 1) return "var(--red)"; // Red for today/tomorrow
  if (daysUntil <= 3) return "var(--clay)"; // Yellow/amber for within 3 days
  return "var(--lime)"; // Default lime for more than 3 days
}

function getUrgencyLabel(daysUntil: number): string {
  if (daysUntil < 1) return "Tomorrow";
  if (daysUntil === 1) return "In 1 day";
  if (daysUntil <= 3) return `In ${daysUntil} days`;
  return new Date(Date.now() + daysUntil * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

import { TabKey } from "@/contexts/JobflowContext";

export function UpcomingInterviewsWidget({ setTab, setLocation }: { setTab: (t: TabKey) => void; setLocation: (l: string) => void }) {
  const c = useJobflow();

  // Gather all interviews from all applications
  const allInterviews: UpcomingInterview[] = [];

  c.applications.forEach(app => {
    const job = c.jobs.find(j => j.id === app.jobId);
    if (job && app.interviews) {
      app.interviews.forEach(interview => {
        const interviewDate = new Date(interview.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const daysUntil = Math.ceil((interviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Only show upcoming interviews (within 60 days)
        if (daysUntil <= 60) {
          allInterviews.push({
            ...interview,
            company: job.company,
            role: job.role,
            daysUntil,
            appId: app.id
          });
        }
      });
    }
  });

  // Sort by date ascending
  const upcoming = allInterviews.sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="card">
      <div className="card-kicker">
        <CalendarClock size={15} style={{ marginRight: "6px" }} />
        Upcoming interviews
        {upcoming.length > 0 && <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--muted)" }}>{upcoming.length} scheduled</span>}
      </div>

      {upcoming.length === 0 ? (
        <div style={{ marginTop: "15px", fontSize: "12px", color: "var(--muted)" }}>
          <p>No interviews scheduled yet.</p>
          <p style={{ marginTop: "8px", fontSize: "11px" }}>Add an interview to an application to see it here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "15px" }}>
          {upcoming.slice(0, 5).map(interview => {
            const urgencyColor = getUrgencyColor(interview.daysUntil);
            const urgencyLabel = getUrgencyLabel(interview.daysUntil);
            const isUrgent = interview.daysUntil <= 3;

            return (
              <div
                key={interview.id}
                onClick={() => {
                  setTab("applications");
                  setLocation(`applications/${interview.appId}`);
                }}
                style={{
                  border: `1px solid ${urgencyColor}20`,
                  borderLeft: `3px solid ${urgencyColor}`,
                  padding: "12px",
                  borderRadius: "6px",
                  background: isUrgent ? `${urgencyColor}08` : "transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer"
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <b style={{ fontSize: "13px" }}>{interview.type}</b>
                    {isUrgent && <AlertCircle size={12} style={{ color: urgencyColor }} />}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                    {interview.role} · {interview.company}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                    {new Date(interview.date).toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                </div>
                <div
                  style={{
                    background: `${urgencyColor}20`,
                    color: urgencyColor,
                    padding: "6px 10px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap"
                  }}
                >
                  {urgencyLabel}
                </div>
              </div>
            );
          })}
          {upcoming.length > 5 && (
            <div style={{ fontSize: "12px", color: "var(--muted)", textAlign: "center", paddingTop: "8px" }}>
              +{upcoming.length - 5} more interviews
            </div>
          )}
        </div>
      )}
    </div>
  );
}
