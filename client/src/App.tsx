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
import { useEffect } from "react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [location, navigate] = useLocation();
  
  // Check authentication from localStorage
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    if (!isAuthenticated && location !== '/login') {
      navigate('/login');
    }
  }, [isAuthenticated, location, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return <Component />;
}

function Router() {
  const [location] = useLocation();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  // If not authenticated and not on login page, redirect to login
  useEffect(() => {
    if (!isAuthenticated && location !== '/login') {
      window.location.href = '/login';
    }
  }, [isAuthenticated, location]);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} />} />
      <Route path="/roi" component={() => <ProtectedRoute component={ROI} />} />
      <Route path="/messages" component={() => <ProtectedRoute component={Messages} />} />
      <Route path="/students" component={() => <ProtectedRoute component={Students} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
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
