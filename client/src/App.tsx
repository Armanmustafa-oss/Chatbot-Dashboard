import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Analytics from "./pages/Analytics";
import Messages from "./pages/Messages";
import Students from "./pages/Students";
import Settings from "./pages/Settings";
import ROI from "./pages/ROI";
import Login from "./pages/Login";
import { useEffect, useState } from "react";

function Router() {
  const [location, navigate] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on mount and when location changes
  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated') === 'true';
    setIsAuthenticated(auth);
    setIsLoading(false);

    // If not authenticated and not on login page, redirect to login
    if (!auth && location !== '/login') {
      navigate('/login');
    }
  }, [location, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {isAuthenticated ? (
        <>
          <Route path="/" component={Home} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/roi" component={ROI} />
          <Route path="/messages" component={Messages} />
          <Route path="/students" component={Students} />
          <Route path="/settings" component={Settings} />
        </>
      ) : (
        <Route path="*" component={Login} />
      )}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
