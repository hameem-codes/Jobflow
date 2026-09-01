import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleHelp,
  FileText,
  Gauge,
  Layers3,
  LayoutDashboard,
  Lightbulb,
  LockKeyhole,
  Menu,
  MoreHorizontal,
  PenLine,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CustomJobModal } from "@/components/CustomJobModal";
import { RecruiterContactCard } from "@/components/RecruiterContactCard";
import { InterviewScheduler } from "@/components/InterviewScheduler";
import { UpcomingInterviewsWidget } from "@/components/UpcomingInterviewsWidget";
import { ResumeStudio } from "@/components/ResumeStudio";
import { toast } from "sonner";
import {
  useJobflow,
  type TabKey,
  type Application,
} from "@/contexts/JobflowContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  Spotlight,
  CountUp,
  HeadlineStagger,
  Constellation,
  Annotation,
  fireSparks,
  sound,
  ThinkingDots,
  PageTransition,
} from "@/components/upgrade";

const mark = "/jobflow-mark.svg",
  desk = "/jobflow-editorial-desk.svg",
  pathArt = "/jobflow-career-path.svg";
const nav: { key: TabKey; label: string; icon: any; group?: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "copilot", label: "AI Copilot", icon: Sparkles },
  { key: "jobs", label: "Jobs", icon: BriefcaseBusiness, group: "Work" },
  { key: "applications", label: "Applications", icon: Layers3 },
  { key: "resume", label: "Resume", icon: FileText, group: "Materials" },
  { key: "cover", label: "Cover Letter", icon: PenLine },
  { key: "gaps", label: "Skill Gaps", icon: Target, group: "Improve" },
  { key: "match", label: "Job Match Detail", icon: Gauge },
  {
    key: "readiness",
    label: "Career Readiness",
    icon: TrendingUp,
    group: "Account",
  },
  { key: "settings", label: "Settings", icon: Settings },
];
const meta: Record<TabKey, { eyebrow: string; title: string; sub: string }> = {
  dashboard: {
    eyebrow: "Monday, August 31, 2026",
    title: "Your next move is already taking shape.",
    sub: "A clear view of the work that compounds into your next opportunity.",
  },
  copilot: {
    eyebrow: "AI career copilot",
    title: "Think it through, then make it real.",
    sub: "A private working session for sharper decisions and better applications.",
  },
  jobs: {
    eyebrow: "Opportunity desk",
    title: "Find the role that fits the whole picture.",
    sub: "Recommendations are illustrative until you connect a real job source.",
  },
  applications: {
    eyebrow: "Application tracker",
    title: "Keep every thread moving.",
    sub: "A calm pipeline for the moments that need a follow-up.",
  },
  resume: {
    eyebrow: "Resume studio",
    title: "Make your experience easy to find.",
    sub: "Upload your resume to unlock parsing, scoring, and tailored feedback.",
  },
  cover: {
    eyebrow: "Cover letter studio",
    title: "Put the right story in the room.",
    sub: "Generate an editable first draft from your real resume and target role.",
  },
  gaps: {
    eyebrow: "Skill intelligence",
    title: "Close the gap that keeps showing up.",
    sub: "Compare your current profile with the role you want next.",
  },
  match: {
    eyebrow: "Match explanation",
    title: "Know why the fit feels right.",
    sub: "A transparent breakdown of how a role aligns with your profile.",
  },
  readiness: {
    eyebrow: "Readiness review",
    title: "See the shape of your momentum.",
    sub: "A scorecard that turns career preparation into a focused practice.",
  },
  settings: {
    eyebrow: "Workspace settings",
    title: "Make Jobflow work like you do.",
    sub: "Your profile, preferences, and data controls live here.",
  },
};
function go(
  setLocation: (x: string) => void,
  setTab: (x: TabKey) => void,
  k: TabKey
) {
  setTab(k);
  setLocation(k === "dashboard" ? "/app" : `/${k}`);
}
function Dial({ score }: { score: number }) {
  return (
    <div className="score-dial">
      <svg viewBox="0 0 140 140">
        <circle className="dial-track" cx="70" cy="70" r="52" />
        <circle
          className="dial-value"
          cx="70"
          cy="70"
          r="52"
          style={{
            strokeDasharray: 327,
            strokeDashoffset: 327 - (score / 100) * 327,
          }}
        />
      </svg>
      <div className="dial-copy">
        <strong>
          <CountUp value={score} />
        </strong>
        <span>/ 100</span>
      </div>
    </div>
  );
}
function Bar({
  label,
  value,
  color = "lime",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="signal-bar">
      <div className="signal-bar__head">
        <span>{label}</span>
        <b>{value}%</b>
      </div>
      <div className="signal-bar__track">
        <span
          className={`signal-bar__fill ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
function Empty({
  title,
  copy,
  action,
  onAction,
  illustration,
}: {
  title: string;
  copy: string;
  action?: string;
  onAction?: () => void;
  illustration?: string;
}) {
  return (
    <div className="empty-state-container">
      {illustration && <img src={illustration} alt="" aria-hidden />}
      <div>
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
      {action && (
        <Button className="button button--ink" onClick={onAction}>
          {action}
          <ArrowUpRight size={15} />
        </Button>
      )}
    </div>
  );
}
function Dashboard({
  setTab,
  setLocation,
}: {
  setTab: (x: TabKey) => void;
  setLocation: (x: string) => void;
}) {
  const { applications, jobs, resumes, dismissedChecklist, dismissChecklist } =
    useJobflow();
  const [showChecklist, setShowChecklist] = useState(!dismissedChecklist);
  return (
    <>
      <section className="hero-grid">
        <Spotlight className="hero-copy">
          <div className="eyebrow">
            {meta.dashboard.eyebrow}
            <span className="live-dot" />
          </div>
          <HeadlineStagger>{meta.dashboard.title}</HeadlineStagger>
          <p>{meta.dashboard.sub}</p>
          <div className="hero-actions">
            <Button
              className="button button--lime"
              onClick={() =>
                go(setLocation, setTab, resumes.length ? "readiness" : "resume")
              }
            >
              {resumes.length ? "Review readiness" : "Upload your resume"}
              <ArrowUpRight size={16} />
            </Button>
            <button
              className="text-link"
              onClick={() => go(setLocation, setTab, "applications")}
            >
              Review weekly progress <ArrowUpRight size={14} />
            </button>
          </div>
        </Spotlight>
        <div className="hero-art parallax-slow">
          <img src={desk} alt="Editorial career planning desk" />
          <div className="hero-art__stamp">
            01
            <br />
            <span>signal / 26</span>
          </div>
        </div>
      </section>
      {showChecklist && (
        <div
          className="card"
          style={{ marginBottom: "15px", position: "relative" }}
        >
          <div className="card-kicker">
            Getting Started{" "}
            <button
              className="text-link"
              onClick={() => {
                setShowChecklist(false);
                dismissChecklist();
              }}
              style={{ marginLeft: "auto" }}
            >
              <X size={14} />
            </button>
          </div>
          <div style={{ display: "flex", gap: "20px", marginTop: "15px" }}>
            <label
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                fontSize: "12px",
              }}
            >
              <input type="checkbox" checked={resumes.length > 0} readOnly />{" "}
              Upload your first resume
            </label>
            <label
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                fontSize: "12px",
              }}
            >
              <input
                type="checkbox"
                checked={jobs.some(j => j.saved)}
                readOnly
              />{" "}
              Save a job
            </label>
          </div>
        </div>
      )}
      <div className="section-rule">
        <span>Readiness snapshot</span>
        <span>Updated from your entered profile</span>
      </div>
      <section className="dashboard-grid">
        <Spotlight className="card score-card">
          <div className="card-kicker">
            Career readiness score <CircleHelp size={14} />
          </div>
          <div className="score-layout">
            <Dial score={resumes.length ? 78 : 72} />
            <div>
              <div className="delta">
                <TrendingUp size={15} /> +8 this month
              </div>
              <h2>Good momentum.</h2>
              <p>
                {resumes.length
                  ? "Your resume is now part of the picture."
                  : "One focused improvement could move this score into the next band."}
              </p>
              <button
                className="arrow-button"
                onClick={() => go(setLocation, setTab, "readiness")}
              >
                See the breakdown <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
        </Spotlight>
        <div className="card application-summary">
          <div className="card-kicker">
            Application summary{" "}
            <button
              className="icon-button"
              style={{ padding: 0, minWidth: "auto", background: "none" }}
              onClick={() => go(setLocation, setTab, "applications")}
            >
              <MoreHorizontal size={17} />
            </button>
          </div>
          <div className="summary-number">
            <Annotation note="Real applications you have entered. No synthetic data.">
              <CountUp value={applications.length} />
            </Annotation>
          </div>
          <p>
            {applications.length
              ? "Tracked applications"
              : "No applications entered yet."}
          </p>
          <div className="summary-foot">
            <span>Real data only</span>
            <button
              className="mini-button"
              onClick={() => go(setLocation, setTab, "applications")}
            >
              <Plus size={14} /> Add application
            </button>
          </div>
        </div>
        <div className="card pipeline-card">
          <div className="card-kicker">
            Application pipeline <span className="muted">This quarter</span>
          </div>
          <div className="pipeline">
            {["Saved", "Applied", "Interview", "Offer"].map(s => (
              <div key={s}>
                <span>{s}</span>
                <b>{applications.filter(a => a.stage === s).length}</b>
              </div>
            ))}
          </div>
          <div className="pipeline-line">
            <span />
            <span />
            <span />
          </div>
          <p className="note">
            {applications.length
              ? "Your live pipeline, updated across Jobflow."
              : "Your pipeline is clear. Add a real application to begin tracking."}
          </p>
        </div>
      </section>
      <section className="lower-grid">
        <div className="card activity-card">
          <div className="card-kicker">
            Recent activity{" "}
            <button
              className="text-link"
              onClick={() => go(setLocation, setTab, "applications")}
            >
              View all <ArrowUpRight size={14} />
            </button>
          </div>
          <Empty
            title={
              applications.length
                ? "Your latest application is in the pipeline"
                : "Your activity will appear here"
            }
            copy={
              applications.length
                ? "Open Applications to review stages and follow-ups."
                : "Resume uploads, applications, and saved roles will build this timeline."
            }
            action={
              applications.length ? "Review applications" : "Add activity"
            }
            onAction={() =>
              go(
                setLocation,
                setTab,
                applications.length ? "applications" : "resume"
              )
            }
          />
        </div>
        <UpcomingInterviewsWidget setTab={setTab} setLocation={setLocation} />
        <div className="card insights-card">
          <div className="card-kicker">
            <span className="lime-mark">
              <Sparkles size={14} />
            </span>{" "}
            AI career insights{" "}
            <Badge className="sample-badge">Illustrative sample</Badge>
          </div>
          <div className="insight">
            <div className="insight-number">01</div>
            <div>
              <h3>Turn your strongest proof into a sharper story.</h3>
              <p>
                Once your resume is connected, Jobflow can identify the evidence
                worth carrying into your next application.
              </p>
            </div>
          </div>
          <button
            className="insight-link"
            onClick={() => go(setLocation, setTab, "copilot")}
          >
            Discuss with Copilot <ArrowUpRight size={15} />
          </button>
        </div>
      </section>
      <section className="card actions-card">
        <div className="card-kicker">
          Recommended actions{" "}
          <span className="muted">A short list, not a backlog</span>
        </div>
        <div className="action-list">
          {[
            [
              "Upload your resume",
              "Give Jobflow something real to work from.",
              "resume",
            ],
            [
              "Set a target role",
              "Make skill recommendations specific.",
              "gaps",
            ],
            [
              "Define your search",
              "Location, salary, and work style.",
              "settings",
            ],
          ].map(([a, b, k]) => (
            <button
              key={a}
              onClick={() => go(setLocation, setTab, k as TabKey)}
            >
              <span className="action-icon">
                <Target size={16} />
              </span>
              <span>
                <b>{a}</b>
                <small>{b}</small>
              </span>
              <ArrowUpRight size={16} />
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
function Copilot() {
  const c = useJobflow();
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const thread = c.threads.find(t => t.id === c.activeThread) || c.threads[0];
  const send = () => {
    if (!input.trim()) {
      toast.error("Type a question first.");
      return;
    }
    c.sendMessage(input.trim());
    setInput("");
    setThinking(true);
    setTimeout(() => setThinking(false), 900);
  };
  return (
    <div className="workspace-grid">
      <div className="card copilot-main">
        <div className="copilot-header">
          <div>
            <div className="eyebrow">
              Private workspace{" "}
              <span className="secure">
                <LockKeyhole size={12} /> Your data stays yours
              </span>
            </div>
            <h2>What are you working through?</h2>
          </div>
          <span className="lime-mark lime-mark--large dial-pulse">
            <Sparkles size={18} />
          </span>
        </div>
        <div className="conversation">
          <div className="copilot-welcome">
            <span className="avatar avatar--lime">
              <Sparkles size={18} />
            </span>
            <div>
              <b>Jobflow Copilot</b>
              {thread.messages.map((m, i) => (
                <p key={i} className={m.role === "user" ? "copilot-user" : ""}>
                  {m.text}
                </p>
              ))}
              {thinking && <ThinkingDots />}
            </div>
          </div>
          <div className="suggestion-row">
            {[
              "Position my experience",
              "Plan my week",
              "What skills should I build?",
            ].map(x => (
              <button key={x} onClick={() => setInput(x)}>
                {x}
                <ArrowUpRight size={14} />
              </button>
            ))}
          </div>
        </div>
        <div className="chat-input">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your next move..."
            onKeyDown={e => {
              if (e.key === "Enter") send();
            }}
          />
          <Button className="button button--ink" onClick={send}>
            <ArrowUpRight size={17} />
          </Button>
        </div>
      </div>
      <aside className="side-stack">
        <div className="card context-card">
          <div className="card-kicker">
            Active context <CircleHelp size={14} />
          </div>
          {(["resume", "job", "gaps"] as const).map(k => (
            <button
              className="select-row"
              key={k}
              onClick={() => c.toggleContext(k)}
            >
              <span>
                {k === "resume"
                  ? "Resume context"
                  : k === "job"
                    ? "Job context"
                    : "Skill gap context"}
              </span>
              <span
                className={
                  c.copilotContext[k]
                    ? "status-dot status-dot--lime"
                    : "status-dot"
                }
              />
            </button>
          ))}
        </div>
        <div className="card history-card">
          <div className="card-kicker">
            Conversation history{" "}
            <button
              className="text-link"
              onClick={() => {
                c.newThread();
                toast.success("New conversation started");
              }}
            >
              New chat <Plus size={14} />
            </button>
          </div>
          {c.threads.map(t => (
            <button
              className="select-row"
              key={t.id}
              onClick={() => c.setActiveThread(t.id)}
            >
              {t.title}
              <ArrowUpRight size={14} />
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
function Jobs({
  setTab,
  setLocation,
}: {
  setTab: (x: TabKey) => void;
  setLocation: (x: string) => void;
}) {
  const c = useJobflow();
  const [q, setQ] = useState(
    () => new URLSearchParams(window.location.search).get("search") || ""
  );
  const [remote, setRemote] = useState("All");
  const [exp, setExp] = useState("All");
  const [salary, setSalary] = useState("All");
  const [sort, setSort] = useState("Match");
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const filtered = c.jobs
    .filter(
      j =>
        (!q ||
          `${j.company} ${j.role} ${j.skills.join(" ")}`
            .toLowerCase()
            .includes(q.toLowerCase())) &&
        (remote === "All" || j.remote === remote) &&
        (exp === "All" || j.experience === exp) &&
        (salary === "All" || j.salary >= Number(salary))
    )
    .sort((a, b) =>
      sort === "Match"
        ? (b.id === "northstar" ? 92 : b.id === "archive" ? 84 : 76) -
          (a.id === "northstar" ? 92 : a.id === "archive" ? 84 : 76)
        : sort === "Salary"
          ? b.salary - a.salary
          : 0
    );
  if (compareMode) {
    return (
      <div className="compare-view" style={{ animation: "fadeIn 0.3s ease" }}>
        <div className="toolbar">
          <div>
            <h2>Compare Jobs</h2>
            <p>Side-by-side analysis of your selected roles.</p>
          </div>
          <button className="text-link" onClick={() => setCompareMode(false)}>
            <X size={15} /> Exit compare
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${selectedJobs.length}, 1fr)`,
            gap: "20px",
            marginTop: "20px",
          }}
        >
          {selectedJobs.map(id => {
            const j = c.jobs.find(x => x.id === id)!;
            return (
              <div className="card" key={id}>
                <h3>{j.role}</h3>
                <p>{j.company}</p>
                <hr
                  style={{
                    border: 0,
                    borderTop: "1px solid var(--rule)",
                    margin: "15px 0",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                  }}
                >
                  <div>
                    <small className="muted">Salary</small>
                    <br />${Math.round(j.salary / 1000)}k
                  </div>
                  <div>
                    <small className="muted">Location</small>
                    <br />
                    {j.place} ({j.remote})
                  </div>
                  <div>
                    <small className="muted">Experience</small>
                    <br />
                    {j.experience}
                  </div>
                  <div>
                    <small className="muted">Match</small>
                    <br />
                    <strong>
                      {j.id === "northstar" ? 92 : j.id === "archive" ? 84 : 76}
                      %
                    </strong>
                  </div>
                  <div>
                    <small className="muted">Skills</small>
                    <br />
                    <div className="tag-row" style={{ marginTop: "5px" }}>
                      {j.skills.map(s => (
                        <span key={s}>{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="filter-row">
        <CustomJobModal />
        <div className="search-field">
          <Search size={17} />
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search roles, skills, or companies"
          />
        </div>
        <select
          className="filter-button"
          value={remote}
          onChange={e => setRemote(e.target.value)}
        >
          <option>All</option>
          <option>Remote</option>
          <option>Hybrid</option>
          <option>On-site</option>
        </select>
        <select
          className="filter-button"
          value={exp}
          onChange={e => setExp(e.target.value)}
        >
          <option>All</option>
          <option>Entry</option>
          <option>Mid</option>
          <option>Senior</option>
        </select>
        <select
          className="filter-button"
          value={salary}
          onChange={e => setSalary(e.target.value)}
        >
          <option value="All">Salary</option>
          <option value="100000">$100k+</option>
          <option value="130000">$130k+</option>
          <option value="140000">$140k+</option>
        </select>
        <select
          className="filter-button"
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          <option value="Match">Sort: Match score</option>
          <option value="Salary">Sort: Salary</option>
        </select>
      </div>
      <div className="workspace-grid workspace-grid--jobs">
        <div>
          <div className="section-rule">
            <span>Recommended jobs</span>
            <Badge className="sample-badge">Illustrative sample</Badge>
          </div>
          <div className="job-list">
            {selectedJobs.length > 0 && (
              <div
                className="card-kicker"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                  paddingBottom: "15px",
                  borderBottom: "1px solid var(--rule)",
                }}
              >
                <span>{selectedJobs.length} selected</span>
                <Button
                  className="button button--lime"
                  onClick={() => setCompareMode(true)}
                >
                  Compare jobs
                </Button>
              </div>
            )}
            {filtered.map(j => (
              <div
                className={`job-row ${selectedJobs.includes(j.id) ? "active" : ""}`}
                key={j.id}
                onClick={() => {
                  c.setViewedJob(j.id);
                  go(setLocation, setTab, "match");
                }}
              >
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginRight: "5px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedJobs.includes(j.id)}
                    onChange={e => {
                      if (e.target.checked)
                        setSelectedJobs([...selectedJobs, j.id]);
                      else
                        setSelectedJobs(selectedJobs.filter(x => x !== j.id));
                    }}
                  />
                </div>
                <div
                  className={`company-mark ${j.id === "northstar" ? "lime" : j.id === "archive" ? "blue" : "clay"}`}
                >
                  {j.company[0]}
                </div>
                <div className="job-copy">
                  <span>{j.company}</span>
                  <b>{j.role}</b>
                  <small>
                    {j.place} · {j.remote} · ${Math.round(j.salary / 1000)}k
                  </small>
                </div>
                <div className="job-match">
                  <strong>
                    {j.id === "northstar" ? 92 : j.id === "archive" ? 84 : 76}%
                  </strong>
                  <span>match</span>
                </div>
                <button
                  aria-label={`Save ${j.role}`}
                  onClick={e => {
                    e.stopPropagation();
                    c.toggleSave(j.id);
                    toast.success(
                      !j.saved ? "Job saved" : "Job removed from Saved Jobs",
                      {
                        action: !j.saved
                          ? { label: "Undo", onClick: () => c.toggleSave(j.id) }
                          : undefined,
                      }
                    );
                    sound.stamp();
                  }}
                  className="text-link"
                >
                  {j.saved ? "Saved" : "Save"}
                </button>
                <button
                  aria-label={`Apply to ${j.role}`}
                  onClick={e => {
                    e.stopPropagation();
                    window.open(j.url, "_blank", "noopener,noreferrer");
                  }}
                  className="text-link"
                >
                  Apply
                </button>
                <ArrowUpRight size={17} />
              </div>
            ))}
            {!filtered.length && (
              <Empty
                title="No roles match those filters"
                copy="Try widening your search or salary range."
                action="Clear filters"
                onAction={() => {
                  setQ("");
                  setRemote("All");
                  setExp("All");
                  setSalary("All");
                }}
              />
            )}
          </div>
        </div>
        <aside className="card match-overview">
          <div className="card-kicker">
            Saved jobs <span>{c.jobs.filter(j => j.saved).length}</span>
          </div>
          <Dial score={84} />
          <h3>Matching gets clearer with context.</h3>
          <p>Choose a role to inspect the explainable match breakdown.</p>
          <Button
            className="button button--lime"
            onClick={() => go(setLocation, setTab, "match")}
          >
            Open match detail <ArrowUpRight size={15} />
          </Button>
        </aside>
      </div>
    </>
  );
}
function Applications({
  setTab,
  location,
}: {
  setTab: (x: TabKey) => void;
  location?: string;
}) {
  const c = useJobflow();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [pick, setPick] = useState(c.jobs[0]?.id || "");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (location && location.startsWith("applications/")) {
      const parts = location.split("/");
      if (parts.length > 1 && parts[1]) {
        setSelected(parts[1]);
        const app = c.applications.find(a => a.id === parts[1]);
        if (app) {
          c.setViewedJob(app.jobId);
        }
      }
    }
  }, [location, c]);

  const stages: [Application["stage"], string][] = [
    ["Saved", "Saved"],
    ["Applied", "Applied"],
    ["Interview", "Interview"],
    ["Offer", "Offer"],
  ];
  return (
    <>
      <div className="toolbar">
        <div>
          <div className="eyebrow">
            {c.applications.length} total applications
          </div>
          <h2>Pipeline view</h2>
        </div>
        <div>
          <button
            className="text-link"
            onClick={() => setView(view === "kanban" ? "list" : "kanban")}
          >
            {view === "kanban" ? "List view" : "Kanban view"}
          </button>
          <select
            className="filter-button"
            value={pick}
            onChange={e => setPick(e.target.value)}
          >
            {c.jobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.role}
              </option>
            ))}
          </select>
          <Button
            className="button button--ink"
            onClick={() => {
              if (c.applications.some(a => a.jobId === pick)) {
                toast.error("That job is already in your pipeline");
                return;
              }
              c.addApplication(pick);
              toast.success("Application added to Saved");
            }}
          >
            <Plus size={16} /> Add application
          </Button>
        </div>
      </div>
      {view === "kanban" ? (
        <div className="kanban">
          {stages.map(([stage]) => (
            <div
              className="kanban-column"
              key={stage}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                const id = e.dataTransfer.getData("application");
                if (id) {
                  c.moveApplication(id, stage);
                  toast.success(`Moved to ${stage}`);
                  if (stage === "Offer") {
                    fireSparks();
                    sound.sparkle();
                  }
                }
              }}
            >
              <div className="kanban-head">
                <span>{stage}</span>
                <b>{c.applications.filter(a => a.stage === stage).length}</b>
                <button
                  className="icon-button"
                  style={{
                    padding: 0,
                    minWidth: "auto",
                    background: "none",
                    marginLeft: "auto",
                  }}
                  onClick={() => {
                    setPick(c.jobs[0]?.id || "");
                    (
                      document.querySelector(
                        "select.filter-button"
                      ) as HTMLElement
                    )?.focus();
                  }}
                >
                  <MoreHorizontal size={15} />
                </button>
              </div>
              {c.applications
                .filter(a => a.stage === stage)
                .map(a => {
                  const j = c.jobs.find(x => x.id === a.jobId);
                  return (
                    <button
                      draggable
                      onDragStart={e =>
                        e.dataTransfer.setData("application", a.id)
                      }
                      onClick={() => {
                        c.setViewedJob(a.jobId);
                        setSelected(a.id);
                      }}
                      onKeyDown={e => {
                        const s = ["Saved", "Applied", "Interview", "Offer"];
                        const idx = s.indexOf(a.stage);
                        if (e.key === "ArrowRight" && idx < s.length - 1) {
                          e.preventDefault();
                          c.moveApplication(a.id, s[idx + 1] as any);
                          toast.success(`Moved to ${s[idx + 1]}`);
                          if (s[idx + 1] === "Offer") {
                            fireSparks();
                            sound.sparkle();
                          }
                        }
                        if (e.key === "ArrowLeft" && idx > 0) {
                          e.preventDefault();
                          c.moveApplication(a.id, s[idx - 1] as any);
                          toast.success(`Moved to ${s[idx - 1]}`);
                        }
                      }}
                      className="drop-card"
                      key={a.id}
                      aria-label={`${j?.role} at ${j?.company}. Use left and right arrows to move stage.`}
                    >
                      <b>{j?.role}</b>
                      <span>{j?.company}</span>
                    </button>
                  );
                })}
              {!c.applications.filter(a => a.stage === stage).length && (
                <div style={{ marginTop: "30px" }}>
                  <Empty
                    title={`No ${stage} applications`}
                    copy={`Drag applications here to track them.`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card job-list">
          {c.applications.map(a => {
            const j = c.jobs.find(x => x.id === a.jobId);
            return (
              <button
                className="job-row"
                key={a.id}
                onClick={() => {
                  c.setViewedJob(a.jobId);
                  setSelected(a.id);
                }}
              >
                <div className="job-copy">
                  <b>{j?.role}</b>
                  <small>
                    {j?.company} · {a.stage}
                  </small>
                </div>
                <ArrowUpRight size={16} />
              </button>
            );
          })}
          {!c.applications.length && (
            <Empty
              title="No applications yet"
              copy="Add your first application to begin tracking."
              action="Add application"
              onAction={() =>
                (
                  document.querySelector("select.filter-button") as HTMLElement
                )?.focus()
              }
            />
          )}
        </div>
      )}
      {selected && (
        <div className="card history-strip">
          <div className="card-kicker">
            Application detail{" "}
            <button className="text-link" onClick={() => setSelected(null)}>
              <X size={15} />
            </button>
          </div>
          {(() => {
            const a = c.applications.find(x => x.id === selected);
            if (!a) return null;
            return (
              <div className="settings-form">
                <label>
                  Follow-up date
                  <Input
                    type="date"
                    value={a.followUp}
                    onChange={e =>
                      c.updateApplication(a.id, { followUp: e.target.value })
                    }
                  />
                </label>
                <label>
                  Notes
                  <textarea
                    value={a.notes}
                    onChange={e =>
                      c.updateApplication(a.id, { notes: e.target.value })
                    }
                  />
                </label>
                <div style={{ marginBottom: "15px" }}>
                  <small
                    style={{
                      color: "var(--muted)",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Activity Log
                  </small>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                    }}
                  >
                    {(a.events || []).map(e => (
                      <div
                        key={e.id}
                        style={{
                          fontSize: "12px",
                          display: "flex",
                          gap: "10px",
                        }}
                      >
                        <span style={{ color: "var(--muted)" }}>
                          {new Date(e.date).toLocaleDateString()}
                        </span>
                        <span>{e.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <RecruiterContactCard appId={a.id} contacts={a.contacts} />
                <InterviewScheduler appId={a.id} interviews={a.interviews} />
                <Button
                  className="button button--lime"
                  onClick={() => {
                    toast.success("Application details saved");
                    setSelected(null);
                  }}
                >
                  <Check size={15} /> Save details
                </Button>
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}
// Resume component moved to ResumeStudio.tsx
function Cover() {
  const c = useJobflow();
  const [jobId, setJobId] = useState(c.jobs[0]?.id || "");
  const [resumeId, setResumeId] = useState(c.resumes[0]?.id || "");
  const [body, setBody] = useState("");
  const [saved, setSaved] = useState(false);
  const generate = () => {
    if (!jobId || !resumeId) {
      toast.error("Select both a job and resume");
      return;
    }
    const j = c.jobs.find(x => x.id === jobId),
      r = c.resumes.find(x => x.id === resumeId);
    const vars = [
      `Dear hiring team,\n\nI’m excited to apply for the ${j?.role} role at ${j?.company}. My experience and the strengths represented in ${r?.name} make this an opportunity worth exploring.\n\nI’d welcome the chance to discuss how I could contribute.\n\nBest,\nYour name`,
      `To the team at ${j?.company},\n\nI am writing to express my interest in the ${j?.role} position. The context provided in ${r?.name} aligns strongly with what you are looking for.\n\nI would love the opportunity to speak further about my background.\n\nSincerely,\nYour name`,
      `Hello,\n\nI'm submitting my application for the ${j?.role} opening at ${j?.company}. As shown in ${r?.name}, my background has prepared me to make an immediate impact on your team.\n\nThank you for considering my application.\n\nBest regards,\nYour name`,
    ];
    setBody(vars[Math.floor(Math.random() * vars.length)]);
    setSaved(false);
    toast.success("Illustrative draft generated");
  };
  return (
    <div className="cover-grid">
      <div className="card cover-form">
        <div className="card-kicker">
          Draft setup{" "}
          <span className="muted">Uses only connected information</span>
        </div>
        <select
          className="select-row"
          value={jobId}
          onChange={e => setJobId(e.target.value)}
        >
          <option value="">Select a job</option>
          {c.jobs.map(j => (
            <option value={j.id} key={j.id}>
              {j.role} · {j.company}
            </option>
          ))}
        </select>
        <select
          className="select-row"
          value={resumeId}
          onChange={e => setResumeId(e.target.value)}
        >
          <option value="">Select a resume</option>
          {c.resumes.map(r => (
            <option value={r.id} key={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <div className="cover-note">
          <Sparkles size={16} />
          <span>
            AI generation is illustrative until a real job and resume are
            selected.
          </span>
        </div>
        <Button className="button button--lime" onClick={generate}>
          <Sparkles size={16} /> {body ? "Regenerate" : "Generate draft"}
        </Button>
        {body && (
          <Button
            className="button button--ink"
            onClick={() => {
              navigator.clipboard?.writeText(body);
              toast.success("Letter copied");
            }}
          >
            Copy letter
          </Button>
        )}
      </div>
      <div className="card letter-preview print-only-card">
        <div className="preview-top">
          <span>{body ? "Draft cover letter" : "Untitled letter"}</span>
          <div>
            <button
              onClick={() => {
                window.print();
              }}
            >
              Print letter
            </button>
            <button
              onClick={() => {
                if (!body) return toast.error("Generate a letter first");
                const l = {
                  id: `letter-${Date.now()}`,
                  jobId,
                  resumeId,
                  title:
                    c.jobs.find(j => j.id === jobId)?.role || "Cover letter",
                  body,
                };
                c.saveLetter(l);
                setSaved(true);
                toast.success("Letter saved");
              }}
            >
              <Check size={15} /> {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
        <div className="letter-paper">
          <div className="paper-lines" />
          {body ? (
            <textarea value={body} onChange={e => setBody(e.target.value)} />
          ) : (
            <>
              <h3>Your story, in your own voice.</h3>
              <p>
                Connect a real role and resume to start an editable cover letter
                draft.
              </p>
            </>
          )}
          <div className="paper-sign">— Your name</div>
        </div>
        {c.letters.length > 0 && (
          <div className="card-kicker" style={{ marginTop: "30px" }}>
            Saved letters:{" "}
            {c.letters.map(l => (
              <button
                className="text-link"
                key={l.id}
                onClick={() => setBody(l.body)}
              >
                {l.title}
              </button>
            ))}
          </div>
        )}
        {c.letters.length === 0 && (
          <div style={{ marginTop: "30px" }}>
            <Empty
              title="No saved letters"
              copy="Generate and save a cover letter to see it here."
            />
          </div>
        )}
      </div>
    </div>
  );
}
function Gaps() {
  const c = useJobflow();
  const target = c.gapRole;
  const skills =
    target === "Product Designer"
      ? [
          "Research",
          "Prototyping",
          "Systems thinking",
          "Analytics",
          "Design ops",
        ]
      : target === "UX Researcher"
        ? [
            "Interviewing",
            "Synthesis",
            "Usability testing",
            "Statistics",
            "Stakeholder facilitation",
          ]
        : [
            "Roadmapping",
            "Planning",
            "Process design",
            "Analytics",
            "Change management",
          ];
  const matching = skills.slice(0, 3),
    missing = skills.slice(3);
  return (
    <div className="gaps-grid">
      <div className="card role-select">
        <div className="card-kicker">Target role</div>
        <select
          className="select-row"
          value={target}
          onChange={e => c.setTargetRole(e.target.value)}
        >
          <option>Product Designer</option>
          <option>UX Researcher</option>
          <option>Design Operations Lead</option>
        </select>
        <img src={pathArt} alt="Abstract career path" />
        <div className="img-caption">
          Gap logic updates from the selected role.
        </div>
      </div>
      <div className="card gap-analysis">
        <div className="card-kicker">
          Resume-to-job comparison{" "}
          <Badge className="sample-badge">Illustrative sample</Badge>
        </div>
        <div className="gap-stat">
          <strong>
            {Math.round((matching.length / skills.length) * 100)}%
          </strong>
          <span>skills matched</span>
        </div>
        <Constellation
          skills={skills.map(s => ({
            label: s,
            has: matching.includes(s),
            gap: missing.includes(s),
          }))}
        />
        <div className="gap-list">
          <div>
            <span className="status-dot status-dot--lime" />
            <b>Matching skills</b>
            <small>{matching.join(" · ")}</small>
          </div>
          <div>
            <span className="status-dot status-dot--clay" />
            <b>Important gaps</b>
            <small>{missing.join(" · ") || "None identified"}</small>
          </div>
          <div>
            <span className="status-dot status-dot--blue" />
            <b>Improvement plan</b>
            <small>
              {[...missing, "Practice an evidence-led story"].map(s => (
                <label key={s}>
                  <input
                    type="checkbox"
                    checked={c.gapDone.includes(s)}
                    onChange={() => c.toggleGap(s)}
                  />{" "}
                  {s}
                </label>
              ))}
            </small>
          </div>
        </div>
        <Button
          className="button button--ink"
          onClick={() => toast.success("Improvement plan updated")}
        >
          Save plan <Check size={15} />
        </Button>
      </div>
    </div>
  );
}
function Match({ setTab }: { setTab: (x: TabKey) => void }) {
  const c = useJobflow();
  const j = c.jobs.find(x => x.id === c.viewedJobId) || c.jobs[0];
  return (
    <div className="match-page">
      <Spotlight className="card match-hero">
        <div>
          <div className="card-kicker">{j.company} · Illustrative role</div>
          <h2>{j.role}</h2>
          <p>
            {j.place} · {j.remote} · ${Math.round(j.salary / 1000)}k
          </p>
          <Badge className="sample-badge">Illustrative sample</Badge>
        </div>
        <Dial score={84} />
      </Spotlight>
      <div className="match-columns">
        <div className="card breakdown">
          <div className="card-kicker">Explainable match reasoning</div>
          <Bar label="Skills match · 50%" value={88} />
          <Bar label="Experience fit · 20%" value={72} color="blue" />
          <Bar label="Location / remote · 15%" value={100} color="clay" />
          <Bar label="Salary alignment · 15%" value={64} color="blue" />
        </div>
        <div className="card skills-card">
          <div className="card-kicker">Skill signals</div>
          <h3>Matching skills</h3>
          <div className="tag-row">
            {j.skills.map(s => (
              <span key={s}>{s}</span>
            ))}
          </div>
          <h3 className="mt">Missing skills</h3>
          <div className="tag-row tag-row--muted">
            <span>Analytics</span>
            <span>Design ops</span>
          </div>
        </div>
      </div>
      <div className="card job-description">
        <div>
          <div className="card-kicker">Secondary actions</div>
          <p>Use the connected context to take the next action.</p>
        </div>
        <div>
          <Button
            className="button button--lime"
            onClick={() => setTab("cover")}
          >
            Generate cover letter <ArrowUpRight size={15} />
          </Button>
          <Button
            className="button button--ink"
            onClick={() => setTab("copilot")}
          >
            Discuss with Copilot <Sparkles size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}
function Readiness({ setTab }: { setTab: (x: TabKey) => void }) {
  const c = useJobflow();
  const historyData = [
    { name: "Jan", score: 65, apps: 2 },
    { name: "Feb", score: 68, apps: 5 },
    { name: "Mar", score: 71, apps: 8 },
    { name: "Apr", score: 74, apps: 12 },
    { name: "May", score: 78, apps: Math.max(12, c.applications.length) },
  ];
  return (
    <div className="readiness-grid">
      <Spotlight className="card readiness-score">
        <div className="card-kicker">
          Overall career score{" "}
          <Badge className="sample-badge">Illustrative sample</Badge>
        </div>
        <div className="readiness-main">
          <Dial score={c.resumes.length ? 78 : 72} />
          <div>
            <h2>Build the next 10 points.</h2>
            <p>
              Real sub-scores update from your resume, skills, applications, and
              matches.
            </p>
            <Button
              className="button button--lime"
              onClick={() => setTab("resume")}
            >
              Improve your resume <ArrowUpRight size={15} />
            </Button>
          </div>
        </div>
      </Spotlight>
      <div className="card score-breakdown">
        <div className="card-kicker">Scorecard</div>
        <Bar
          label="Resume score"
          value={c.resumes[0]?.score || 0}
          color="clay"
        />
        <Bar
          label="Skills score"
          value={c.resumes.length ? 72 : 0}
          color="blue"
        />
        <Bar label="Experience score" value={c.resumes.length ? 80 : 0} />
        <Bar
          label="Application score"
          value={Math.min(100, c.applications.length * 20)}
          color="blue"
        />
        <Bar
          label="Job match score"
          value={c.jobs.length ? 84 : 0}
          color="clay"
        />
      </div>
      <div className="card opportunity">
        <div className="card-kicker">
          <Lightbulb size={15} /> Biggest opportunity
        </div>
        <h3>Give your profile a point of view.</h3>
        <p>
          Target roles, proof points, and preferences make each recommendation
          more useful.
        </p>
        <button className="text-link" onClick={() => setTab("gaps")}>
          See recommended improvements <ArrowUpRight size={14} />
        </button>
      </div>
      <div className="card" style={{ gridColumn: "1 / -1", marginTop: "20px" }}>
        <div className="card-kicker">
          <TrendingUp size={15} /> Historical momentum{" "}
          <Badge className="sample-badge">Illustrative sample</Badge>
        </div>
        <div style={{ height: 250, marginTop: "20px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={historyData}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <XAxis
                dataKey="name"
                stroke="var(--muted)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[50, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--rule)",
                  borderRadius: "6px",
                  color: "var(--ink)",
                  fontFamily: "var(--sans)",
                }}
                itemStyle={{ color: "var(--ink)" }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--lime)"
                strokeWidth={2}
                dot={{ fill: "var(--lime)", r: 4 }}
                activeDot={{ r: 6 }}
                name="Readiness Score"
              ></Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
function SettingsPage() {
  const c = useJobflow();
  const tabs = [
    "Profile",
    "Career preferences",
    "AI controls",
    "Security & data",
  ];
  const [name, setName] = useState(c.profile.name),
    [title, setTitle] = useState(c.profile.title),
    [locationPreference, setLocationPreference] = useState(
      c.locationPreference
    );
  const { theme, toggleTheme } = useTheme();
  const [modal, setModal] = useState<"none" | "logout" | "delete">("none");
  return (
    <div className="settings-grid">
      <nav className="settings-nav">
        {tabs.map(t => (
          <button
            className={c.settingsTab === t ? "active" : ""}
            key={t}
            onClick={() => c.setSettingsTab(t)}
          >
            {t}
            <ArrowUpRight size={14} />
          </button>
        ))}
      </nav>
      <div className="card settings-form">
        <div className="card-kicker">{c.settingsTab}</div>
        {c.settingsTab === "Profile" && (
          <>
            <h2>What should we call you?</h2>
            <p>
              This is the information you choose to enter. Jobflow never fills
              in experience or skills on your behalf.
            </p>
            <label>
              Preferred name
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
              />
            </label>
            <label>
              Current title
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Add your current title"
              />
            </label>
            <Button
              className="button button--lime"
              onClick={() => {
                if (!name.trim()) {
                  toast.error("Add a preferred name");
                  return;
                }
                c.setProfile({ name, title });
                toast.success("Profile saved");
              }}
            >
              <Check size={15} /> Save changes
            </Button>
          </>
        )}
        {c.settingsTab === "Career preferences" && (
          <>
            <h2>Shape your search.</h2>
            <label>
              Target role
              <Input
                value={c.targetRole}
                onChange={e => c.setTargetRole(e.target.value)}
              />
            </label>
            <label>
              Location preference
              <Input
                value={locationPreference}
                onChange={e => setLocationPreference(e.target.value)}
                placeholder="Remote, city, or region"
              />
            </label>
            <Button
              className="button button--lime"
              onClick={() => {
                c.setPreferences({ locationPreference });
                toast.success("Career preferences saved");
              }}
            >
              <Check size={15} /> Save preferences
            </Button>
          </>
        )}
        {c.settingsTab === "AI controls" && (
          <>
            <h2>Keep the signal clear.</h2>
            <label>
              <input
                type="checkbox"
                checked={c.aiControls.showSamples}
                onChange={e =>
                  c.setAiControls({ showSamples: e.target.checked })
                }
              />{" "}
              Show illustrative sample labels
            </label>
            <label>
              <input
                type="checkbox"
                checked={c.aiControls.useResumeContext}
                onChange={e =>
                  c.setAiControls({ useResumeContext: e.target.checked })
                }
              />{" "}
              Use resume context when available
            </label>
            <h2 style={{ marginTop: "30px" }}>Sound</h2>
            <label>
              <input
                type="checkbox"
                checked={c.soundEnabled}
                onChange={e => {
                  c.setSoundEnabled(e.target.checked);
                  if (e.target.checked) sound.stamp();
                }}
              />{" "}
              Enable subtle paper-thunk sound effects
            </label>
            <h2 style={{ marginTop: "30px" }}>Visual theme</h2>
            <label>
              <input
                type="checkbox"
                checked={theme === "dark"}
                onChange={toggleTheme}
              />{" "}
              Dark mode active
            </label>
            <Button
              className="button button--lime"
              onClick={() => toast.success("AI controls saved")}
            >
              <Check size={15} /> Save controls
            </Button>
          </>
        )}
        {c.settingsTab === "Security & data" && (
          <>
            <h2>Your data, your call.</h2>
            <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
              <Button
                className="button button--ink"
                onClick={() => {
                  const data = {
                    profile: c.profile,
                    jobs: c.jobs.filter(x => x.saved),
                    applications: c.applications,
                    resumes: c.resumes,
                    letters: c.letters,
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: "application/json",
                  });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = "jobflow-export.json";
                  a.click();
                  toast.success("Export downloaded");
                }}
              >
                Export data
              </Button>
              <input
                type="file"
                id="import-data"
                hidden
                accept=".json"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = evt => {
                    try {
                      const d = JSON.parse(evt.target?.result as string);
                      localStorage.setItem(
                        "jobflow-state-v1",
                        JSON.stringify({ ...c, ...d })
                      );
                      window.location.reload();
                    } catch {
                      toast.error("Invalid data file");
                    }
                  };
                  r.readAsText(f);
                }}
              />
              <label
                htmlFor="import-data"
                className="button button--ink"
                style={{
                  cursor: "pointer",
                  margin: 0,
                  height: "38px",
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0 15px",
                }}
              >
                Import JSON
              </label>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <Button
                className="button button--ink"
                onClick={() => setModal("logout")}
              >
                Sign out session
              </Button>
              <Button
                className="button button--ink"
                onClick={() => setModal("delete")}
              >
                Delete account data
              </Button>
            </div>
          </>
        )}
      </div>
      {modal !== "none" && (
        <div
          className="mobile-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="card"
            style={{ maxWidth: "400px", width: "100%", padding: "30px" }}
          >
            <div className="eyebrow">
              {modal === "logout" ? "Sign out" : "Delete data"}
            </div>
            <h2
              style={{
                margin: "15px 0",
                fontFamily: "Fraunces",
                fontSize: "24px",
              }}
            >
              {modal === "logout"
                ? "Sign out of this session?"
                : "Delete all local data?"}
            </h2>
            <p
              style={{
                marginBottom: "25px",
                fontSize: "12px",
                color: "#72786e",
              }}
            >
              {modal === "logout"
                ? "You can always sign back in. Your local data remains intact."
                : "This cannot be undone. All resumes, applications, and settings will be permanently erased."}
            </p>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <Button
                className="button button--ink"
                onClick={() => setModal("none")}
              >
                Cancel
              </Button>
              <Button
                className="button button--lime"
                onClick={() => {
                  if (modal === "delete") {
                    c.resetData();
                    toast.success("Local data deleted");
                  } else {
                    localStorage.removeItem("jobflow-authenticated");
                    window.location.href = "/auth";
                  }
                  setModal("none");
                }}
              >
                {modal === "logout" ? "Sign out" : "Delete data"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function Content({
  tab,
  setTab,
  setLocation,
  isNavigating,
  location,
}: {
  tab: TabKey;
  setTab: (x: TabKey) => void;
  setLocation: (x: string) => void;
  isNavigating: boolean;
  location: string;
}) {
  return (
    <AnimatePresence mode="wait">
      {isNavigating ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="card"
          style={{
            minHeight: "600px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="spin">
            <CircleHelp size={24} color="var(--rule)" />
          </div>
        </motion.div>
      ) : (
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
        >
          {tab === "dashboard" && (
            <Dashboard setTab={setTab} setLocation={setLocation} />
          )}
          {tab === "copilot" && <Copilot />}
          {tab === "jobs" && <Jobs setTab={setTab} setLocation={setLocation} />}
          {tab === "applications" && (
            <Applications setTab={setTab} location={location} />
          )}
          {tab === "resume" && <ResumeStudio setTab={setTab} />}
          {tab === "cover" && <Cover />}
          {tab === "gaps" && <Gaps />}
          {tab === "match" && <Match setTab={setTab} />}
          {tab === "readiness" && <Readiness setTab={setTab} />}
          {tab === "settings" && <SettingsPage />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
export default function Home() {
  const [location, setLocation] = useLocation();
  const rawPath = location.split("?")[0].replace(/^\//, "");
  const basePath = rawPath.split("/")[0];
  const path = (basePath === "app" ? "dashboard" : basePath) as TabKey;
  const [tab, setTab] = useState<TabKey>(meta[path] ? path : "dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const c = useJobflow();
  useEffect(() => {
    const next = meta[path] ? path : "dashboard";
    if (tab !== next) {
      setIsNavigating(true);
      const timer = setTimeout(() => {
        setTab(next);
        setIsNavigating(false);
        setMobileOpen(false);
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setMobileOpen(false);
    }
  }, [path, tab]);
  useEffect(() => {
    let keys = "";
    const onKey = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      )
        return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const term = prompt("Search Jobflow");
        if (term?.trim()) {
          setLocation(`/jobs?search=${encodeURIComponent(term.trim())}`);
          setTab("jobs");
        }
      }
      if (e.key === "?") {
        e.preventDefault();
        setShowHelp(x => !x);
      }
      if (!e.metaKey && !e.ctrlKey) {
        keys += e.key.toLowerCase();
        if (keys.endsWith("gd")) {
          go(setLocation, setTab, "dashboard");
          keys = "";
        }
        if (keys.endsWith("gj")) {
          go(setLocation, setTab, "jobs");
          keys = "";
        }
        if (keys.endsWith("n")) {
          go(setLocation, setTab, "applications");
          (
            document.querySelector("select.filter-button") as HTMLElement
          )?.focus();
          keys = "";
        }
        if (keys.length > 5) keys = keys.slice(-5);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setLocation]);
  return (
    <div className="app-shell">
      {showHelp && (
        <div
          className="mobile-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowHelp(false)}
        >
          <div
            className="card"
            style={{ maxWidth: "400px", width: "100%", padding: "30px" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="eyebrow">Keyboard shortcuts</div>
            <h2
              style={{
                margin: "15px 0",
                fontFamily: "Fraunces",
                fontSize: "24px",
              }}
            >
              Navigate faster
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginBottom: "25px",
                fontSize: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Search jobs</span>
                <kbd>⌘ K</kbd>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Show shortcuts</span>
                <kbd>?</kbd>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Go to Dashboard</span>
                <kbd>g</kbd> <kbd>d</kbd>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Go to Jobs</span>
                <kbd>g</kbd> <kbd>j</kbd>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>New application</span>
                <kbd>n</kbd>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Move application</span>
                <div>
                  <kbd>←</kbd> <kbd>→</kbd>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                className="button button--ink"
                onClick={() => setShowHelp(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      <aside
        className={`sidebar ${mobileOpen ? "sidebar--open" : ""}`}
        onClick={e => {
          if (e.target === e.currentTarget) setMobileOpen(false);
        }}
      >
        <div className="brand">
          <img src={mark} alt="Jobflow mark" />
          <span>jobflow</span>
          <button className="mobile-close" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <div className="brand-caption">CAREER / OPERATING SYSTEM</div>
        <nav className="side-nav">
          {nav.map(n => {
            const I = n.icon;
            return (
              <div key={n.key}>
                {n.group && <div className="nav-group">{n.group}</div>}
                <button
                  className={tab === n.key ? "active" : ""}
                  onClick={() => {
                    setMobileOpen(false);
                    go(setLocation, setTab, n.key);
                  }}
                >
                  <I size={17} />
                  <span>{n.label}</span>
                </button>
              </div>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-prompt">
            <span className="lime-mark">
              <CircleHelp size={14} />
            </span>
            <p>
              Need a little direction?
              <br />
              <button onClick={() => go(setLocation, setTab, "copilot")}>
                Ask Copilot <ArrowUpRight size={13} />
              </button>
            </p>
          </div>
          <div className="user-mini">
            <span className="avatar">{c.profile.name?.[0] || "Y"}</span>
            <span>
              <b>{c.profile.name || "Your profile"}</b>
              <small>Personal workspace</small>
            </span>
            <button
              className="icon-button"
              style={{ padding: 0, minWidth: "auto", background: "none" }}
              onClick={() => go(setLocation, setTab, "settings")}
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </aside>
      {mobileOpen && (
        <div
          aria-label="Close navigation"
          className="mobile-backdrop"
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 19,
            background: "transparent",
          }}
        />
      )}
      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)}>
            <Menu size={21} />
          </button>
          <div className="breadcrumb">
            <span>Workspace</span>
            <span>/</span>
            <b>{nav.find(n => n.key === tab)?.label || "Dashboard"}</b>
          </div>
          <div className="top-actions">
            <button
              className="top-search"
              onClick={() => {
                const term = prompt("Search Jobflow");
                if (term?.trim()) {
                  setLocation(
                    `/jobs?search=${encodeURIComponent(term.trim())}`
                  );
                  setTab("jobs");
                }
              }}
            >
              <Search size={16} />
              <span>Search</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="icon-button"
              onClick={() => toast.info("No new notifications.")}
            >
              <Bell size={18} />
              <i />
            </button>
            <button
              className="profile-button"
              onClick={() => go(setLocation, setTab, "settings")}
            >
              <span className="avatar avatar--small">
                {c.profile.name?.[0] || "Y"}
              </span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">{meta[tab].eyebrow}</div>
              {tab !== "dashboard" && (
                <>
                  <h1 className="heading">{meta[tab].title}</h1>
                  <p>{meta[tab].sub}</p>
                </>
              )}
            </div>
            {tab === "dashboard" && (
              <div className="heading-note">
                <BookOpen size={16} />
                <span>
                  <b>Week 1</b> · Build your foundation
                </span>
              </div>
            )}
          </div>
          <Content
            tab={tab}
            location={location}
            isNavigating={isNavigating}
            setTab={k => {
              setTab(k);
              setLocation(k === "dashboard" ? "/app" : `/${k}`);
            }}
            setLocation={setLocation}
          />
        </div>
      </main>
    </div>
  );
}
