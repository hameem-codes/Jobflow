import { ArrowUpRight, SearchX } from "lucide-react";
import { Component, ReactNode } from "react";

const mark = "/jobflow-mark.svg";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="public-page landing-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <header className="public-nav">
            <a href="/" className="public-brand">
              <img src={mark} alt="Jobflow mark" />
              <span>jobflow</span>
            </a>
          </header>
          <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
            <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: "600px", width: "100%", padding: "50px 30px" }}>
              <div className="empty-state__icon" style={{ marginBottom: "20px" }}>
                <SearchX size={18} />
              </div>
              <div className="eyebrow">Application Error</div>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: "32px", fontWeight: 600, margin: "10px 0 15px", letterSpacing: "-0.03em" }}>
                An unexpected error occurred.
              </h2>
              <div style={{ background: "#f4f3ed", border: "1px solid var(--rule)", padding: "20px", textAlign: "left", width: "100%", marginBottom: "30px", overflow: "auto", maxHeight: "200px" }}>
                <pre style={{ fontSize: "11px", color: "#81867c", whiteSpace: "pre-wrap", margin: 0 }}>
                  {this.state.error?.stack}
                </pre>
              </div>
              <button onClick={() => window.location.reload()} className="button button--lime">
                Reload workspace <ArrowUpRight size={15} />
              </button>
            </div>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
