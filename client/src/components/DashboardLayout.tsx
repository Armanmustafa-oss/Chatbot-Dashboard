import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BarChart3,
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

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth();

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

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/" },
    { icon: BarChart3, label: "Analytics", href: "/analytics" },
    { icon: PieChart, label: "ROI Intelligence", href: "/roi" },
    { icon: MessageSquare, label: "Messages", href: "/messages" },
    { icon: Users, label: "Students", href: "/students" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const handleLogout = async () => {
    await logout();
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
          "fixed left-0 top-0 z-50 h-screen w-72 transition-transform duration-300 ease-in-out bg-background border-r border-border",
          "md:translate-x-0 md:w-64",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full px-4 py-6 flex flex-col overflow-y-auto">
          {/* Logo - Hidden on mobile (shown in header) */}
          <div className="hidden md:flex items-center gap-3 px-4 mb-10">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Home className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">EduBot</span>
          </div>

          {/* Mobile close button area */}
          <div className="md:hidden flex justify-end mb-4">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              style={{ minWidth: "44px", minHeight: "44px" }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group touch-manipulation",
                      isActive
                        ? "neu-pressed text-primary font-bold"
                        : "hover:bg-white/40 hover:shadow-sm text-muted-foreground active:bg-muted"
                    )}
                    style={{ minHeight: "48px" }}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        isActive ? "text-primary" : "group-hover:text-foreground"
                      )}
                    />
                    <span className="text-base">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="mt-auto space-y-4 px-2">
            {user && (
              <div className="p-3 rounded-xl bg-muted/30">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.name || "Administrator"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.role || "Admin"}
                </p>
              </div>
            )}

            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={loading}
              className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10 border-0 neu-flat"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </Button>

            {/* Pro Plan Card */}
            <div className="neu-flat p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent">
              <h4 className="font-bold text-sm mb-1">Pro Plan</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Get advanced AI insights
              </p>
              <Button
                size="sm"
                className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-lg h-10"
              >
                Upgrade
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          "pt-16 md:pt-0", // Account for mobile header
          "px-4 py-6 md:p-8 md:ml-64"
        )}
      >
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
