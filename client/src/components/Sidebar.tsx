import { Link, useLocation } from "wouter";
import { LayoutGrid, BarChart3, TrendingUp, MessageSquare, Users, Settings, LogOut } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
          <span className="text-lg font-bold text-sidebar-primary-foreground">E</span>
        </div>
        <div>
          <h1 className="font-bold text-sidebar-foreground">EduBot</h1>
          <p className="text-xs text-sidebar-accent">Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav mt-8">
        <Link href="/">
          <a className={`sidebar-item ${isActive("/") ? "active" : ""}`}>
            <LayoutGrid size={20} />
            <span>Overview</span>
          </a>
        </Link>

        <Link href="/analytics">
          <a className={`sidebar-item ${isActive("/analytics") ? "active" : ""}`}>
            <BarChart3 size={20} />
            <span>Analytics</span>
          </a>
        </Link>

        <Link href="/roi">
          <a className={`sidebar-item ${isActive("/roi") ? "active" : ""}`}>
            <TrendingUp size={20} />
            <span>ROI Intelligence</span>
          </a>
        </Link>

        <Link href="/messages">
          <a className={`sidebar-item ${isActive("/messages") ? "active" : ""}`}>
            <MessageSquare size={20} />
            <span>Messages</span>
          </a>
        </Link>

        <Link href="/students">
          <a className={`sidebar-item ${isActive("/students") ? "active" : ""}`}>
            <Users size={20} />
            <span>Students</span>
          </a>
        </Link>

        <Link href="/settings">
          <a className={`sidebar-item ${isActive("/settings") ? "active" : ""}`}>
            <Settings size={20} />
            <span>Settings</span>
          </a>
        </Link>
      </nav>

      {/* Logout */}
      <div className="absolute bottom-6 left-6 right-6">
        <button
          onClick={() => {
            localStorage.removeItem("isAuthenticated");
            window.location.href = "/login";
          }}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-400 transition-colors hover:bg-red-500/10"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
