import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Route, Switch, useLocation } from "wouter";
import { DashboardLayout } from "./components/DashboardLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Messages from "./pages/Messages";
import Students from "./pages/Students";
import ROI from "./pages/ROI";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import { useEffect } from "react";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <Switch>
          {/* Public route */}
          <Route path="/login" component={Login} />
          
          {/* Protected routes with DashboardLayout */}
          <Route path="/">
            {() => (
              <DashboardLayout>
                <Home />
              </DashboardLayout>
            )}
          </Route>
          
          <Route path="/messages">
            {() => (
              <DashboardLayout>
                <Messages />
              </DashboardLayout>
            )}
          </Route>
          
          <Route path="/students">
            {() => (
              <DashboardLayout>
                <Students />
              </DashboardLayout>
            )}
          </Route>
          
          <Route path="/roi">
            {() => (
              <DashboardLayout>
                <ROI />
              </DashboardLayout>
            )}
          </Route>
          
          <Route path="/settings">
            {() => (
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            )}
          </Route>
          
          <Route path="/analytics">
            {() => (
              <DashboardLayout>
                <Analytics />
              </DashboardLayout>
            )}
          </Route>
          
          {/* 404 */}
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