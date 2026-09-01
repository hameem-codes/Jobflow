import { useState } from "react";
import { type ResumeVersion, type StructuredResume, useJobflow } from "@/contexts/JobflowContext";
import { ResumePreview } from "./ResumePreview";
import { ATSKeywordScanner } from "./ATSKeywordScanner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Trash2, Wand2, GripVertical } from "lucide-react";
import { AIBulletEnhancer } from "./AIBulletEnhancer";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Draggable item wrapper for sortable lists
function DraggableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
        <button {...listeners} style={{ background: "none", border: "none", cursor: "grab", padding: "8px 4px", color: "var(--muted)" }} title="Drag to reorder">
          <GripVertical size={16} />
        </button>
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

export function InteractiveResumeBuilder({ resume, onClose }: { resume: ResumeVersion; onClose: () => void }) {
  const c = useJobflow();
  const [activeSection, setActiveSection] = useState<"personal" | "summary" | "experience" | "education" | "skills" | "projects">("experience");
  const [editingBullet, setEditingBullet] = useState<{ expId: string; bulletIndex: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { distance: 8 }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const content = resume.content;
  if (!content) return null;

  const update = (p: Partial<StructuredResume>) => {
    c.updateResumeContent(resume.id, p);
  };

  // Experience handlers
  const handleExperienceReorder = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = content.workHistory.findIndex(w => w.id === active.id);
      const newIndex = content.workHistory.findIndex(w => w.id === over.id);
      update({ workHistory: arrayMove(content.workHistory, oldIndex, newIndex) });
    }
  };

  // Education handlers
  const handleEducationReorder = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = content.education.findIndex(e => e.id === active.id);
      const newIndex = content.education.findIndex(e => e.id === over.id);
      update({ education: arrayMove(content.education, oldIndex, newIndex) });
    }
  };

  // Projects handlers
  const handleProjectsReorder = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = content.projects.findIndex(p => p.id === active.id);
      const newIndex = content.projects.findIndex(p => p.id === over.id);
      update({ projects: arrayMove(content.projects, oldIndex, newIndex) });
    }
  };

  const updateExperience = (id: string, field: string, value: any) => {
    update({
      workHistory: content.workHistory.map(w => w.id === id ? { ...w, [field]: value } : w)
    });
  };

  const addExperience = () => {
    update({
      workHistory: [{ id: `exp-${Date.now()}`, company: "New Company", role: "Role", location: "", startDate: "", endDate: "", bullets: ["Added new bullet"] }, ...content.workHistory]
    });
  };

  const deleteExperience = (id: string) => {
    update({
      workHistory: content.workHistory.filter(w => w.id !== id)
    });
  };

  const moveEducation = (index: number, direction: -1 | 1) => {
    const newEducation = [...content.education];
    if (index + direction < 0 || index + direction >= newEducation.length) return;
    const temp = newEducation[index];
    newEducation[index] = newEducation[index + direction];
    newEducation[index + direction] = temp;
    update({ education: newEducation });
  };

  const updateEducation = (id: string, field: string, value: any) => {
    update({
      education: content.education.map(e => e.id === id ? { ...e, [field]: value } : e)
    });
  };

  const addEducation = () => {
    update({
      education: [{ id: `edu-${Date.now()}`, school: "New School", degree: "Degree", field: "Field of Study", year: "" }, ...content.education]
    });
  };

  const deleteEducation = (id: string) => {
    update({
      education: content.education.filter(e => e.id !== id)
    });
  };

  const moveProject = (index: number, direction: -1 | 1) => {
    const newProjects = [...content.projects];
    if (index + direction < 0 || index + direction >= newProjects.length) return;
    const temp = newProjects[index];
    newProjects[index] = newProjects[index + direction];
    newProjects[index + direction] = temp;
    update({ projects: newProjects });
  };

  const updateProject = (id: string, field: string, value: any) => {
    update({
      projects: content.projects.map(p => p.id === id ? { ...p, [field]: value } : p)
    });
  };

  const addProject = () => {
    update({
      projects: [{ id: `proj-${Date.now()}`, name: "New Project", description: "Project description", link: "", bullets: ["Project detail"] }, ...content.projects]
    });
  };

  const deleteProject = (id: string) => {
    update({
      projects: content.projects.filter(p => p.id !== id)
    });
  };

  const updateProjectBullet = (projId: string, bulletIndex: number, val: string) => {
    update({
      projects: content.projects.map(p => {
        if (p.id !== projId) return p;
        const newBullets = [...p.bullets];
        newBullets[bulletIndex] = val;
        return { ...p, bullets: newBullets };
      })
    });
  };

  const addProjectBullet = (projId: string) => {
    update({
      projects: content.projects.map(p => p.id === projId ? { ...p, bullets: [...p.bullets, ""] } : p)
    });
  };

  const deleteProjectBullet = (projId: string, bulletIndex: number) => {
    update({
      projects: content.projects.map(p => {
        if (p.id !== projId) return p;
        const newBullets = p.bullets.filter((_, i) => i !== bulletIndex);
        return { ...p, bullets: newBullets };
      })
    });
  };

  const updateBullet = (expId: string, bulletIndex: number, val: string) => {
    update({
      workHistory: content.workHistory.map(w => {
        if (w.id !== expId) return w;
        const newBullets = [...w.bullets];
        newBullets[bulletIndex] = val;
        return { ...w, bullets: newBullets };
      })
    });
  };

  const addBullet = (expId: string) => {
    update({
      workHistory: content.workHistory.map(w => w.id === expId ? { ...w, bullets: [...w.bullets, ""] } : w)
    });
  };

  const deleteBullet = (expId: string, bulletIndex: number) => {
    update({
      workHistory: content.workHistory.map(w => {
        if (w.id !== expId) return w;
        const newBullets = w.bullets.filter((_, i) => i !== bulletIndex);
        return { ...w, bullets: newBullets };
      })
    });
  };

  return (
    <div className="resume-studio-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
      <div className="builder-controls card" style={{ height: "calc(100vh - 120px)", overflowY: "auto", position: "sticky", top: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <button className="icon-button" onClick={onClose}><ArrowLeft size={18} /></button>
          <h2 style={{ margin: 0 }}>Resume Studio</h2>
        </div>

        <div className="builder-nav" style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--rule)", paddingBottom: "10px" }}>
          {(["personal", "summary", "experience", "education", "skills", "projects"] as const).map(sec => (
            <button
              key={sec}
              style={{ background: "none", border: "none", fontWeight: activeSection === sec ? "bold" : "normal", color: activeSection === sec ? "var(--ink)" : "var(--muted)", cursor: "pointer", textTransform: "capitalize" }}
              onClick={() => setActiveSection(sec)}
            >
              {sec}
            </button>
          ))}
        </div>

        {activeSection === "personal" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <label>Name <Input value={content.personalInfo.name} onChange={e => update({ personalInfo: { ...content.personalInfo, name: e.target.value } })} /></label>
            <label>Email <Input value={content.personalInfo.email} onChange={e => update({ personalInfo: { ...content.personalInfo, email: e.target.value } })} /></label>
            <label>Phone <Input value={content.personalInfo.phone} onChange={e => update({ personalInfo: { ...content.personalInfo, phone: e.target.value } })} /></label>
            <label>Location <Input value={content.personalInfo.location} onChange={e => update({ personalInfo: { ...content.personalInfo, location: e.target.value } })} /></label>
          </div>
        )}

        {activeSection === "summary" && (
          <div>
            <label>Professional Summary
              <textarea 
                value={content.summary} 
                onChange={e => update({ summary: e.target.value })} 
                style={{ width: "100%", height: "150px", marginTop: "5px", padding: "10px", borderRadius: "6px", border: "1px solid var(--rule)", background: "var(--bg)", color: "var(--ink)" }} 
              />
            </label>
          </div>
        )}

        {activeSection === "experience" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3 style={{ margin: 0 }}>Work History</h3>
              <Button className="button button--lime" onClick={addExperience}><Plus size={14} /> Add Role</Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleExperienceReorder}>
              <SortableContext items={content.workHistory.map(w => w.id)} strategy={verticalListSortingStrategy}>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {content.workHistory.map((exp) => (
                    <DraggableItem key={exp.id} id={exp.id}>
                      <div style={{ border: "1px solid var(--rule)", padding: "15px", borderRadius: "8px", position: "relative" }}>
                        <div style={{ position: "absolute", right: "15px", top: "15px", display: "flex", gap: "5px" }}>
                          <button onClick={() => deleteExperience(exp.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "red" }}><Trash2 size={16} /></button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px", paddingRight: "50px" }}>
                          <label>Company <Input value={exp.company} onChange={e => updateExperience(exp.id, "company", e.target.value)} /></label>
                          <label>Role <Input value={exp.role} onChange={e => updateExperience(exp.id, "role", e.target.value)} /></label>
                          <label>Dates <Input value={exp.startDate + " - " + exp.endDate} onChange={e => { const pts = e.target.value.split(" - "); updateExperience(exp.id, "startDate", pts[0]||""); updateExperience(exp.id, "endDate", pts[1]||""); }} /></label>
                          <label>Location <Input value={exp.location} onChange={e => updateExperience(exp.id, "location", e.target.value)} /></label>
                        </div>

                        <div>
                          <label style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>Bullets <button className="text-link" onClick={() => addBullet(exp.id)}><Plus size={12}/> Add</button></label>
                          {exp.bullets.map((b, bIndex) => (
                            <div key={bIndex} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "flex-start" }}>
                              <textarea
                                value={b}
                                onChange={e => updateBullet(exp.id, bIndex, e.target.value)}
                                style={{ flex: 1, minHeight: "60px", padding: "8px", borderRadius: "4px", border: "1px solid var(--rule)", background: "var(--bg)", color: "var(--ink)", fontSize: "13px" }}
                              />
                              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                <button onClick={() => setEditingBullet({ expId: exp.id, bulletIndex: bIndex })} title="AI Enhance" style={{ background: "var(--lime)", color: "#000", border: "none", borderRadius: "4px", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Wand2 size={12} /></button>
                                <button onClick={() => deleteBullet(exp.id, bIndex)} title="Delete" style={{ background: "none", color: "var(--muted)", border: "1px solid var(--rule)", borderRadius: "4px", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={12} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </DraggableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {activeSection === "education" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3 style={{ margin: 0 }}>Education</h3>
              <Button className="button button--lime" onClick={addEducation}><Plus size={14} /> Add Education</Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEducationReorder}>
              <SortableContext items={content.education.map(e => e.id)} strategy={verticalListSortingStrategy}>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {content.education.map((edu) => (
                    <DraggableItem key={edu.id} id={edu.id}>
                      <div style={{ border: "1px solid var(--rule)", padding: "15px", borderRadius: "8px", position: "relative" }}>
                        <div style={{ position: "absolute", right: "15px", top: "15px", display: "flex", gap: "5px" }}>
                          <button onClick={() => deleteEducation(edu.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "red" }}><Trash2 size={16} /></button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px", paddingRight: "50px" }}>
                          <label>School <Input value={edu.school} onChange={e => updateEducation(edu.id, "school", e.target.value)} /></label>
                          <label>Degree <Input value={edu.degree} onChange={e => updateEducation(edu.id, "degree", e.target.value)} /></label>
                          <label>Field of Study <Input value={edu.field} onChange={e => updateEducation(edu.id, "field", e.target.value)} /></label>
                          <label>Year <Input value={edu.year} onChange={e => updateEducation(edu.id, "year", e.target.value)} /></label>
                        </div>
                      </div>
                    </DraggableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {activeSection === "skills" && (
          <div>
            <label>Skills (comma separated)
              <textarea
                value={content.skills.join(", ")}
                onChange={e => update({ skills: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                style={{ width: "100%", height: "100px", marginTop: "5px", padding: "10px", borderRadius: "6px", border: "1px solid var(--rule)", background: "var(--bg)", color: "var(--ink)" }}
              />
            </label>
          </div>
        )}

        {activeSection === "projects" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3 style={{ margin: 0 }}>Projects</h3>
              <Button className="button button--lime" onClick={addProject}><Plus size={14} /> Add Project</Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleProjectsReorder}>
              <SortableContext items={content.projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {content.projects.map((proj) => (
                    <DraggableItem key={proj.id} id={proj.id}>
                      <div style={{ border: "1px solid var(--rule)", padding: "15px", borderRadius: "8px", position: "relative" }}>
                        <div style={{ position: "absolute", right: "15px", top: "15px", display: "flex", gap: "5px" }}>
                          <button onClick={() => deleteProject(proj.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "red" }}><Trash2 size={16} /></button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px", paddingRight: "50px" }}>
                          <label>Project Name <Input value={proj.name} onChange={e => updateProject(proj.id, "name", e.target.value)} /></label>
                          <label>Link <Input value={proj.link} onChange={e => updateProject(proj.id, "link", e.target.value)} placeholder="https://..." /></label>
                          <label style={{ gridColumn: "1 / -1" }}>Description <textarea value={proj.description} onChange={e => updateProject(proj.id, "description", e.target.value)} style={{ width: "100%", minHeight: "60px", padding: "8px", borderRadius: "4px", border: "1px solid var(--rule)", background: "var(--bg)", color: "var(--ink)", fontSize: "13px", marginTop: "5px" }} /></label>
                        </div>

                        <div>
                          <label style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>Details <button className="text-link" onClick={() => addProjectBullet(proj.id)}><Plus size={12}/> Add</button></label>
                          {proj.bullets.map((b, bIndex) => (
                            <div key={bIndex} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "flex-start" }}>
                              <textarea
                                value={b}
                                onChange={e => updateProjectBullet(proj.id, bIndex, e.target.value)}
                                style={{ flex: 1, minHeight: "60px", padding: "8px", borderRadius: "4px", border: "1px solid var(--rule)", background: "var(--bg)", color: "var(--ink)", fontSize: "13px" }}
                              />
                              <button onClick={() => deleteProjectBullet(proj.id, bIndex)} title="Delete" style={{ background: "none", color: "var(--muted)", border: "1px solid var(--rule)", borderRadius: "4px", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={12} /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </DraggableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

      </div>
      
      <div className="preview-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <ATSKeywordScanner resumeId={resume.id} />
        <div style={{ transform: "scale(0.9)", transformOrigin: "top center" }}>
          <ResumePreview resume={resume} />
        </div>
      </div>

      {editingBullet && (
        <AIBulletEnhancer 
          expId={editingBullet.expId} 
          bulletIndex={editingBullet.bulletIndex} 
          currentText={content.workHistory.find(w => w.id === editingBullet.expId)?.bullets[editingBullet.bulletIndex] || ""}
          onSave={(text) => { updateBullet(editingBullet.expId, editingBullet.bulletIndex, text); setEditingBullet(null); }}
          onClose={() => setEditingBullet(null)} 
        />
      )}
    </div>
  );
}
