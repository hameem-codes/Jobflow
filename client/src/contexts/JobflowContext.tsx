/* Editorial Signal behavior layer: preserves the existing visual system while providing persisted, cross-tab product state. */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";


export type TabKey =
  | "dashboard"
  | "copilot"
  | "jobs"
  | "applications"
  | "resume"
  | "cover"
  | "gaps"
  | "match"
  | "readiness"
  | "settings"
  | "profile";

export type UserProfile = {
  name: string;
  email?: string;
  headline?: string | null;
  about?: string | null;
  location?: string | null;
  country?: string | null;
  phone?: string | null;
  targetRoles: string[];
  careerLevel?: string | null;
  targetIndustries: string[];
  employmentTypes: string[];
  internshipPreference: boolean;
  availability?: string | null;
  preferredLocations: string[];
  remotePreference: boolean;
  hybridPreference: boolean;
  onsitePreference: boolean;
  willingToRelocate: boolean;
  preferredCountries: string[];
  salaryExpectation?: number | null;
  workAuthorization?: string | null;
  sponsorshipRequired: boolean;
  skills: string[];
  languages: Array<{ language: string; proficiency: string }>;
  education: Array<{
    id: string;
    school: string;
    degree: string;
    field: string;
    year: string;
    gpa?: string;
  }>;
  experience: Array<{
    id: string;
    company: string;
    role: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    bullets?: string[];
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    issueDate?: string;
    url?: string;
  }>;
  courses: Array<{ id: string; name: string; provider: string }>;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    link?: string;
    bullets?: string[];
  }>;
  awards: Array<{ id: string; title: string; issuer?: string; date?: string }>;
  publications: Array<{ id: string; title: string; publisher?: string; url?: string; date?: string }>;
  volunteerExperience: Array<{ id: string; organization: string; role: string; bullets?: string[] }>;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  websiteUrl?: string | null;
  otherLinks: Array<{ label: string; url: string }>;
  strongestSkills: string[];
  skillsLearning: string[];
  skillsWantingToDevelop: string[];
  preferredRoles: string[];
  rolesWillingToConsider: string[];
  preferredIndustries: string[];
  companiesInterestedIn: string[];
  jobTypesToAvoid: string[];
};

export type ProfileCompleteness = {
  percentage: number;
  completedCategories: string[];
  missingItems: string[];
  breakdown: Record<string, number>;
};
export type Job = {
  id: string;
  company: string;
  role: string;
  place: string;
  remote: "Remote" | "Hybrid" | "On-site" | "All";
  experience: "Entry" | "Mid" | "Senior" | "All";
  salary: number;
  skills: string[];
  url: string;
  saved: boolean;
  custom?: boolean;
};
export type RecruiterContact = {
  id: string;
  name: string;
  title: string;
  email: string;
  linkedin: string;
  status: "Not contacted" | "Messaged" | "Replied" | "Coffee chat scheduled";
};
export type InterviewStage = {
  id: string;
  type:
    | "Recruiter Screen"
    | "Hiring Manager 1:1"
    | "Technical Assessment"
    | "System Design"
    | "Executive Final";
  date: string;
};
export type Application = {
  id: string;
  jobId: string;
  stage: "Saved" | "Applied" | "Interview" | "Offer";
  followUp: string;
  notes: string;
  events?: { id: string; date: string; text: string }[];
  contacts?: RecruiterContact[];
  interviews?: InterviewStage[];
};
export type WorkExperience = {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
};
export type Education = {
  id: string;
  school: string;
  degree: string;
  field: string;
  year: string;
};
export type Project = {
  id: string;
  name: string;
  description: string;
  link: string;
  bullets: string[];
};
export type StructuredResume = {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    website: string;
  };
  summary: string;
  workHistory: WorkExperience[];
  education: Education[];
  skills: string[];
  projects: Project[];
};
export type ResumeEvaluation = {
  contentClarity: number;
  atsReadiness: number;
  roleAlignment: number;
  recommendation: string;
  evaluatedAt?: string;
};
export type ResumeVersion = {
  id: string;
  name: string;
  score: number;
  ats: number;
  text: string;
  createdAt?: string;
  updatedAt?: string;
  content?: any;
  evaluation?: ResumeEvaluation;
};
export type Letter = {
  id: string;
  jobId: string;
  resumeId: string;
  title: string;
  body: string;
};
export type CopilotMessage = { role: "user" | "assistant"; text: string };

