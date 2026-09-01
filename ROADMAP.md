# Jobflow — Product Feature Roadmap & Rating Elevation Plan

> **Current Frontend Rating:** 8.5 / 10  
> **Target Rating:** 9.6+ / 10 (Tier-1 Production Grade Career OS)  
> **Design Philosophy:** *Editorial Signal* — Calm paper aesthetic, high signal-to-noise ratio, transparent AI logic, and deep user agency.

---

## 1. Executive Summary & Scoring Gap Analysis

Jobflow already has an exceptional design foundation, consistent typography/theming, and 10 interconnected workspaces. However, several tools rely on illustrative samples and simulated outputs.

To push the application into a **9.6+ rating**, the frontend must evolve from **inspection-only** views into **creation, practice, and negotiation utilities**.

```
   CURRENT STATE (8.5 / 10)                       TARGET STATE (9.6+ / 10)
┌────────────────────────────────┐              ┌───────────────────────────────────────────────┐
│ • Fixed 3 demo jobs            │              │ • Custom Job Creator & URL clipper            │
│ • Mock upload & static score   │  ──────────► │ • Section Resume Builder & ATS Keyword Match  │
│ • Basic 4-stage Kanban         │              │ • Multi-Round Interview Log & Recruiter CRM   │
│ • Simulated Copilot replies    │              │ • Interview Prep Studio & STAR Story Bank     │
│ • Static skill gap comparison  │              │ • Total Comp & Offer Negotiation Calculator   │
└────────────────────────────────┘              └───────────────────────────────────────────────┘
```

---

## 2. Strategic Feature Pillars

```
                     ┌───────────────────────────────────────────────┐
                     │          JOBFLOW PRODUCT ARCHITECTURE         │
                     └───────────────────────┬───────────────────────┘
                                             │
      ┌───────────────────┬──────────────────┴────────────────┬───────────────────┐
      ▼                   ▼                                   ▼                   ▼
┌──────────────┐   ┌──────────────┐                    ┌──────────────┐   ┌──────────────┐
│  OPPORTUNITY │   │  MATERIALS   │                    │  INTERVIEW   │   │  CAREER OS   │
│     DESK     │   │    STUDIO    │                    │  & READINESS │   │   & COPILOT  │
├──────────────┤   ├──────────────┤                    ├──────────────┤   ├──────────────┤
│• Custom Jobs │   │• ATS Scanner │                    │• STAR Bank   │   │• Multi-thread│
│• Pipeline CRM│   │• Bullet Mod  │                    │• Mock Timer  │   │• Total Comp  │
│• Recruiter DB│   │• Live PDF    │                    │• Round Logs  │   │• Data Sync   │
└──────────────┘   └──────────────┘                    └──────────────┘   └──────────────┘
```

---

## 3. Detailed Implementation Specifications

### Phase 1: Opportunity Desk & Application CRM Deepening
*Objective: Make Jobflow an indispensable daily tracker for real-world job applications.*

- [ ] **Custom Job Modal:**
  - Support adding any external job posting with custom Company, Role, Salary, Location, Remote Type, Skills required, and Link.
  - Automatic keyword extraction from pasted job descriptions.
  - Newly added jobs instantly propagate to Match Breakdown, Cover Letter Studio, and Pipeline.
- [ ] **Recruiter & Contact Directory (per application):**
  - Track contacts: Name, Title (e.g. *Hiring Manager*, *Senior Recruiter*), Email, LinkedIn profile.
  - Outreach status tracker (*Not contacted*, *Messaged*, *Replied*, *Coffee chat scheduled*).
  - One-click copy outreach templates:
    1. Cold LinkedIn Connection Note (under 300 characters).
    2. Post-Interview 24-Hour Thank You email.
    3. Respectful Status Check-in after 7 days.
- [ ] **Multi-Round Interview Scheduler:**
  - Add specific interview stages: *Recruiter Screen*, *Hiring Manager 1:1*, *Technical Assessment*, *System Design*, *Executive Final*.
  - Date & time picker with calendar countdown banner on the Dashboard.

---

### Phase 2: Interactive Resume Studio & ATS Match Scanner
*Objective: Transform passive resume viewing into an actionable resume optimization suite.*

- [ ] **Interactive Section-by-Section Resume Builder:**
  - Structure: Personal Info, Summary, Work History, Education, Skills, and Projects.
  - Drag-and-drop or reorder experience items.
- [ ] **AI Bullet Enhancer (Action + Context + Impact):**
  - Interactive bullet tuner with transformation presets:
    - *More Metric-Driven* (injects quantifiable outcomes).
    - *More Concise* (removes fluff and filler words).
    - *Leadership Oriented* (highlights team ownership and cross-functional drive).
