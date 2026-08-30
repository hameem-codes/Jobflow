import { Link } from "wouter";
import { ArrowUpRight, SearchX } from "lucide-react";

const mark = "/jobflow-mark.svg";

export default function NotFound() {
  return (
    <div className="public-page landing-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="public-nav">
        <Link href="/" className="public-brand">
          <img src={mark} alt="Jobflow mark" />
          <span>jobflow</span>
        </Link>
      </header>
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: "420px", width: "100%", padding: "50px 30px" }}>
          <div className="empty-state__icon" style={{ marginBottom: "20px" }}>
            <SearchX size={18} />
          </div>
          <div className="eyebrow">404 Error</div>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: "32px", fontWeight: 600, margin: "10px 0 15px", letterSpacing: "-0.03em" }}>
            Page not found.
          </h2>
          <p style={{ color: "#81867c", fontSize: "12px", lineHeight: 1.55, marginBottom: "30px", maxWidth: "280px" }}>
            We couldn't find the page you were looking for. It may have been moved or the URL might be incorrect.
          </p>
          <Link href="/" className="button button--lime">
            Return to start <ArrowUpRight size={15} />
          </Link>
        </div>
      </main>
    </div>
  );
}