type State = {
  profile: { name: string; title: string; email?: string };
  fullProfile: UserProfile | null;
  profileCompleteness: ProfileCompleteness | null;
  profileLoading: boolean;
  locationPreference: string;
  aiControls: { showSamples: boolean; useResumeContext: boolean };
  targetRole: string;
  jobs: Job[];
  applications: Application[];
  resumes: ResumeVersion[];
  letters: Letter[];
  threads: { id: string; title: string; messages: CopilotMessage[] }[];
  activeThread: string;
  viewedJobId: string;
  copilotContext: { resume: boolean; job: boolean; gaps: boolean };
  gapRole: string;
  gapDone: string[];
  settingsTab: string;
  dismissedChecklist: boolean;
  soundEnabled: boolean;
};
const initial: State = {
  profile: { name: "", title: "" },
  fullProfile: null,
  profileCompleteness: null,
  profileLoading: false,
  locationPreference: "",
  aiControls: { showSamples: false, useResumeContext: true },
  targetRole: "",
  jobs: [],
  applications: [],
  resumes: [],
  letters: [],
  threads: [
    {
      id: "welcome",
      title: "First steps with Copilot",
      messages: [
        {
          role: "assistant",
          text: "Hello! I'm your Jobflow Copilot. I'm here to help you navigate your job search, practice interview questions, track applications, and improve your resume. How can I help you today?",
        },
      ],
    },
  ],
  activeThread: "welcome",
  viewedJobId: "",
  copilotContext: { resume: false, job: false, gaps: false },
  gapRole: "",
  gapDone: [],
  settingsTab: "Profile",
  dismissedChecklist: false,
  soundEnabled: false,
};

const UI_PREFS_KEY = "jobflow-ui-prefs-v1";
type UiPrefs = {
  settingsTab?: string;
  dismissedChecklist?: boolean;
  soundEnabled?: boolean;
  aiControls?: { showSamples: boolean; useResumeContext: boolean };
  gapDone?: string[];
};