- [ ] **Live ATS Keyword Scanner:**
  - Select target job from the Opportunity Desk.
  - Side-by-side keyword presence audit:
    - **Found Keywords** (highlighted green with frequency count).
    - **Missing Essential Keywords** (highlighted amber with 1-click suggestion to add).
    - **ATS Match Score** calculated dynamically from text similarity.
- [ ] **Print & PDF Export:**
  - Clean `@media print` optimized editorial layout for instant PDF generation.

---

### Phase 3: Interview Prep Studio & STAR Story Bank
*Objective: Provide a dedicated environment for behavioral and technical interview readiness.*

- [ ] **STAR Story Vault (Situation, Task, Action, Result):**
  - Structured 4-step story drafting canvas.
  - Category tagging: *Leadership, Conflict Resolution, Technical Failure, Scalability, Cross-Team Influence*.
  - Link stories to specific applications in the pipeline.
- [ ] **Mock Interview Simulator & Timer:**
  - Role-specific question bank across design, engineering, and product management.
  - Interactive 60s / 120s / 180s practice timer with audio/visual cues.
  - Self-assessment scorecard:
    - Structure clarity (1–5)
    - Concrete metric included (Yes/No)
    - Conciseness (1–5)
- [ ] **Pre-Interview Cheat Sheet Mode:**
  - One-click printable/modal cheat sheet aggregating:
    - Job description highlights & key skills.
    - Linked STAR stories.
    - Questions to ask the interviewer.

---

### Phase 4: Total Compensation & Offer Negotiation Calculator
*Objective: Equip users to navigate the highest-leverage moment of their career transition.*

- [ ] **Multi-Offer Side-by-Side Comparison Matrix:**
  - Input breakdown: Base Salary, Target Annual Bonus, Equity/RSU grant (4-year vesting schedule), Signing Bonus, 401(k) Match, Stipends.
  - First-year Total Cash Compensation vs. 4-Year Average Total Compensation calculator.
- [ ] **Cost of Living & Relocation Adjuster:**
  - Compare purchasing power across major hubs (SF, NYC, Austin, London, Remote).
- [ ] **Counter-Offer Script Playbook:**
  - Generate polite, professional counter-offer email templates configured for:
    - *Base Salary Bump (+5% to +15%)*
    - *Signing Bonus Adjustment*
    - *Equity / Stock Grant Rebalance*
    - *Remote Flexibility / Accelerating Review Cycle*

---

### Phase 5: Deep Contextual Copilot & Global Usability
*Objective: Unify all data streams into a cohesive, responsive companion.*

- [ ] **Real-time Context Inspector:**
  - Active context pill showing all active data sources: `[Resume: v2.pdf]` `[Target: Northstar Labs]` `[Gaps: Analytics, Ops]`.
  - Contextual prompt shortcuts based on current workspace (e.g. In Applications: *"What follow-up should I send today?"*).
- [ ] **Export & Data Portability Enhancements:**
  - Markdown / CSV export for applications and contacts.
  - Complete workspace JSON backup & one-click import restoration.

---

## 4. Proposed Navigation Hierarchy

```typescript
export const NAVIGATION_STRUCTURE = [
  { key: "dashboard",    label: "Dashboard",              icon: "LayoutDashboard" },
  { key: "copilot",      label: "AI Copilot",             icon: "Sparkles" },
  
  // Work
  { key: "jobs",         label: "Opportunity Desk",       icon: "BriefcaseBusiness", group: "Work" },
  { key: "applications", label: "Pipeline & Contacts",    icon: "Layers3" },
  { key: "offers",       label: "Offer & Compensation",   icon: "Calculator" },
  
  // Materials
  { key: "resume",       label: "Resume Studio",          icon: "FileText",          group: "Materials" },
  { key: "cover",        label: "Cover Letter Studio",    icon: "PenLine" },
  
  // Improve
  { key: "prep",         label: "Interview & STAR Bank",  icon: "MessageSquareCode", group: "Improve" },
  { key: "gaps",         label: "Skill Gaps",             icon: "Target" },
  { key: "match",        label: "Match Explanations",     icon: "Gauge" },
  
  // Account
  { key: "readiness",    label: "Career Readiness",       icon: "TrendingUp",        group: "Account" },
  { key: "settings",     label: "Settings & Backup",      icon: "Settings" }
];
```

---

## 5. Execution Sprints & Milestones

| Sprint | Milestones | Target Rating |
| :---: | :--- | :---: |
| **Sprint 1** | Custom Job Creator, Recruiter Contact CRM, Multi-round Interview Logger | **8.9 / 10** |
| **Sprint 2** | STAR Story Bank, Mock Interview Simulator with Timer, Pre-Interview Cheat Sheet | **9.2 / 10** |
| **Sprint 3** | Interactive Section Resume Editor, AI Bullet Enhancer, Real-Time ATS Matcher | **9.5 / 10** |
| **Sprint 4** | Total Compensation Matrix, Offer Negotiation Scripts, Contextual Copilot Shortcuts | **9.8 / 10** |
