/* Editorial Signal: the app shell stays light, calm, and workspace-first; all navigation lives inside the Jobflow canvas. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import { JobflowProvider } from "./contexts/JobflowContext";

function Router() {
  return <Switch><Route path="/" component={Landing} /><Route path="/auth" component={Auth} /><Route path="/app" component={Home} /><Route path="/404" component={NotFound} /><Route path="/:rest*" component={Home} /><Route component={NotFound} /></Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><JobflowProvider><TooltipProvider><Toaster /><Router /></TooltipProvider></JobflowProvider></ThemeProvider></ErrorBoundary>;
}