function load(): State {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      if (localStorage.getItem("jobflow-state-v1")) {
        localStorage.removeItem("jobflow-state-v1");
      }
      const saved: UiPrefs = JSON.parse(localStorage.getItem(UI_PREFS_KEY) || "{}");
      return {
        ...initial,
        settingsTab: saved.settingsTab || initial.settingsTab,
        dismissedChecklist: saved.dismissedChecklist ?? initial.dismissedChecklist,
        soundEnabled: saved.soundEnabled ?? initial.soundEnabled,
        aiControls: { ...initial.aiControls, ...saved.aiControls },
        gapDone: saved.gapDone || initial.gapDone,
      };
    }
    return initial;
  } catch {
    return initial;
  }
}
type Ctx = State & {
  setProfile: (p: Partial<State["profile"]>) => void;
  updateFullProfile: (p: Partial<UserProfile>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  refreshCompleteness: () => Promise<void>;
  setPreferences: (p: { locationPreference?: string }) => void;
  setAiControls: (p: Partial<State["aiControls"]>) => void;
  setTargetRole: (r: string) => void;
  setViewedJob: (id: string) => void;
  newThread: () => void;
  toggleSave: (id: string) => void;
  addCustomJob: (j: Omit<Job, "id" | "saved">) => void;
  addApplication: (jobId: string) => void;
  moveApplication: (id: string, stage: Application["stage"]) => void;
  updateApplication: (id: string, p: Partial<Application>) => void;
  addApplicationContact: (
    appId: string,
    contact: Omit<RecruiterContact, "id">
  ) => void;
  updateApplicationContact: (
    appId: string,
    contactId: string,
    p: Partial<RecruiterContact>
  ) => void;
  deleteApplicationContact: (appId: string, contactId: string) => void;
  addApplicationInterview: (
    appId: string,
    interview: Omit<InterviewStage, "id">
  ) => void;
  deleteApplicationInterview: (appId: string, intId: string) => void;
  addResume: (r: ResumeVersion) => void;
  addUploadedResume: (r: ResumeVersion) => void;
  deleteResume: (id: string) => void;
  updateResumeEvaluation: (
    id: string,
    evaluation: ResumeEvaluation,
    score?: number,
    ats?: number
  ) => void;
  updateResumeContent: (id: string, p: Partial<StructuredResume>) => void;
  saveLetter: (l: Letter) => void;
  sendMessage: (text: string) => void;
  setActiveThread: (id: string) => void;
  toggleContext: (k: keyof State["copilotContext"]) => void;
  toggleGap: (s: string) => void;
  setSettingsTab: (s: string) => void;
  dismissChecklist: () => void;
  resetData: () => void;
  setSoundEnabled: (v: boolean) => void;
};
const JobflowContext = createContext<Ctx | null>(null);
export function JobflowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load);

  // Strictly persist UI preferences only — authoritative business data lives in backend
  useEffect(() => {
    try {
      const prefs: UiPrefs = {
        settingsTab: state.settingsTab,
        dismissedChecklist: state.dismissedChecklist,
        soundEnabled: state.soundEnabled,
        aiControls: state.aiControls,
        gapDone: state.gapDone,
      };
      localStorage.setItem(UI_PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.error("Failed to save UI preferences:", e);
    }
  }, [state.settingsTab, state.dismissedChecklist, state.soundEnabled, state.aiControls, state.gapDone]);

  // Sync business entities from backend on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then(async res => {
        if (!res.ok) {
          if (res.status === 401) return null;
          throw new Error(`Profile sync error (${res.status})`);
        }
        return res.json();
      })
      .then(data => {
        if (data?.user) {
          setState(s => ({
            ...s,
            profile: {
              name: data.user.name || "",
              title: data.user.title || "",
              email: data.user.email,
            },
            locationPreference: data.user.locationPreference || "",
            targetRole: data.user.targetRole || "",
            gapRole: data.user.targetRole || "",
          }));
        }
      })
      .catch(err => console.error("Failed to sync auth/me:", err));

    fetch("/api/profile")
      .then(async res => {
        if (!res.ok) {
          if (res.status === 401) return null;
          throw new Error(`Profile fetch error (${res.status})`);
        }
        return res.json();
      })
      .then(data => {
        if (data?.profile) {
          const prof = data.profile;
          setState(s => ({
            ...s,
            fullProfile: prof,
            profile: {
              name: prof.name || s.profile.name || "",
              title: prof.headline || s.profile.title || "",
              email: prof.email || s.profile.email,
            },
            locationPreference: prof.location || (prof.preferredLocations?.[0] ?? s.locationPreference),
            targetRole: prof.targetRoles?.[0] ?? s.targetRole,
            gapRole: prof.targetRoles?.[0] ?? s.gapRole,
          }));

          const primaryRole = prof.targetRoles?.[0] || prof.headline;
          if (primaryRole) {
            fetch(`/api/jobs/search?query=${encodeURIComponent(primaryRole)}`)
              .then(async r => {
                if (!r.ok) throw new Error(`Job search error (${r.status})`);
                return r.json();
              })
              .then(jobData => {
                if (jobData?.jobs) {
                  const mappedJobs = jobData.jobs.map((j: any) => ({
                    ...j,
                    place: j.location || j.place || "Unknown",
                  }));
                  setState(s => ({ ...s, jobs: mappedJobs }));
                }
              })
              .catch(err => console.error("Job search failed:", err));
          }
        }
      })
      .catch(err => console.error("Failed to sync profile:", err));

    fetch("/api/profile/completeness")
      .then(async r => (r.ok ? r.json() : null))
      .then(cData => {
        if (cData?.completeness) {
          setState(s => ({ ...s, profileCompleteness: cData.completeness }));
        }
      })
      .catch(err => console.error("Failed to sync profile completeness:", err));

    fetch("/api/applications")
      .then(async r => {
        if (!r.ok) {
          if (r.status === 401) return null;
          throw new Error(`Applications error (${r.status})`);
        }
        return r.json();
      })
      .then(data => {
        if (data?.applications) {
          setState(s => ({ ...s, applications: data.applications }));
        }
      })
      .catch(err => console.error("Failed to load applications:", err));

    fetch("/api/jobs")
      .then(async r => {
        if (!r.ok) {
          if (r.status === 401) return null;
          throw new Error(`Jobs error (${r.status})`);
        }
        return r.json();
      })
      .then(data => {
        if (data?.jobs) {
          setState(s => {
            const existingIds = new Set(s.jobs.map(j => j.id));
            const newJobs = data.jobs
              .filter((j: any) => !existingIds.has(j.id))
              .map((j: any) => ({ ...j, place: j.location || "Unknown" }));
            const merged = s.jobs.map(j => {
              const dbJob = data.jobs.find((dj: any) => dj.id === j.id);
              return dbJob ? { ...j, saved: dbJob.saved ?? j.saved } : j;
            });
            return { ...s, jobs: [...merged, ...newJobs] };
          });
        }
      })
      .catch(err => console.error("Failed to sync jobs:", err));

    fetch("/api/resumes")
      .then(async r => {
        if (!r.ok) {
          if (r.status === 401) return null;
          throw new Error(`Resumes error (${r.status})`);
        }
        return r.json();
      })
      .then(data => {
        if (data?.resumes) {
          const mappedResumes = data.resumes.map((r: any) => ({
            ...r,
            evaluation: r.content?.evaluation || r.evaluation,
          }));
          setState(s => ({
            ...s,
            resumes: mappedResumes,
            copilotContext: { ...s.copilotContext, resume: data.resumes.length > 0 },
          }));
        }
      })
      .catch(err => console.error("Failed to load resumes:", err));

    fetch("/api/letters")
      .then(async r => {
        if (!r.ok) {
          if (r.status === 401) return null;
          throw new Error(`Letters error (${r.status})`);
        }
        return r.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setState(s => ({ ...s, letters: data }));
        }
      })
      .catch(err => console.error("Failed to load letters:", err));
  }, []);
  const api = useMemo<Ctx>(
    () => ({
      ...state,
      setProfile: p => {
        setState(s => ({ ...s, profile: { ...s.profile, ...p } }));
        fetch("/api/auth/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) }).catch(console.error);
      },
      updateFullProfile: async (p: Partial<UserProfile>) => {
        try {
          setState(s => ({
            ...s,
            fullProfile: s.fullProfile ? { ...s.fullProfile, ...p } : (p as any),
            profile: {
              ...s.profile,
              ...(p.name !== undefined ? { name: p.name } : {}),
              ...(p.headline !== undefined ? { title: p.headline || "" } : {}),
            },
            ...(p.targetRoles && p.targetRoles.length > 0 ? { targetRole: p.targetRoles[0], gapRole: p.targetRoles[0] } : {}),
            ...(p.location !== undefined ? { locationPreference: p.location || "" } : {}),
          }));

          const res = await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(p),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData?.error?.message || `Failed to update profile (${res.status})`);
          }

          const data = await res.json();
          if (data?.profile) {
            setState(s => ({
              ...s,
              fullProfile: data.profile,
            }));
          }

          // Refresh completeness
          fetch("/api/profile/completeness")
            .then(r => (r.ok ? r.json() : null))
            .then(cData => {
              if (cData?.completeness) {
                setState(s => ({ ...s, profileCompleteness: cData.completeness }));
              }
            })
            .catch(() => {});

          // Refresh jobs if search criteria changed
          if (p.targetRoles || p.preferredLocations || p.remotePreference !== undefined) {
            const queryRole = p.targetRoles?.[0] || state.targetRole;
            if (queryRole) {
              fetch(`/api/jobs/search?query=${encodeURIComponent(queryRole)}`)
                .then(r => (r.ok ? r.json() : null))
                .then(jData => {
                  if (jData?.jobs) {
                    const mappedJobs = jData.jobs.map((j: any) => ({
                      ...j,
                      place: j.location || j.place || "Unknown",
                    }));
                    setState(s => ({ ...s, jobs: mappedJobs }));
                  }
                })
                .catch(() => {});
            }
          }

          return true;
        } catch (err: any) {
          console.error("Error updating profile:", err);
          toast.error(err.message || "Failed to update profile");
          return false;
        }
      },
      refreshProfile: async () => {
        try {
          const res = await fetch("/api/profile");
          if (res.ok) {
            const data = await res.json();
            if (data?.profile) {
              setState(s => ({ ...s, fullProfile: data.profile }));
            }
          }
        } catch (err) {
          console.error("Failed to refresh profile:", err);
        }
      },
      refreshCompleteness: async () => {
        try {
          const res = await fetch("/api/profile/completeness");
          if (res.ok) {
            const data = await res.json();
            if (data?.completeness) {
              setState(s => ({ ...s, profileCompleteness: data.completeness }));
            }
          }
        } catch (err) {
          console.error("Failed to refresh completeness:", err);
        }
      },
      setPreferences: p => {
        setState(s => ({ ...s, ...p }));
        fetch("/api/auth/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) }).catch(console.error);
      },
      setAiControls: p =>
        setState(s => ({ ...s, aiControls: { ...s.aiControls, ...p } })),
      setTargetRole: r => {
        setState(s => ({ ...s, targetRole: r, gapRole: r }));
        fetch("/api/auth/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetRole: r }) }).catch(console.error);
        fetch(`/api/jobs/search?query=${encodeURIComponent(r)}`)
            .then(res => res.json())
            .then(jobData => {
               if (jobData.jobs) {
                 const mappedJobs = jobData.jobs.map((j: any) => ({ ...j, place: j.location || j.place || "Unknown" }));
                 setState(s => ({...s, jobs: mappedJobs}));
               }
            }).catch(console.error);
      },
      setViewedJob: id => setState(s => ({ ...s, viewedJobId: id })),
      newThread: () =>
        setState(s => {
          const id = `thread-${Date.now()}`;
          return {
            ...s,
            activeThread: id,
            threads: [
              ...s.threads,
              {
                id,
                title: "New career conversation",
                messages: [
                  {
                    role: "assistant",
                    text: "New conversation started. Ask about your next move.",
                  },
                ],
              },
            ],
          };
        }),
      toggleSave: id => {
        let nextSaved = true;
        setState(s => {
          const target = s.jobs.find(j => j.id === id);
          nextSaved = target ? !target.saved : true;
          return {
            ...s,
            jobs: s.jobs.map(j => (j.id === id ? { ...j, saved: nextSaved } : j)),
          };
        });

        fetch(`/api/jobs/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ saved: nextSaved }),
        }).catch(err => {
          console.error("Failed to persist job save state:", err);
          setState(s => ({
            ...s,
            jobs: s.jobs.map(j => (j.id === id ? { ...j, saved: !nextSaved } : j)),
          }));
        });
      },
      addCustomJob: j => {
        fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(j),
        })
          .then(async res => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({ message: "Failed to add job" }));
              throw new Error(err.message || `Error ${res.status}`);
            }
            return res.json();
          })
          .then(newJob => {
            setState(s => ({
              ...s,
              jobs: [newJob, ...s.jobs],
            }));
            toast.success("Custom role added to workspace");
          })
          .catch(err => {
            console.error("Failed to add custom job:", err);
            toast.error(err.message || "Failed to add custom job");
          });
      },
      addApplication: jobId => {
        if (state.applications.some(a => a.jobId === jobId)) {
          toast.info("Role already in your applications pipeline");
          return;
        }
        fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        })
          .then(async res => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({ message: "Failed to add application" }));
              throw new Error(err.message || `Error ${res.status}`);
            }
            return res.json();
          })
          .then(data => {
            if (data.id) {
              setState(s => ({
                ...s,
                applications: [
                  ...s.applications,
                  {
                    id: data.id,
                    jobId,
                    stage: "Saved",
                    followUp: "",
                    notes: "",
                    events: [
                      {
                        id: `evt-${Date.now()}`,
                        date: new Date().toISOString(),
                        text: "Added to pipeline",
                      },
                    ],
                  },
                ],
              }));
              toast.success("Application added to pipeline");
            }
          })
          .catch(err => {
            console.error("Failed to add application:", err);
            toast.error(err.message || "Failed to add application");
          });
      },
      moveApplication: (id, stage) => {
        const prevApps = state.applications;
        setState(s => ({
          ...s,
          applications: s.applications.map(a =>
            a.id === id
              ? {
                  ...a,
                  stage,
                  events: [
                    ...(a.events || []),
                    {
                      id: `evt-${Date.now()}`,
                      date: new Date().toISOString(),
                      text: `Moved to ${stage}`,
                    },
                  ],
                }
              : a
          ),
        }));
        fetch(`/api/applications/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage }),
        })
          .then(async res => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({ message: "Failed to update stage" }));
              throw new Error(err.message || `Error ${res.status}`);
            }
          })
          .catch(err => {
            console.error("Failed to move application:", err);
            toast.error(err.message || "Failed to update stage");
            setState(s => ({ ...s, applications: prevApps }));
          });
      },
      updateApplication: (id, p) => {
        const prevApps = state.applications;
        setState(s => ({
          ...s,
          applications: s.applications.map(a =>
            a.id === id ? { ...a, ...p } : a
          ),
        }));
        fetch(`/api/applications/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p),
        })
          .then(async res => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({ message: "Failed to update application" }));
              throw new Error(err.message || `Error ${res.status}`);
            }
          })
          .catch(err => {
            console.error("Failed to update application:", err);
            toast.error(err.message || "Failed to update application");
            setState(s => ({ ...s, applications: prevApps }));
          });
      },
      addApplicationContact: (appId, contact) => {
        fetch(`/api/applications/${appId}/contacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contact),
        })
          .then(async res => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({ message: "Failed to add contact" }));
              throw new Error(err.message || `Error ${res.status}`);
            }
            return res.json();
          })
          .then(data => {
            if (data.id) {
              setState(s => ({
                ...s,
                applications: s.applications.map(a =>
                  a.id === appId
                    ? {
                        ...a,
                        contacts: [
                          ...(a.contacts || []),
                          { ...contact, id: data.id },
                        ],
                      }
                    : a
                ),
              }));
              toast.success("Contact saved");
            }
          })
          .catch(err => {
            console.error("Failed to add contact:", err);
            toast.error(err.message || "Failed to add contact");
          });
      },
      updateApplicationContact: (appId, contactId, p) => {
        fetch(`/api/applications/${appId}/contacts/${contactId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p),
        })
          .then(async res => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({ message: "Failed to update contact" }));
              throw new Error(err.message || `Error ${res.status}`);
            }
            setState(s => ({
              ...s,
              applications: s.applications.map(a =>
                a.id === appId
                  ? {
                      ...a,
                      contacts: (a.contacts || []).map(c =>
                        c.id === contactId ? { ...c, ...p } : c
                      ),
                    }
                  : a
              ),
            }));
            toast.success("Contact updated");
          })
          .catch(err => {
            console.error("Failed to update contact:", err);
            toast.error(err.message || "Failed to update contact");
          });
      },
      deleteApplicationContact: (appId, contactId) => {
        fetch(`/api/applications/${appId}/contacts/${contactId}`, {
          method: "DELETE",
        })
          .then(async res => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({ message: "Failed to delete contact" }));
              throw new Error(err.message || `Error ${res.status}`);
            }
            setState(s => ({
              ...s,
              applications: s.applications.map(a =>
                a.id === appId
                  ? {
                      ...a,
                      contacts: (a.contacts || []).filter(c => c.id !== contactId),
                    }
                  : a
              ),
            }));
            toast.success("Contact removed");
          })
          .catch(err => {
            console.error("Failed to delete contact:", err);
            toast.error(err.message || "Failed to delete contact");
          });
      },
      addApplicationInterview: (appId, interview) => {
        fetch(`/api/applications/${appId}/interviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(interview),
        })
          .then(async res => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({ message: "Failed to add interview" }));
              throw new Error(err.message || `Error ${res.status}`);
            }
            return res.json();
          })
          .then(data => {
            if (data.id) {
              setState(s => ({
                ...s,
                applications: s.applications.map(a =>
                  a.id === appId
                    ? {
                        ...a,
                        interviews: [
                          ...(a.interviews || []),
                          { ...interview, id: data.id },
                        ],
                      }
                    : a
                ),
              }));
              toast.success("Interview scheduled");
            }
          })
          .catch(err => {
            console.error("Failed to add interview:", err);
            toast.error(err.message || "Failed to add interview");
          });
      },
      deleteApplicationInterview: (appId, intId) => {
        fetch(`/api/applications/${appId}/interviews/${intId}`, {
          method: "DELETE",
        })
          .then(async res => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({ message: "Failed to delete interview" }));
              throw new Error(err.message || `Error ${res.status}`);
            }
            setState(s => ({
              ...s,
              applications: s.applications.map(a =>
                a.id === appId
                  ? {
                      ...a,
                      interviews: (a.interviews || []).filter(i => i.id !== intId),
                    }
                  : a
              ),
            }));
            toast.success("Interview removed");
          })
          .catch(err => {
            console.error("Failed to delete interview:", err);
            toast.error(err.message || "Failed to delete interview");
          });
      },
      addUploadedResume: r => {
        setState(s => ({
          ...s,
          resumes: [r, ...s.resumes.filter(x => x.id !== r.id)],
          copilotContext: { ...s.copilotContext, resume: true },
        }));
      },
      addResume: r => {
        fetch("/api/resumes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(r),
        })
          .then(async res => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({ message: "Failed to save resume" }));
              throw new Error(err.message || `Error ${res.status}`);
            }
            return res.json();
          })
          .then(data => {
            const savedResume = { ...r, id: data.id || r.id };
            setState(s => ({
              ...s,
              resumes: [...s.resumes, savedResume],
              copilotContext: { ...s.copilotContext, resume: true },
            }));
            toast.success("Resume saved to workspace");
          })
          .catch(err => {
            console.error("Failed to save resume:", err);
            toast.error(err.message || "Failed to save resume");
          });
      },
      deleteResume: id => {
        fetch(`/api/resumes/${id}`, {
          method: "DELETE",
        })
          .then(async res => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({ message: "Failed to delete resume" }));
              throw new Error(err.message || `Error ${res.status}`);
            }
            setState(s => ({
              ...s,
              resumes: s.resumes.filter(r => r.id !== id),
            }));
            toast.success("Resume deleted");
          })
          .catch(err => {
            console.error("Failed to delete resume:", err);
            toast.error(err.message || "Failed to delete resume");
          });
      },
      updateResumeEvaluation: (id, evaluation, score, ats) => {
        setState(s => ({
          ...s,
          resumes: s.resumes.map(r =>
            r.id === id
              ? {
                  ...r,
                  score: score !== undefined ? score : r.score,
                  ats: ats !== undefined ? ats : r.ats,
                  evaluation,
                  content: {
                    ...(typeof r.content === "object" && r.content !== null ? r.content : {}),
                    evaluation,
                  },
                }
              : r
          ),
        }));
      },
      updateResumeContent: (id, p) => {
        const mergedContent = state.resumes.find(r => r.id === id)?.content;
        const newContent = { ...mergedContent, ...p } as StructuredResume;
        fetch(`/api/resumes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newContent }),
        })
          .then(async res => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({ message: "Failed to update resume" }));
              throw new Error(err.message || `Error ${res.status}`);
            }
            setState(s => ({
              ...s,
              resumes: s.resumes.map(r =>
                r.id === id ? { ...r, content: newContent } : r
              ),
            }));
            toast.success("Resume updated");
          })
          .catch(err => {
            console.error("Failed to update resume:", err);
            toast.error(err.message || "Failed to update resume");
          });
      },
      saveLetter: l => {
        const isExisting = state.letters.some(x => x.id === l.id);
        const endpoint = isExisting && !l.id.startsWith("letter_tmp")
          ? `/api/letters/${l.id}`
          : "/api/letters";
        const method = isExisting && !l.id.startsWith("letter_tmp") ? "PUT" : "POST";

        fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(l),
        })
          .then(async res => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({ message: "Failed to save letter" }));
              throw new Error(err.message || `Error ${res.status}`);
            }
            return res.json();
          })
          .then(data => {
            const finalId = data.id || l.id;
            setState(s => ({
              ...s,
              letters: [...s.letters.filter(x => x.id !== l.id && x.id !== finalId), { ...l, id: finalId }],
            }));
            toast.success("Cover letter saved");
          })
          .catch(err => {
            console.error("Failed to save letter:", err);
            toast.error(err.message || "Failed to save cover letter");
          });
      },
      sendMessage: async (text) => {
        const activeT = state.threads.find(x => x.id === state.activeThread) || state.threads[0];
        // Only use specific modes if thread title explicitly indicates a specialized workflow, otherwise general
        const mode = activeT.title.toLowerCase().includes("resume review") ? "resume_feedback" :
                     activeT.title.toLowerCase().includes("interview prep") ? "interview_prep" : "general";

        // Prepare sanitized sliding window of recent conversation history (excluding current placeholder)
        const history = (activeT.messages || [])
          .filter(m => m.text && m.text.trim().length > 0 && !m.text.startsWith("Error:"))
          .slice(-8)
          .map(m => ({
            role: m.role as "user" | "assistant",
            content: m.text,
          }));

        setState(s => {
          const t = s.threads.find(x => x.id === s.activeThread) || s.threads[0];
          return {
            ...s,
            threads: s.threads.map(x =>
              x.id === t.id
                ? {
                    ...x,
                    messages: [
                      ...x.messages,
                      { role: "user", text },
                      { role: "assistant", text: "" }, // Placeholder for stream
                    ],
                  }
                : x
            ),
          };
        });

        try {
          const res = await fetch("/api/copilot/chat", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({
               message: text,
               history,
               mode,
               jobId: state.viewedJobId || undefined,
             })
          });
          if (!res.ok) {
            let errorMsg = "";
            try {
              const errJson = await res.json();
              errorMsg = errJson?.error?.message || errJson?.message || "";
            } catch {
              // Response wasn't JSON
            }

            if (res.status === 401) {
              throw new Error(errorMsg || "You need to sign in to use Copilot.");
            } else if (res.status === 403) {
              throw new Error(errorMsg || "Security validation failed. Please refresh and try again.");
            } else if (res.status === 429) {
              throw new Error(errorMsg || "You've reached the Copilot rate limit. Please try again after the retry period.");
            } else if (res.status === 400) {
              throw new Error(errorMsg || "Invalid request. Please check your message.");
            } else if (res.status === 502) {
              throw new Error(errorMsg || "Copilot could not reach the AI service right now. Please try again.");
            } else if (res.status === 404) {
              throw new Error(errorMsg || "Copilot service is currently unreachable.");
            } else {
              throw new Error(errorMsg || `Copilot request failed (HTTP ${res.status}).`);
            }
          }

          if (!res.body) throw new Error("No readable stream in response");

          const reader = res.body.getReader();
          const decoder = new TextDecoder("utf-8");

          let done = false;
          let buffer = "";
          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
              buffer += decoder.decode(value, { stream: true });
            }
            if (done) {
              buffer += decoder.decode(new Uint8Array(), { stream: false });
            }

            const lines = buffer.split("\n\n");
            buffer = lines.pop() || ""; // Keep the incomplete part in the buffer
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.replace("data: ", ""));
                  if (data.type === "token") {
                    setState(s => {
                      const t = s.threads.find(x => x.id === s.activeThread) || s.threads[0];
                      return {
                        ...s,
                        threads: s.threads.map(x => {
                          if (x.id !== t.id) return x;
                          const messages = [...x.messages];
                          const lastMsg = messages[messages.length - 1];
                          if (lastMsg && lastMsg.role === "assistant") {
                            messages[messages.length - 1] = { ...lastMsg, text: lastMsg.text + data.text };
                          }
                          return { ...x, messages };
                        })
                      };
                    });
                  } else if (data.type === "error") {
                    const streamErrMsg = data.message || "Stream interrupted due to an error";
                    setState(s => {
                      const t = s.threads.find(x => x.id === s.activeThread) || s.threads[0];
                      return {
                        ...s,
                        threads: s.threads.map(x => {
                          if (x.id !== t.id) return x;
                          const messages = [...x.messages];
                          const lastMsg = messages[messages.length - 1];
                          if (lastMsg && lastMsg.role === "assistant") {
                            messages[messages.length - 1] = {
                              ...lastMsg,
                              text: lastMsg.text ? `${lastMsg.text}\n\n[${streamErrMsg}]` : `Error: ${streamErrMsg}`,
                            };
                          }
                          return { ...x, messages };
                        })
                      };
                    });
                  }
                } catch (e) {
                  console.error("Failed to parse SSE JSON:", line, e);
                }
              }
            }
          }

          if (buffer.trim()) {
             if (buffer.startsWith("data: ")) {
                try {
                  const data = JSON.parse(buffer.replace("data: ", ""));
                  if (data.type === "token") {
                    setState(s => {
                      const t = s.threads.find(x => x.id === s.activeThread) || s.threads[0];
                      return {
                        ...s,
                        threads: s.threads.map(x => {
                          if (x.id !== t.id) return x;
                          const messages = [...x.messages];
                          const lastMsg = messages[messages.length - 1];
                          if (lastMsg && lastMsg.role === "assistant") {
                            messages[messages.length - 1] = { ...lastMsg, text: lastMsg.text + data.text };
                          }
                          return { ...x, messages };
                        })
                      };
                    });
                  }
                } catch (e) {
                  console.error("Failed to parse final trailing SSE JSON:", buffer, e);
                }
             }
          }
        } catch (err: any) {
           console.error("Copilot request failed", err);
           const displayError = err?.message ? `Error: ${err.message}` : "Error: Copilot is currently unavailable.";
           setState(s => {
               const t = s.threads.find(x => x.id === s.activeThread) || s.threads[0];
               return {
                 ...s,
                 threads: s.threads.map(x => {
                   if (x.id !== t.id) return x;
                   const messages = [...x.messages];
                   const lastMsg = messages[messages.length - 1];
                   if (lastMsg && lastMsg.role === "assistant") {
                     messages[messages.length - 1] = {
                       ...lastMsg,
                       text: lastMsg.text ? `${lastMsg.text}\n\n[${displayError}]` : displayError,
                     };
                   }
                   return { ...x, messages };
                 })
               };
           });
        }
      },
      setActiveThread: id => setState(s => ({ ...s, activeThread: id })),
      toggleContext: k =>
        setState(s => ({
          ...s,
          copilotContext: { ...s.copilotContext, [k]: !s.copilotContext[k] },
        })),
      toggleGap: skill =>
        setState(s => ({
          ...s,
          gapDone: s.gapDone.includes(skill)
            ? s.gapDone.filter(x => x !== skill)
            : [...s.gapDone, skill],
        })),
      setSettingsTab: s => setState(x => ({ ...x, settingsTab: s })),
      dismissChecklist: () =>
        setState(x => ({ ...x, dismissedChecklist: true })),
      resetData: () => {
        try {
          localStorage.removeItem(UI_PREFS_KEY);
        } catch {}
        setState(initial);
      },
      setSoundEnabled: v => setState(s => ({ ...s, soundEnabled: v })),
    }),
    [state]
  );
  return (
    <JobflowContext.Provider value={api}>{children}</JobflowContext.Provider>
  );
}
export function useJobflow() {
  const c = useContext(JobflowContext);
  if (!c) throw new Error("useJobflow must be inside JobflowProvider");
  return c;
}
