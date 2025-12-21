import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Route, Switch, useLocation } from "wouter";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Messages from "./pages/Messages";
import Students from "./pages/Students";
import ROI from "./pages/ROI";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/login" component={Login} />
          <ProtectedRoute path="/" component={Home} />
          <ProtectedRoute path="/messages" component={Messages} />
          <ProtectedRoute path="/students" component={Students} />
          <ProtectedRoute path="/roi" component={ROI} />
          <ProtectedRoute path="/settings" component={Settings} />
          <ProtectedRoute path="/analytics" component={Analytics} />
          <Route>
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
                <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
                <button 
                  onClick={() => window.location.href = '/'} 
                  className="mt-4 text-primary hover:underline"
                >
                  Go Home
                </button>
              </div>
            </div>
          </Route>
        </Switch>
      </TooltipProvider>
    </ThemeProvider>
  );
}

// Protected route component
function ProtectedRoute({ path, component: Component }: { path: string; component: React.ComponentType }) {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const [, navigate] = useLocation();
  
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }
  
  return <Component />;
}