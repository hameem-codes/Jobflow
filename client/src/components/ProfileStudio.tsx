import { useState, useEffect } from "react";
import { useJobflow, type UserProfile, type TabKey } from "@/contexts/JobflowContext";
import { toast } from "sonner";
import {
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Award,
  Link2,
  Target,
  Sparkles,
  User,
  Sliders,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProfileStudioProps {
  setTab: (tab: TabKey) => void;
}

export function ProfileStudio({ setTab }: ProfileStudioProps) {
  const c = useJobflow();
  const [activeSection, setActiveSection] = useState<
    | "identity"
    | "career"
    | "preferences"
    | "skills"
    | "experience"
    | "education"
    | "projects"
    | "certifications"
    | "portfolio"
  >("identity");

  // Local form state
  const [formData, setFormData] = useState<UserProfile>({
    name: "",
    email: "",
    headline: "",
    about: "",
    location: "",
    country: "",
    phone: "",
    targetRoles: [],
    careerLevel: "Entry",
    targetIndustries: [],
    employmentTypes: ["Full-time"],
    internshipPreference: false,
    availability: "Immediate",
    preferredLocations: [],
    remotePreference: false,
    hybridPreference: false,
    onsitePreference: false,
    willingToRelocate: false,
    preferredCountries: [],
    salaryExpectation: null,
    workAuthorization: "",
    sponsorshipRequired: false,
    skills: [],
    languages: [],
    education: [],
    experience: [],
    certifications: [],
    courses: [],
    projects: [],
    awards: [],
    publications: [],
    volunteerExperience: [],
    githubUrl: "",
    linkedinUrl: "",
    portfolioUrl: "",
    websiteUrl: "",
    otherLinks: [],
    strongestSkills: [],
    skillsLearning: [],
    skillsWantingToDevelop: [],
    preferredRoles: [],
    rolesWillingToConsider: [],
    preferredIndustries: [],
    companiesInterestedIn: [],
    jobTypesToAvoid: [],
  });

  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newTargetRole, setNewTargetRole] = useState("");
  const [newPreferredLocation, setNewPreferredLocation] = useState("");

  // Populate local form from backend profile
  useEffect(() => {
    if (c.fullProfile) {
      setFormData({
        ...c.fullProfile,
        name: c.fullProfile.name || c.profile.name || "",
        email: c.fullProfile.email || c.profile.email || "",
        headline: c.fullProfile.headline || c.profile.title || "",
        location: c.fullProfile.location || c.locationPreference || "",
        targetRoles: c.fullProfile.targetRoles?.length
          ? c.fullProfile.targetRoles
          : c.targetRole
          ? [c.targetRole]
          : [],
        preferredLocations: c.fullProfile.preferredLocations?.length
          ? c.fullProfile.preferredLocations
          : c.locationPreference
          ? [c.locationPreference]
          : [],
        skills: c.fullProfile.skills || [],
        education: c.fullProfile.education || [],
        experience: c.fullProfile.experience || [],
        projects: c.fullProfile.projects || [],
        certifications: c.fullProfile.certifications || [],
        courses: c.fullProfile.courses || [],
      });
    } else {
      setFormData(prev => ({
        ...prev,
        name: c.profile.name || "",
        email: c.profile.email || "",
        headline: c.profile.title || "",
        location: c.locationPreference || "",
        targetRoles: c.targetRole ? [c.targetRole] : [],
      }));
    }
  }, [c.fullProfile, c.profile, c.locationPreference, c.targetRole]);

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast.error("Full name is required");
      return;
    }
    setSaving(true);
    const success = await c.updateFullProfile(formData);
    setSaving(false);
    if (success) {
      toast.success("Profile saved successfully");
    }
  };

  const addSkill = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, trimmed] }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill),
      strongestSkills: prev.strongestSkills.filter(s => s !== skill),
      skillsLearning: prev.skillsLearning.filter(s => s !== skill),
    }));
  };

  const addTargetRole = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !formData.targetRoles.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        targetRoles: [...prev.targetRoles, trimmed],
      }));
      setNewTargetRole("");
    }
  };

  const removeTargetRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      targetRoles: prev.targetRoles.filter(r => r !== role),
    }));
  };

  const addPreferredLocation = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !formData.preferredLocations.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        preferredLocations: [...prev.preferredLocations, trimmed],
      }));
      setNewPreferredLocation("");
    }
  };

  const removePreferredLocation = (loc: string) => {
    setFormData(prev => ({
      ...prev,
      preferredLocations: prev.preferredLocations.filter(l => l !== loc),
    }));
  };

  // Inline additions for Experience, Education, Projects
  const addExperienceItem = () => {
    const newItem = {
      id: `exp_${Date.now()}`,
      company: "",
      role: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      bullets: [],
    };
    setFormData(prev => ({ ...prev, experience: [newItem, ...prev.experience] }));
  };

  const addEducationItem = () => {
    const newItem = {
      id: `edu_${Date.now()}`,
      school: "",
      degree: "",
      field: "",
      year: new Date().getFullYear().toString(),
    };
    setFormData(prev => ({ ...prev, education: [newItem, ...prev.education] }));
  };

  const addProjectItem = () => {
    const newItem = {
      id: `proj_${Date.now()}`,
      name: "",
      description: "",
      link: "",
      bullets: [],
    };
    setFormData(prev => ({ ...prev, projects: [newItem, ...prev.projects] }));
  };

  const addCertificationItem = () => {
    const newItem = {
      id: `cert_${Date.now()}`,
      name: "",
      issuer: "",
      issueDate: "",
      url: "",
    };
    setFormData(prev => ({ ...prev, certifications: [newItem, ...prev.certifications] }));
  };

  const completeness = c.profileCompleteness?.percentage ?? 0;
  const missingItems = c.profileCompleteness?.missingItems ?? [];

  const sections = [
    { key: "identity", label: "Identity", icon: User },
    { key: "career", label: "Career Targets", icon: Target },
    { key: "preferences", label: "Job Preferences", icon: Sliders },
    { key: "skills", label: "Skills", icon: Sparkles },
    { key: "experience", label: "Experience", icon: Briefcase },
    { key: "education", label: "Education", icon: GraduationCap },
    { key: "projects", label: "Projects", icon: FolderGit2 },
    { key: "certifications", label: "Certifications", icon: Award },
    { key: "portfolio", label: "Portfolio & Links", icon: Link2 },
  ] as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Banner: Real Completeness & Quick Actions */}
      <div
        className="card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          padding: "20px 24px",
          background: "var(--card)",
          border: "1px solid var(--rule)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "var(--paper-deep)",
              border: "3px solid var(--lime)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Fraunces, serif",
              fontWeight: 700,
              fontSize: "18px",
              color: "var(--ink)",
            }}
          >
            {completeness}%
          </div>
          <div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", fontWeight: 700 }}>
              Profile Completeness
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", marginTop: "2px" }}>
              {completeness === 100
                ? "Your profile is 100% complete and powering full career intelligence"
                : `${missingItems.length} item${missingItems.length === 1 ? "" : "s"} missing to reach 100%`}
            </div>
            {missingItems.length > 0 && (
              <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                Missing: {missingItems.slice(0, 3).join(", ")}
                {missingItems.length > 3 ? ` +${missingItems.length - 3} more` : ""}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Button
            variant="outline"
            className="button"
            onClick={() => {
              c.refreshProfile();
              c.refreshCompleteness();
              toast.success("Profile refreshed from database");
            }}
            title="Refresh from PostgreSQL"
          >
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button
            className="button button--lime"
            onClick={handleSave}
            disabled={saving}
          >
            <Check size={15} /> {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Nav + Right Form */}
      <div className="settings-grid">
        <nav className="settings-nav">
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                className={activeSection === s.key ? "active" : ""}
                onClick={() => setActiveSection(s.key)}
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <Icon size={16} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="card settings-form" style={{ minHeight: "540px" }}>
          {/* SECTION 1: IDENTITY */}
          {activeSection === "identity" && (
            <div>
              <div className="card-kicker">1. Basic Information & Identity</div>
              <h2>Who you are.</h2>
              <p>Your authentic name and background. This information represents you across Jobflow.</p>

              <label>
                Full Name *
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sadiya Syed"
                />
              </label>

              <label>
                Email Address
                <Input
                  value={formData.email || ""}
                  disabled
                  title="Managed via authenticated session"
                  placeholder="your.email@example.com"
                />
              </label>

              <label>
                Professional Headline / Title
                <Input
                  value={formData.headline || ""}
                  onChange={e => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="e.g. Machine Learning Engineer | Full Stack Developer"
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <label>
                  City / Location
                  <Input
                    value={formData.location || ""}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Bangalore"
                  />
                </label>
                <label>
                  Country
                  <Input
                    value={formData.country || ""}
                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g. India"
                  />
                </label>
              </div>

              <label>
                Phone (optional)
                <Input
                  value={formData.phone || ""}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                />
              </label>

              <label>
                About / Professional Summary
                <textarea
                  className="chat-input"
                  style={{
                    width: "100%",
                    minHeight: "100px",
                    marginTop: "7px",
                    padding: "10px",
                    background: "var(--paper)",
                    border: "1px solid var(--rule)",
                    fontFamily: "inherit",
                    fontSize: "12px",
                    resize: "vertical",
                  }}
                  value={formData.about || ""}
                  onChange={e => setFormData({ ...formData, about: e.target.value })}
                  placeholder="A concise summary of your strengths, impact, and engineering philosophy."
                />
              </label>
            </div>
          )}

          {/* SECTION 2: CAREER TARGETS */}
          {activeSection === "career" && (
            <div>
              <div className="card-kicker">2. Career Goals & Targets</div>
              <h2>What you want next.</h2>
              <p>Target roles and career criteria that feed directly into job search and Copilot advice.</p>

              <label>Target Roles</label>
              <div style={{ display: "flex", gap: "8px", marginTop: "7px" }}>
                <Input
                  value={newTargetRole}
                  onChange={e => setNewTargetRole(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTargetRole(newTargetRole);
                    }
                  }}
                  placeholder="Type a role (e.g. Machine Learning Intern) and press Add"
                />
                <Button className="button button--ink" type="button" onClick={() => addTargetRole(newTargetRole)}>
                  <Plus size={14} /> Add
                </Button>
              </div>

              <div className="role-chips" style={{ marginTop: "12px" }}>
                {formData.targetRoles.map(role => (
                  <span
                    key={role}
                    className="role-chip active"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    {role}
                    <button
                      type="button"
                      style={{ border: 0, background: "none", cursor: "pointer", padding: 0 }}
                      onClick={() => removeTargetRole(role)}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {formData.targetRoles.length === 0 && (
                  <small style={{ color: "var(--muted)" }}>No target roles added yet.</small>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "16px" }}>
                <label>
                  Career Level
                  <select
                    value={formData.careerLevel || "Entry"}
                    onChange={e => setFormData({ ...formData, careerLevel: e.target.value })}
                    style={{
                      display: "block",
                      width: "100%",
                      height: "42px",
                      marginTop: "7px",
                      padding: "0 10px",
                      background: "var(--paper)",
                      border: "1px solid var(--rule)",
                      fontSize: "12px",
                    }}
                  >
                    <option value="Intern">Intern / Student</option>
                    <option value="Entry">Entry-level / Junior</option>
                    <option value="Mid">Mid-level</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead / Principal</option>
                  </select>
                </label>

                <label>
                  Availability / Start Date
                  <Input
                    value={formData.availability || ""}
                    onChange={e => setFormData({ ...formData, availability: e.target.value })}
                    placeholder="e.g. Immediate or 2 weeks"
                  />
                </label>
              </div>

              <label className="settings-checkbox-row" style={{ marginTop: "18px" }}>
                <input
                  type="checkbox"
                  checked={formData.internshipPreference}
                  onChange={e => setFormData({ ...formData, internshipPreference: e.target.checked })}
                />
                <span>Specifically seeking Internship opportunities</span>
              </label>
            </div>
          )}

          {/* SECTION 3: JOB PREFERENCES */}
          {activeSection === "preferences" && (
            <div>
              <div className="card-kicker">3. Job Search Preferences</div>
              <h2>Your working conditions.</h2>
              <p>Location, work style, and legal requirements. Used automatically by real job discovery.</p>

              <label>Preferred Locations</label>
              <div style={{ display: "flex", gap: "8px", marginTop: "7px" }}>
                <Input
                  value={newPreferredLocation}
                  onChange={e => setNewPreferredLocation(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPreferredLocation(newPreferredLocation);
                    }
                  }}
                  placeholder="e.g. Bangalore, London, Remote"
                />
                <Button className="button button--ink" type="button" onClick={() => addPreferredLocation(newPreferredLocation)}>
                  <Plus size={14} /> Add
                </Button>
              </div>

              <div className="role-chips" style={{ marginTop: "12px" }}>
                {formData.preferredLocations.map(loc => (
                  <span
                    key={loc}
                    className="role-chip active"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    {loc}
                    <button
                      type="button"
                      style={{ border: 0, background: "none", cursor: "pointer", padding: 0 }}
                      onClick={() => removePreferredLocation(loc)}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {formData.preferredLocations.length === 0 && (
                  <small style={{ color: "var(--muted)" }}>No preferred locations added.</small>
                )}
              </div>

              <div style={{ marginTop: "20px" }}>
                <label className="eyebrow">Work Style Preferences</label>
                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "8px" }}>
                  <label className="settings-checkbox-row">
                    <input
                      type="checkbox"
                      checked={formData.remotePreference}
                      onChange={e => setFormData({ ...formData, remotePreference: e.target.checked })}
                    />
                    <span>Remote</span>
                  </label>
                  <label className="settings-checkbox-row">
                    <input
                      type="checkbox"
                      checked={formData.hybridPreference}
                      onChange={e => setFormData({ ...formData, hybridPreference: e.target.checked })}
                    />
                    <span>Hybrid</span>
                  </label>
                  <label className="settings-checkbox-row">
                    <input
                      type="checkbox"
                      checked={formData.onsitePreference}
                      onChange={e => setFormData({ ...formData, onsitePreference: e.target.checked })}
                    />
                    <span>On-site</span>
                  </label>
                  <label className="settings-checkbox-row">
                    <input
                      type="checkbox"
                      checked={formData.willingToRelocate}
                      onChange={e => setFormData({ ...formData, willingToRelocate: e.target.checked })}
                    />
                    <span>Willing to Relocate</span>
                  </label>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "20px" }}>
                <label>
                  Salary Expectation (Annual INR)
                  <Input
                    type="number"
                    value={formData.salaryExpectation ?? ""}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        salaryExpectation: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                    placeholder="e.g. 1200000"
                  />
                </label>
                <label>
                  Work Authorization
                  <Input
                    value={formData.workAuthorization || ""}
                    onChange={e => setFormData({ ...formData, workAuthorization: e.target.value })}
                    placeholder="e.g. Citizen, Permanent Resident, Visa"
                  />
                </label>
              </div>

              <label className="settings-checkbox-row" style={{ marginTop: "16px" }}>
                <input
                  type="checkbox"
                  checked={formData.sponsorshipRequired}
                  onChange={e => setFormData({ ...formData, sponsorshipRequired: e.target.checked })}
                />
                <span>Requires Visa Sponsorship</span>
              </label>
            </div>
          )}

          {/* SECTION 4: SKILLS */}
          {activeSection === "skills" && (
            <div>
              <div className="card-kicker">4. Professional Skills</div>
              <h2>Your technical toolkit.</h2>
              <p>The skills you possess and are developing. These drive the deterministic match scoring algorithm.</p>

              <label>Add Skill</label>
              <div style={{ display: "flex", gap: "8px", marginTop: "7px" }}>
                <Input
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill(newSkill);
                    }
                  }}
                  placeholder="e.g. Python, PyTorch, React, SQL"
                />
                <Button className="button button--ink" type="button" onClick={() => addSkill(newSkill)}>
                  <Plus size={14} /> Add
                </Button>
              </div>

              <div className="role-chips" style={{ marginTop: "14px" }}>
                {formData.skills.map(skill => (
                  <span
                    key={skill}
                    className="role-chip active"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    {skill}
                    <button
                      type="button"
                      style={{ border: 0, background: "none", cursor: "pointer", padding: 0 }}
                      onClick={() => removeSkill(skill)}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {formData.skills.length === 0 && (
                  <small style={{ color: "var(--muted)" }}>No skills listed. Add at least 3 skills for accurate matching.</small>
                )}
              </div>

              <div style={{ marginTop: "24px" }}>
                <label>Strongest Core Skills</label>
                <p style={{ fontSize: "11px", color: "var(--muted)", margin: "4px 0" }}>
                  Select from your skills above to highlight as your strongest competencies.
                </p>
                <div className="role-chips" style={{ marginTop: "8px" }}>
                  {formData.skills.map(skill => {
                    const isStrong = formData.strongestSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        className={`role-chip ${isStrong ? "active" : ""}`}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            strongestSkills: isStrong
                              ? prev.strongestSkills.filter(s => s !== skill)
                              : [...prev.strongestSkills, skill],
                          }));
                        }}
                      >
                        {isStrong ? "★ " : ""}{skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: EXPERIENCE */}
          {activeSection === "experience" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <div className="card-kicker">5. Work Experience</div>
                  <h2>Where you've worked.</h2>
                </div>
                <Button className="button button--ink" type="button" onClick={addExperienceItem}>
                  <Plus size={14} /> Add Position
                </Button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                {formData.experience.map((exp, idx) => (
                  <div
                    key={exp.id}
                    style={{
                      border: "1px solid var(--rule)",
                      background: "var(--paper)",
                      padding: "16px",
                      position: "relative",
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        border: 0,
                        background: "none",
                        cursor: "pointer",
                        color: "var(--muted)",
                      }}
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          experience: prev.experience.filter(e => e.id !== exp.id),
                        }))
                      }
                      title="Remove experience"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <label>
                        Company *
                        <Input
                          value={exp.company}
                          onChange={e => {
                            const updated = [...formData.experience];
                            updated[idx] = { ...exp, company: e.target.value };
                            setFormData({ ...formData, experience: updated });
                          }}
                          placeholder="e.g. Acme Corp"
                        />
                      </label>
                      <label>
                        Role / Title *
                        <Input
                          value={exp.role}
                          onChange={e => {
                            const updated = [...formData.experience];
                            updated[idx] = { ...exp, role: e.target.value };
                            setFormData({ ...formData, experience: updated });
                          }}
                          placeholder="e.g. Software Engineer Intern"
                        />
                      </label>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
                      <label>
                        Start Date
                        <Input
                          value={exp.startDate || ""}
                          onChange={e => {
                            const updated = [...formData.experience];
                            updated[idx] = { ...exp, startDate: e.target.value };
                            setFormData({ ...formData, experience: updated });
                          }}
                          placeholder="e.g. June 2025"
                        />
                      </label>
                      <label>
                        End Date
                        <Input
                          value={exp.endDate || ""}
                          disabled={exp.current}
                          onChange={e => {
                            const updated = [...formData.experience];
                            updated[idx] = { ...exp, endDate: e.target.value };
                            setFormData({ ...formData, experience: updated });
                          }}
                          placeholder={exp.current ? "Present" : "e.g. August 2025"}
                        />
                      </label>
                    </div>

                    <label className="settings-checkbox-row" style={{ marginTop: "10px" }}>
                      <input
                        type="checkbox"
                        checked={exp.current ?? false}
                        onChange={e => {
                          const updated = [...formData.experience];
                          updated[idx] = { ...exp, current: e.target.checked };
                          setFormData({ ...formData, experience: updated });
                        }}
                      />
                      <span>I currently work here</span>
                    </label>
                  </div>
                ))}

                {formData.experience.length === 0 && (
                  <div className="empty-state" style={{ padding: "40px 0" }}>
                    <div className="empty-state__icon">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h3>No experience listed yet</h3>
                      <p>Add your internships, full-time roles, or contract projects.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 6: EDUCATION */}
          {activeSection === "education" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <div className="card-kicker">6. Education</div>
                  <h2>Academic background.</h2>
                </div>
                <Button className="button button--ink" type="button" onClick={addEducationItem}>
                  <Plus size={14} /> Add Education
                </Button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                {formData.education.map((edu, idx) => (
                  <div
                    key={edu.id}
                    style={{
                      border: "1px solid var(--rule)",
                      background: "var(--paper)",
                      padding: "16px",
                      position: "relative",
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        border: 0,
                        background: "none",
                        cursor: "pointer",
                        color: "var(--muted)",
                      }}
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          education: prev.education.filter(e => e.id !== edu.id),
                        }))
                      }
                      title="Remove education"
                    >
                      <Trash2 size={16} />
                    </button>

                    <label>
                      School / University *
                      <Input
                        value={edu.school}
                        onChange={e => {
                          const updated = [...formData.education];
                          updated[idx] = { ...edu, school: e.target.value };
                          setFormData({ ...formData, education: updated });
                        }}
                        placeholder="e.g. Indian Institute of Technology"
                      />
                    </label>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
                      <label>
                        Degree *
                        <Input
                          value={edu.degree}
                          onChange={e => {
                            const updated = [...formData.education];
                            updated[idx] = { ...edu, degree: e.target.value };
                            setFormData({ ...formData, education: updated });
                          }}
                          placeholder="e.g. B.Tech / B.S."
                        />
                      </label>
                      <label>
                        Field of Study *
                        <Input
                          value={edu.field}
                          onChange={e => {
                            const updated = [...formData.education];
                            updated[idx] = { ...edu, field: e.target.value };
                            setFormData({ ...formData, education: updated });
                          }}
                          placeholder="e.g. Computer Science"
                        />
                      </label>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
                      <label>
                        Graduation Year *
                        <Input
                          value={edu.year}
                          onChange={e => {
                            const updated = [...formData.education];
                            updated[idx] = { ...edu, year: e.target.value };
                            setFormData({ ...formData, education: updated });
                          }}
                          placeholder="e.g. 2026"
                        />
                      </label>
                      <label>
                        GPA / Grade (optional)
                        <Input
                          value={edu.gpa || ""}
                          onChange={e => {
                            const updated = [...formData.education];
                            updated[idx] = { ...edu, gpa: e.target.value };
                            setFormData({ ...formData, education: updated });
                          }}
                          placeholder="e.g. 8.8 / 10"
                        />
                      </label>
                    </div>
                  </div>
                ))}

                {formData.education.length === 0 && (
                  <div className="empty-state" style={{ padding: "40px 0" }}>
                    <div className="empty-state__icon">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <h3>No education added</h3>
                      <p>Share where you studied or your degrees.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 7: PROJECTS */}
          {activeSection === "projects" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <div className="card-kicker">7. Projects & Code</div>
                  <h2>What you've built.</h2>
                </div>
                <Button className="button button--ink" type="button" onClick={addProjectItem}>
                  <Plus size={14} /> Add Project
                </Button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                {formData.projects.map((proj, idx) => (
                  <div
                    key={proj.id}
                    style={{
                      border: "1px solid var(--rule)",
                      background: "var(--paper)",
                      padding: "16px",
                      position: "relative",
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        border: 0,
                        background: "none",
                        cursor: "pointer",
                        color: "var(--muted)",
                      }}
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          projects: prev.projects.filter(p => p.id !== proj.id),
                        }))
                      }
                      title="Remove project"
                    >
                      <Trash2 size={16} />
                    </button>

                    <label>
                      Project Name *
                      <Input
                        value={proj.name}
                        onChange={e => {
                          const updated = [...formData.projects];
                          updated[idx] = { ...proj, name: e.target.value };
                          setFormData({ ...formData, projects: updated });
                        }}
                        placeholder="e.g. Autonomous Agent Workflow"
                      />
                    </label>

                    <label style={{ marginTop: "10px" }}>
                      Project URL / Repository
                      <Input
                        value={proj.link || ""}
                        onChange={e => {
                          const updated = [...formData.projects];
                          updated[idx] = { ...proj, link: e.target.value };
                          setFormData({ ...formData, projects: updated });
                        }}
                        placeholder="https://github.com/username/project"
                      />
                    </label>

                    <label style={{ marginTop: "10px" }}>
                      Description & Impact *
                      <Input
                        value={proj.description}
                        onChange={e => {
                          const updated = [...formData.projects];
                          updated[idx] = { ...proj, description: e.target.value };
                          setFormData({ ...formData, projects: updated });
                        }}
                        placeholder="Key technical accomplishments and tech stack used"
                      />
                    </label>
                  </div>
                ))}

                {formData.projects.length === 0 && (
                  <div className="empty-state" style={{ padding: "40px 0" }}>
                    <div className="empty-state__icon">
                      <FolderGit2 size={20} />
                    </div>
                    <div>
                      <h3>No projects listed</h3>
                      <p>Showcase open source work, production apps, or research papers.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 8: CERTIFICATIONS */}
          {activeSection === "certifications" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <div className="card-kicker">8. Certifications & Courses</div>
                  <h2>Credentials & lifelong learning.</h2>
                </div>
                <Button className="button button--ink" type="button" onClick={addCertificationItem}>
                  <Plus size={14} /> Add Certification
                </Button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                {formData.certifications.map((cert, idx) => (
                  <div
                    key={cert.id}
                    style={{
                      border: "1px solid var(--rule)",
                      background: "var(--paper)",
                      padding: "16px",
                      position: "relative",
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        border: 0,
                        background: "none",
                        cursor: "pointer",
                        color: "var(--muted)",
                      }}
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          certifications: prev.certifications.filter(c => c.id !== cert.id),
                        }))
                      }
                      title="Remove certification"
                    >
                      <Trash2 size={16} />
                    </button>

                    <label>
                      Certification Name *
                      <Input
                        value={cert.name}
                        onChange={e => {
                          const updated = [...formData.certifications];
                          updated[idx] = { ...cert, name: e.target.value };
                          setFormData({ ...formData, certifications: updated });
                        }}
                        placeholder="e.g. AWS Certified Solutions Architect"
                      />
                    </label>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
                      <label>
                        Issuing Organization *
                        <Input
                          value={cert.issuer}
                          onChange={e => {
                            const updated = [...formData.certifications];
                            updated[idx] = { ...cert, issuer: e.target.value };
                            setFormData({ ...formData, certifications: updated });
                          }}
                          placeholder="e.g. Amazon Web Services"
                        />
                      </label>
                      <label>
                        Issue Date
                        <Input
                          value={cert.issueDate || ""}
                          onChange={e => {
                            const updated = [...formData.certifications];
                            updated[idx] = { ...cert, issueDate: e.target.value };
                            setFormData({ ...formData, certifications: updated });
                          }}
                          placeholder="e.g. 2025"
                        />
                      </label>
                    </div>
                  </div>
                ))}

                {formData.certifications.length === 0 && (
                  <div className="empty-state" style={{ padding: "40px 0" }}>
                    <div className="empty-state__icon">
                      <Award size={20} />
                    </div>
                    <div>
                      <h3>No certifications added</h3>
                      <p>Add industry certifications and accredited courses.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 9: PORTFOLIO & LINKS */}
          {activeSection === "portfolio" && (
            <div>
              <div className="card-kicker">9. Portfolio & Web Presence</div>
              <h2>Where to find your work.</h2>
              <p>Professional links connected to your profile.</p>

              <label>
                GitHub Profile URL
                <Input
                  value={formData.githubUrl || ""}
                  onChange={e => setFormData({ ...formData, githubUrl: e.target.value })}
                  placeholder="https://github.com/username"
                />
              </label>

              <label>
                LinkedIn Profile URL
                <Input
                  value={formData.linkedinUrl || ""}
                  onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                />
              </label>

              <label>
                Portfolio Website URL
                <Input
                  value={formData.portfolioUrl || ""}
                  onChange={e => setFormData({ ...formData, portfolioUrl: e.target.value })}
                  placeholder="https://yourportfolio.dev"
                />
              </label>

              <label>
                Personal Website / Blog
                <Input
                  value={formData.websiteUrl || ""}
                  onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                  placeholder="https://yourblog.com"
                />
              </label>
            </div>
          )}

          {/* Bottom Save Action */}
          <div style={{ marginTop: "32px", borderTop: "1px solid var(--rule)", paddingTop: "20px", display: "flex", justifyContent: "flex-end" }}>
            <Button
              className="button button--lime"
              onClick={handleSave}
              disabled={saving}
            >
              <Check size={15} /> {saving ? "Saving changes..." : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
