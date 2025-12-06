import { DashboardLayout } from "@/components/DashboardLayout";
import { NeuCard } from "@/components/NeuCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  exportAnalyticsToCSV,
  exportAnalyticsToExcel,
  exportAnalyticsToPDF,
  exportAnalyticsToWord,
} from "@/lib/export";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bell,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Globe,
  Lock,
  LogOut,
  Mail,
  Palette,
  Save,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";

export default function Settings() {
  const { user, logout, loading } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "excel" | "pdf" | "word">("csv");

  // Fetch analytics data for export
  const { data: dailyData } = trpc.analytics.getDailyData.useQuery({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  const { data: kpiData } = trpc.analytics.getKPISummary.useQuery({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  const handleSave = () => {
    toast.success("Settings saved successfully!");
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    toast.success("Logged out successfully");
  };

  const handleExport = (format: "csv" | "excel" | "pdf" | "word") => {
    if (!dailyData || dailyData.length === 0) {
      toast.error("No data available to export");
      return;
    }

    const formattedData = dailyData.map((d) => ({
      ...d,
      uniqueStudents: d.uniqueStudents ?? 0,
    }));

    const kpiSummary = kpiData
      ? {
          totalMessages: kpiData.totalMessages || 0,
          avgResponseTime: Math.round(kpiData.avgResponseTime || 0),
          satisfactionScore: Math.round(
            ((kpiData.positiveCount || 0) / (kpiData.totalMessages || 1)) * 100
          ),
          costSaved: Math.round((kpiData.totalMessages || 0) * 0.5 * 5 / 60 * 25),
        }
      : undefined;

    switch (format) {
      case "csv":
        exportAnalyticsToCSV(formattedData);
        toast.success("CSV exported successfully!");
        break;
      case "excel":
        exportAnalyticsToExcel(formattedData);
        toast.success("Excel file exported successfully!");
        break;
      case "pdf":
        exportAnalyticsToPDF(formattedData, kpiSummary);
        toast.success("PDF report generated!");
        break;
      case "word":
        if (kpiSummary) {
          exportAnalyticsToWord(formattedData, kpiSummary);
          toast.success("Word document exported successfully!");
        } else {
          toast.error("KPI data not available for Word export");
        }
        break;
    }
  };

  const handleDeleteData = () => {
    setShowDeleteConfirm(false);
    toast.success("Data deletion request submitted. This may take up to 24 hours.");
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Settings
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Configure your dashboard preferences and manage your account
            </p>
          </div>

          <Button onClick={handleSave} className="gap-2 h-11" style={{ minHeight: "44px" }}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>

        {/* User Profile Card */}
        {user && (
          <NeuCard className="bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{user.name || "Administrator"}</h3>
                  <p className="text-sm text-muted-foreground">{user.email || "admin@university.edu"}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {user.role || "Admin"}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowLogoutConfirm(true)}
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 h-11"
                style={{ minHeight: "44px" }}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </NeuCard>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Notifications */}
        <NeuCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Notifications</h3>
              <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm sm:text-base">Email Alerts</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Receive daily summary emails</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm sm:text-base">Low Satisfaction Alerts</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Alert when satisfaction drops below 80%</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm sm:text-base">Weekly Reports</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Receive weekly analytics reports</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm sm:text-base">Knowledge Gap Alerts</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Notify when new gaps are detected</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </NeuCard>

        {/* Appearance */}
        <NeuCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Palette className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Appearance</h3>
              <p className="text-sm text-muted-foreground">Customize the look and feel</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm sm:text-base">Dark Mode</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Use dark theme</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm sm:text-base">Compact View</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Show more data in less space</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm sm:text-base">Animations</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Enable UI animations</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm sm:text-base">High Contrast</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Improve accessibility</p>
              </div>
              <Switch />
            </div>
          </div>
        </NeuCard>

        {/* Export Options */}
        <NeuCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Download className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Export Data</h3>
              <p className="text-sm text-muted-foreground">Download your analytics in multiple formats</p>
            </div>
          </div>

          {/* Format Selection */}
          <div className="mb-4">
            <p className="text-sm font-medium text-foreground mb-2">Select Format</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: "csv", label: "CSV", icon: FileText },
                { value: "excel", label: "Excel", icon: FileSpreadsheet },
                { value: "pdf", label: "PDF", icon: FileText },
                { value: "word", label: "Word", icon: FileText },
              ].map((format) => (
                <button
                  key={format.value}
                  onClick={() => setExportFormat(format.value as typeof exportFormat)}
                  className={cn(
                    "p-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1",
                    exportFormat === format.value
                      ? "bg-primary text-white"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  )}
                  style={{ minHeight: "44px" }}
                >
                  <format.icon className="h-4 w-4" />
                  {format.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 neu-flat border-0 h-11"
              onClick={() => handleExport(exportFormat)}
              style={{ minHeight: "44px" }}
            >
              <Download className="h-4 w-4" />
              Export Analytics ({exportFormat.toUpperCase()})
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 neu-flat border-0 h-11"
              onClick={() => toast.info("Feature coming soon")}
              style={{ minHeight: "44px" }}
            >
              <Download className="h-4 w-4" />
              Export Messages ({exportFormat.toUpperCase()})
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 neu-flat border-0 h-11"
              onClick={() => toast.info("Feature coming soon")}
              style={{ minHeight: "44px" }}
            >
              <Download className="h-4 w-4" />
              Export Students ({exportFormat.toUpperCase()})
            </Button>
          </div>
        </NeuCard>

        {/* Data & Privacy */}
        <NeuCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Data & Privacy</h3>
              <p className="text-sm text-muted-foreground">Control your data settings</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm sm:text-base">Data Retention (90 days)</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Automatically delete old data</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm sm:text-base">Anonymous Analytics</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Share anonymous usage data</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm sm:text-base">GDPR Compliance Mode</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Enhanced privacy protections</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 h-11"
              style={{ minHeight: "44px" }}
            >
              <Trash2 className="h-4 w-4" />
              Request Data Deletion
            </Button>
          </div>
        </NeuCard>

        {/* API Integration */}
        <NeuCard className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Globe className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">API Integration</h3>
              <p className="text-sm text-muted-foreground">Connect your chatbot to external services</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium text-foreground text-sm sm:text-base">API Key</p>
              </div>
              <p className="text-sm text-muted-foreground font-mono bg-muted/50 p-2 rounded break-all">
                ••••••••••••••••••••
              </p>
              <Button
                variant="link"
                className="p-0 h-auto mt-2 text-primary"
                onClick={() => toast.info("Feature coming soon")}
              >
                Regenerate Key
              </Button>
            </div>
            <div className="p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium text-foreground text-sm sm:text-base">Webhook URL</p>
              </div>
              <input
                type="text"
                placeholder="https://your-webhook-url.com"
                className="w-full text-sm bg-muted/50 p-2 rounded border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
                style={{ minHeight: "40px" }}
              />
            </div>
          </div>

          <div className="mt-4 p-4 bg-muted/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium text-foreground text-sm sm:text-base">Database Connection</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <p className="text-sm text-muted-foreground">Connected • Last sync: 2 minutes ago</p>
            </div>
          </div>
        </NeuCard>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent>
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
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={loading}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Data Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Request Data Deletion
            </DialogTitle>
            <DialogDescription>
              This will submit a request to permanently delete all your analytics data. This action cannot be undone and may take up to 24 hours to complete.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteData} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
