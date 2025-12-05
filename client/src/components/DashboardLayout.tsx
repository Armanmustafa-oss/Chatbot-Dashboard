import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarChart3, Home, LayoutDashboard, MessageSquare, Settings, Users } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/" },
    { icon: BarChart3, label: "Analytics", href: "/analytics" },
    { icon: MessageSquare, label: "Messages", href: "/messages" },
    { icon: Users, label: "Students", href: "/students" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background flex text-foreground font-sans">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 transition-transform bg-background/50 backdrop-blur-sm border-r border-white/20",
          !isSidebarOpen && "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-full px-4 py-6 flex flex-col">
          <div className="flex items-center gap-3 px-4 mb-10">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Home className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">EduBot</span>
          </div>

          <nav className="space-y-4 flex-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                      isActive 
                        ? "neu-pressed text-primary font-bold" 
                        : "hover:bg-white/40 hover:shadow-sm text-muted-foreground"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "group-hover:text-foreground")} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-4">
            <div className="neu-flat p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent">
              <h4 className="font-bold text-sm mb-1">Pro Plan</h4>
              <p className="text-xs text-muted-foreground mb-3">Get advanced AI insights</p>
              <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-lg">
                Upgrade
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 p-4 md:p-8 md:ml-64",
      )}>
        <div className="max-w-7xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
