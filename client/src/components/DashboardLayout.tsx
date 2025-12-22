import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
// import { useAuth } from "@/_core/hooks/useAuth";
import { NotificationBell } from "./NotificationBell";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PieChart,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Get user from localStorage
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const loading = false;
  const userJson = localStorage.getItem('user') || '{}';
  const user = JSON.parse(userJson);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Close mobile menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load sidebar collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") {
      setIsSidebarCollapsed(true);
    }
  }, []);

  // Save sidebar collapsed state
  const toggleSidebarCollapse = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/" },
    { icon: BarChart3, label: "Analytics", href: "/analytics" },
    { icon: PieChart, label: "ROI Intelligence", href: "/roi" },
    { icon: MessageSquare, label: "Messages", href: "/messages" },
    { icon: Users, label: "Students", href: "/students" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Clear any local storage tokens
      localStorage.removeItem("auth-token");
      localStorage.removeItem("user-session");
      sessionStorage.clear();
      
      // Logout is handled by clearing localStorage
      
      // Show success message
      toast.success("Logged out successfully", {
        description: "You have been securely logged out.",
      });
      
      // Redirect to home/login
      navigate("/");
    } catch (error) {
      toast.error("Logout failed", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex text-foreground font-sans">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">EduBot</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Notification Bell - Mobile */}
            <NotificationBell />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-muted transition-colors touch-manipulation"
              style={{ minWidth: "44px", minHeight: "44px" }}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop always visible, Mobile slides in */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen transition-all duration-300 ease-in-out bg-background border-r border-border",
          "md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full",
          // Desktop width based on collapsed state
          isSidebarCollapsed ? "md:w-20" : "md:w-64"
        )}
      >
        <div className="h-full px-3 py-6 flex flex-col overflow-y-auto">
          {/* Logo - Hidden on mobile (shown in header) */}
          <div className={cn(
            "hidden md:flex items-center px-2 mb-8",
            isSidebarCollapsed ? "justify-center" : "justify-between"
          )}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 flex-shrink-0">
                <Home className="h-6 w-6 text-white" />
              </div>
              {!isSidebarCollapsed && (
                <span className="text-xl font-bold tracking-tight">EduBot</span>
              )}
            </div>
            {!isSidebarCollapsed && (
              <NotificationBell />
            )}
          </div>

          {/* Collapse Toggle Button - Desktop only */}
          <button
            onClick={toggleSidebarCollapse}
            className={cn(
              "hidden md:flex absolute top-20 -right-3 h-6 w-6 items-center justify-center rounded-full bg-background border border-border shadow-sm hover:bg-muted transition-colors z-10"
            )}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Mobile close button area */}
          <div className="md:hidden flex justify-end mb-4 px-1">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              style={{ minWidth: "44px", minHeight: "44px" }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer group touch-manipulation",
                      isActive
                        ? "neu-pressed text-primary font-bold"
                        : "hover:bg-white/40 hover:shadow-sm text-muted-foreground active:bg-muted",
                      isSidebarCollapsed && "md:justify-center md:px-2"
                    )}
                    style={{ minHeight: "48px" }}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        isActive ? "text-primary" : "group-hover:text-foreground"
                      )}
                    />
                    <span className={cn(
                      "text-base",
                      isSidebarCollapsed && "md:hidden"
                    )}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout - At Bottom */}
          <div className="mt-auto space-y-3 px-1">
            {/* Notification Bell when collapsed */}
            {isSidebarCollapsed && (
              <div className="hidden md:flex justify-center py-2">
                <NotificationBell />
              </div>
            )}

            {/* User Info */}
            {user?.name && !isSidebarCollapsed && (
              <div className="p-3 rounded-xl bg-muted/30">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.name || "Administrator"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.role || "Admin"}
                </p>
              </div>
            )}

            {/* Logout Button - Always at bottom */}
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(true)}
              disabled={loading}
              className={cn(
                "w-full gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10 border-0 neu-flat",
                isSidebarCollapsed ? "md:justify-center md:px-0" : "justify-start"
              )}
              title={isSidebarCollapsed ? "Logout" : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className={cn(isSidebarCollapsed && "md:hidden")}>Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          "pt-16 md:pt-0", // Account for mobile header
          "px-4 py-6 md:p-8",
          isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
        )}
      >
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          {children}
        </div>
      </main>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-destructive" />
              Confirm Logout
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to log out? You will need to sign in again to access the dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="gap-2"
            >
              {isLoggingOut ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Logout
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

<Button variant="ghost" onClick={() => {
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('user-session');
  window.location.href = '/login';
}}>
  Logout
</Button>