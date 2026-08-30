/* Editorial Signal: public-facing Jobflow pages use warm paper, ink hierarchy, chartreuse signals, hairline rules, and asymmetric editorial composition. */
import { ArrowUpRight, Check, ChevronRight, CircleHelp, FileText, Gauge, Layers3, PenLine, Sparkles, Target, TrendingUp } from "lucide-react";
import { Link } from "wouter";

const mark="/jobflow-mark.svg";
const desk="/jobflow-editorial-desk.svg";

const pillars=[
  [Sparkles,"AI Career Copilot","Think through the next move with a private partner that keeps your context in view."],
  [FileText,"Resume Studio","Turn your real experience into a clearer, more searchable point of view."],
  [Gauge,"Job Matching","See why a role fits, with signals you can inspect instead of a black-box score."],
  [Layers3,"Application Tracking","Keep every follow-up, conversation, and decision moving in one calm place."],
  [Target,"Skill Gaps","Spot the capability that keeps appearing in the roles you want next."],
  [TrendingUp,"Career Readiness","Build momentum with a focused scorecard, not another overwhelming backlog."],
] as const;

export default function Landing(){
  return <div className="public-page landing-page">
    <header className="public-nav"><Link href="/" className="public-brand"><img src={mark} alt="Jobflow mark"/><span>jobflow</span></Link><nav><a href="#how-it-works">How it works</a><a href="#features">The system</a><Link href="/auth">Log in <ArrowUpRight size={14}/></Link></nav><Link href="/auth?mode=signup" className="button button--lime">Get started <ArrowUpRight size={15}/></Link></header>
    <main>
      <section className="landing-hero"><div className="landing-hero-copy"><div className="eyebrow">A quieter way forward <span className="live-dot"/></div><h1>Your next move is already taking shape.</h1><p>Jobflow is an AI career copilot for the work between intention and opportunity — your resume, your search, your signal.</p><div className="hero-actions"><Link href="/auth?mode=signup" className="button button--lime">Get started <ArrowUpRight size={16}/></Link><a className="text-link" href="#how-it-works">See how it works <ArrowUpRight size={14}/></a></div><div className="landing-note"><Check size={15}/><span>Private by design. No invented experience. No noisy backlog.</span></div></div><div className="landing-hero-art"><img src={desk} alt="Editorial desk with a career planning signal"/><div className="hero-art__stamp">01<br/><span>signal / 26</span></div><div className="hero-folio">JOBFLOW<br/><span>career / operating system</span></div></div></section>
      <section className="public-rule"><span>For the thoughtful next move</span><span>Resume · roles · readiness</span></section>
      <section className="credibility-strip"><div><strong>6</strong><span>focused workspaces</span></div><div><strong>01</strong><span>clear signal at a time</span></div><div><strong>100%</strong><span>your entered context</span></div><blockquote>“A career system that gives the work somewhere to go.”</blockquote></section>
      <section className="landing-section" id="features"><div className="section-intro"><div className="eyebrow">The operating system</div><h2>Less career noise.<br/><em>More useful motion.</em></h2><p>Everything you need to move from “I should” to “I did” without turning your search into a second job.</p></div><div className="feature-grid">{pillars.map(([Icon,title,copy],i)=><article className={`card feature-card feature-card--${i+1}`} key={title}><span className="feature-index">0{i+1}</span><Icon size={21}/><h3>{title}</h3><p>{copy}</p><Link href={title==="AI Career Copilot"?"/copilot":title==="Resume Studio"?"/resume":title==="Job Matching"?"/jobs":"/auth?mode=signup"} className="text-link">Explore the workspace <ArrowUpRight size={14}/></Link></article>)}</div></section>
      <section className="how-section" id="how-it-works"><div className="how-art"><div className="how-art__circle"><span>your<br/>signal</span></div><div className="how-art__line"/></div><div className="how-copy"><div className="eyebrow">How it works</div><h2>Make the invisible work visible.</h2>{[["01","Bring your context","Start with what is true: your resume, your target role, and the opportunities you are considering."],["02","Find the signal","Jobflow surfaces the patterns — the proof worth repeating, the gap worth closing, the role worth a closer look."],["03","Take the next step","Turn a sharper insight into a real application, a better conversation, or a more deliberate week."]].map(([n,t,c])=><div className="how-step" key={n}><span>{n}</span><div><h3>{t}</h3><p>{c}</p></div><ChevronRight size={17}/></div>)}</div></section>
      <section className="closing-band"><div><div className="eyebrow">The work compounds</div><h2>Give your next move<br/><em>a place to begin.</em></h2></div><Link href="/auth?mode=signup" className="button button--lime">Build your workspace <ArrowUpRight size={16}/></Link></section>
    </main>
    <footer className="public-footer"><div className="footer-brand"><Link href="/" className="public-brand"><img src={mark} alt="Jobflow mark"/><span>jobflow</span></Link><p>Career / operating system</p></div><div className="footer-links"><div><span>Explore</span><a href="#features">The system</a><a href="#how-it-works">How it works</a></div><div><span>Workspace</span><Link href="/auth">Log in</Link><Link href="/auth?mode=signup">Sign up</Link></div><div><span>Built for</span><p>People making<br/>their next move.</p></div></div><small>© 2026 Jobflow. Your work, your signal.</small></footer>
  </div>
}
