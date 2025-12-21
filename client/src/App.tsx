import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Route, Switch } from "wouter";
import { DashboardLayout } from "./components/DashboardLayout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Messages from "./pages/Messages";
import Students from "./pages/Students";
import ROI from "./pages/ROI";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";

function Router() {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/login" component={Login} />
      ) : (
        <>
          <Route path="/" component={() => (
            <DashboardLayout>
              <Home />
            </DashboardLayout>
          )} />
          <Route path="/messages" component={() => (
            <DashboardLayout>
              <Messages />
            </DashboardLayout>
          )} />
          <Route path="/students" component={() => (
            <DashboardLayout>
              <Students />
            </DashboardLayout>
          )} />
          <Route path="/roi" component={() => (
            <DashboardLayout>
              <ROI />
            </DashboardLayout>
          )} />
          <Route path="/settings" component={() => (
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          )} />
          <Route path="/analytics" component={() => (
            <DashboardLayout>
              <Analytics />
            </DashboardLayout>
          )} />
        </>
      )}
      <Route path="/login" component={Login} />
      <Route>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
            <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </ThemeProvider>
  );
}