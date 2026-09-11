/* Jobflow Auth: auth is a quiet split-screen threshold into the same warm-paper Jobflow workspace. */
import { FormEvent, useState } from "react";
import { ArrowUpRight, Check, Loader2, LockKeyhole } from "lucide-react";
import { Link, useLocation } from "wouter";

const mark="/jobflow-mark.svg";

export default function Auth(){
  const [,setLocation]=useLocation();
  const mode=new URLSearchParams(window.location.search).get("mode")==="signup"?"signup":"login";
  const [isSignup,setIsSignup]=useState(mode==="signup");
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [name,setName]=useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (isSignup && !name.trim()) {
      setError("Add a name so your workspace knows what to call you.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address to continue.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${isSignup ? "signup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, ...(isSignup ? { name } : {}) }),
      });

      if (!res.ok) {
        let errData: any = null;
        try {
          errData = await res.json();
        } catch {
          // Non-JSON response body (e.g. gateway error)
        }

        const backendMsg = errData?.error?.message || errData?.message;
        if (res.status === 409 || (res.status === 400 && backendMsg?.toLowerCase().includes("already registered"))) {
          setError(backendMsg || "An account with this email already exists. Please log in.");
        } else if (res.status === 400) {
          setError(backendMsg || "Please check your details and try again.");
        } else if (res.status === 401 || res.status === 403) {
          setError(backendMsg || "Invalid email or password. Please check your credentials.");
        } else if (res.status === 429) {
          setError("Too many attempts. Please wait a moment and try again.");
        } else if (res.status >= 500) {
          setError(
            isSignup
              ? "Jobflow could not create your account right now. Please try again later."
              : "Jobflow could not log you in right now. Please try again later."
          );
        } else {
          setError(backendMsg || "Authentication failed. Please try again.");
        }
        setLoading(false);
        return;
      }

      setLocation("/app");
    } catch (err) {
      setError("Unable to reach Jobflow. Check that the server is running and try again.");
      setLoading(false);
    }
  };
  return <div className="auth-page"><section className="auth-art"><div className="auth-art-top"><Link href="/" className="public-brand"><img src={mark} alt="Jobflow mark"/><span>jobflow</span></Link><span className="auth-folio">PRIVATE / BY DESIGN</span></div><div className="auth-art-copy"><div className="eyebrow">A clearer place to begin</div><h1>Make the work<br/><em>count twice.</em></h1><p>Capture the thinking behind your next move, then turn it into momentum you can see.</p></div><div className="auth-art-graphic" aria-hidden="true"><svg width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="auth-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1"/></pattern><radialGradient id="auth-glow" cx="75%" cy="75%" r="60%"><stop offset="0%" stopColor="var(--lime)" stopOpacity="0.14"/><stop offset="100%" stopColor="var(--lime)" stopOpacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#auth-grid)"/><rect width="100%" height="100%" fill="url(#auth-glow)"/><circle cx="75%" cy="75%" r="180" stroke="rgba(217, 242, 74, 0.08)" strokeWidth="1" strokeDasharray="4 4"/><circle cx="75%" cy="75%" r="280" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1"/></svg></div></section><section className="auth-form-side"><div className="auth-form-wrap"><Link href="/" className="auth-mobile-brand public-brand"><img src={mark} alt="Jobflow mark"/><span>jobflow</span></Link><div className="auth-kicker"><LockKeyhole size={13}/> Your data stays yours</div><h2>{isSignup?"Start with a clearer workspace.":"Pick up where you left off."}</h2><p className="auth-lede">{isSignup?"Build a private workspace for the decisions that move your career forward.":"Your workspace is waiting — calm, focused, and ready for the next move."}</p><form onSubmit={submit} noValidate>{isSignup&&<label>Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" autoComplete="name"/></label>}<label>Email<input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" type="email" autoComplete="email"/></label><label>Password<input value={password} onChange={e=>setPassword(e.target.value)} placeholder="8+ characters" type="password" autoComplete={isSignup?"new-password":"current-password"}/></label>{error&&<p className="auth-error"><span/> {error}</p>}<button className="button button--lime auth-submit" disabled={loading}>{loading?<><Loader2 size={16} className="spin"/> Opening your workspace…</>:<>{isSignup?"Create workspace":"Log in"}<ArrowUpRight size={16}/></>}</button></form><div className="auth-divider"><span/> or continue with <span/></div><button type="button" className="auth-secondary" disabled>Continue with Google <span className="sample-badge">Coming soon</span></button><p className="auth-toggle">{isSignup?"Already have a workspace?":"New to Jobflow?"} <button onClick={()=>{setIsSignup(!isSignup);setError("")}}>{isSignup?"Log in":"Create an account"} <ArrowUpRight size={13}/></button></p><p className="auth-footnote"><Check size={13}/> By continuing, you agree to keep your workspace grounded in your own information.</p></div></section></div>;
}
