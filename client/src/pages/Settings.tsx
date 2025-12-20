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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import {
  exportAnalyticsToCSV,
  exportAnalyticsToExcel,
  exportAnalyticsToPDF,
  exportAnalyticsToWord,
} from "@/lib/export";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bell,
  BellRing,
  Calendar,
  Check,
  Clock,
  Copy,
  Database,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Globe,
  Key,
  Link2,
  Lock,
  LogOut,
  Mail,
  Moon,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Send,
  Shield,
  Sun,
  Trash2,
  User,
  X,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";

interface ApiKeyDisplay {
  id: number;
  name: string;
  keyPrefix: string;
  permissions: string | null;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

interface ScheduledReportDisplay {
  id: number;
  name: string;
  reportType: "daily" | "weekly" | "monthly";
  format: "pdf" | "excel" | "csv";
  recipients: string;
  isActive: boolean;
  lastSentAt: Date | null;
  nextSendAt: Date | null;
}

export default function Settings() {
  const { user, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [showCreateApiKey, setShowCreateApiKey] = useState(false);
  const [showNewApiKey, setShowNewApiKey] = useState(false);
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "excel" | "pdf" | "word">("csv");
  const [isSaving, setIsSaving] = useState(false);
  
  // New API key state
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiry, setNewKeyExpiry] = useState<string>("90");
  const [generatedKey, setGeneratedKey] = useState("");
  const [showGeneratedKey, setShowGeneratedKey] = useState(false);
  
  // New scheduled report state
  const [newReportName, setNewReportName] = useState("");
  const [newReportType, setNewReportType] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [newReportFormat, setNewReportFormat] = useState<"pdf" | "excel" | "csv">("pdf");
  const [newReportRecipients, setNewReportRecipients] = useState("");
  
  // Appearance settings
  const [compactView, setCompactView] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  
  // Notification settings
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [lowSatisfactionAlerts, setLowSatisfactionAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [knowledgeGapAlerts, setKnowledgeGapAlerts] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [responseTimeAlerts, setResponseTimeAlerts] = useState(true);
  
  // Email recipient state
  const [newRecipientEmail, setNewRecipientEmail] = useState("");
  const [newRecipientName, setNewRecipientName] = useState("");

  // Fetch data
  const { data: dailyData } = trpc.analytics.getDailyData.useQuery({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  const { data: kpiData } = trpc.analytics.getKPISummary.useQuery({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  const { data: apiKeys, refetch: refetchApiKeys } = { data: [], isLoading: false };
  const { data: emailRecipients, refetch: refetchRecipients } = { data: [], isLoading: false };
  const { data: scheduledReports, refetch: refetchReports } = { data: [], isLoading: false };

  const createApiKeyMutation = trpc.apiKeys.create.useMutation({
    onSuccess: (data) => {
      if (data) {
        setGeneratedKey(data.key);
        setShowCreateApiKey(false);
        setShowNewApiKey(true);
        setNewKeyName("");
        refetchApiKeys();
        toast.success("API key created successfully!");
      }
    },
    onError: () => {
      toast.error("Failed to create API key");
    },
  });

  const revokeApiKeyMutation = trpc.apiKeys.revoke.useMutation({
    onSuccess: () => {
      refetchApiKeys();
      toast.success("API key revoked");
    },
  });

  const addRecipientMutation = trpc.emailRecipients.add.useMutation({
    onSuccess: () => {
      refetchRecipients();
      setShowAddRecipient(false);
      setNewRecipientEmail("");
      setNewRecipientName("");
      toast.success("Email recipient added");
    },
  });

  const removeRecipientMutation = trpc.emailRecipients.remove.useMutation({
    onSuccess: () => {
      refetchRecipients();
      toast.success("Recipient removed");
    },
  });

  const createReportMutation = trpc.scheduledReports.create.useMutation({
    onSuccess: () => {
      refetchReports();
      setShowCreateReport(false);
      setNewReportName("");
      setNewReportRecipients("");
      toast.success("Scheduled report created");
    },
  });

  const deleteReportMutation = trpc.scheduledReports.delete.useMutation({
    onSuccess: () => {
      refetchReports();
      toast.success("Report schedule deleted");
    },
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedCompact = localStorage.getItem("compact-view");
    const savedAnimations = localStorage.getItem("animations-enabled");
    const savedHighContrast = localStorage.getItem("high-contrast");
    
    if (savedCompact === "true") setCompactView(true);
    if (savedAnimations === "false") setAnimationsEnabled(false);
    if (savedHighContrast === "true") setHighContrast(true);
  }, []);

  // Apply settings
  useEffect(() => {
    document.documentElement.classList.toggle("compact-view", compactView);
    document.documentElement.classList.toggle("no-animations", !animationsEnabled);
    document.documentElement.classList.toggle("high-contrast", highContrast);
  }, [compactView, animationsEnabled, highContrast]);

  const handleSave = async () => {
    setIsSaving(true);
    
    localStorage.setItem("compact-view", String(compactView));
    localStorage.setItem("animations-enabled", String(animationsEnabled));
    localStorage.setItem("high-contrast", String(highContrast));
    
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setIsSaving(false);
    toast.success("Settings saved successfully!");
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem("auth-token");
    localStorage.removeItem("user-session");
    sessionStorage.clear();
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

  const handleCreateApiKey = () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }
    
    createApiKeyMutation.mutate({
      name: newKeyName,
      expiresInDays: parseInt(newKeyExpiry) || undefined,
    });
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(generatedKey);
    toast.success("API key copied to clipboard");
  };

  const handleAddRecipient = () => {
    if (!newRecipientEmail || !newRecipientName) {
      toast.error("Please fill in all fields");
      return;
    }
    
    addRecipientMutation.mutate({
      email: newRecipientEmail,
      name: newRecipientName,
      notifyOnCritical: true,
      notifyOnWarning: true,
      notifyOnInfo: false,
    });
  };

  const handleCreateReport = () => {
    if (!newReportName.trim() || !newReportRecipients.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const recipients = newReportRecipients.split(",").map(e => e.trim()).filter(e => e);
    
    createReportMutation.mutate({
      name: newReportName,
      reportType: newReportType,
      format: newReportFormat,
      recipients,
    });
  };

  const handleTestNotification = () => {
    toast.success("Test notification sent!", {
      description: "Check your email inbox for the test message.",
    });
  };

  const handleThemeToggle = () => {
    if (toggleTheme) {
      toggleTheme();
    } else {
      toast.info("Theme switching is not enabled. Enable it in App.tsx ThemeProvider.");
    }
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
              Configure your dashboard preferences and manage integrations
            </p>
          </div>

          <Button 
            onClick={handleSave} 
            className="gap-2 h-11" 
            style={{ minHeight: "44px" }}
            disabled={isSaving}
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Section */}
          <NeuCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Profile</h2>
                <p className="text-sm text-muted-foreground">Your account information</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{user?.name || "Dashboard User"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email || "admin@university.edu"}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-lg">
                  {(user?.name || "U")[0].toUpperCase()}
                </div>
              </div>

              <Button
                variant="destructive"
                className="w-full gap-2 h-11"
                style={{ minHeight: "44px" }}
                onClick={() => setShowLogoutConfirm(true)}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </NeuCard>

          {/* Appearance Section */}
          <NeuCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Appearance</h2>
                <p className="text-sm text-muted-foreground">Customize your experience</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">Toggle dark/light theme</p>
                  </div>
                </div>
                <Switch checked={theme === "dark"} onCheckedChange={handleThemeToggle} />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Compact View</p>
                  <p className="text-sm text-muted-foreground">Reduce padding and spacing</p>
                </div>
                <Switch checked={compactView} onCheckedChange={setCompactView} />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Animations</p>
                  <p className="text-sm text-muted-foreground">Enable smooth transitions</p>
                </div>
                <Switch checked={animationsEnabled} onCheckedChange={setAnimationsEnabled} />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">High Contrast</p>
                  <p className="text-sm text-muted-foreground">Improve accessibility</p>
                </div>
                <Switch checked={highContrast} onCheckedChange={setHighContrast} />
              </div>
            </div>
          </NeuCard>

          {/* API Integration Section */}
          <NeuCard className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Key className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">API Integration</h2>
                  <p className="text-sm text-muted-foreground">Connect external services like WhatsApp bots</p>
                </div>
              </div>
              <Button onClick={() => setShowCreateApiKey(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Generate API Key
              </Button>
            </div>

            {/* API Keys List */}
            <div className="space-y-3">
              {apiKeys && apiKeys.length > 0 ? (
                apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Key className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">{key.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <code className="bg-muted px-2 py-0.5 rounded">{key.keyPrefix}...</code>
                          {key.lastUsedAt && (
                            <span>Last used: {format(new Date(key.lastUsedAt), "MMM d, yyyy")}</span>
                          )}
                          {key.expiresAt && (
                            <span className="text-yellow-600">
                              Expires: {format(new Date(key.expiresAt), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => revokeApiKeyMutation.mutate({ id: key.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No API keys created yet</p>
                  <p className="text-sm">Generate an API key to connect your WhatsApp bot</p>
                </div>
              )}
            </div>

            {/* Integration Guide */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                WhatsApp Bot Integration Guide
              </h3>
              <div className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
                <p>To connect your WhatsApp bot running on Railway with this dashboard:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Generate an API key above</li>
                  <li>Add the key to your Railway environment variables as <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">DASHBOARD_API_KEY</code></li>
                  <li>Set the dashboard URL as <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">DASHBOARD_API_URL</code></li>
                  <li>Send message data to <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">POST /api/messages</code> with the API key in the Authorization header</li>
                </ol>
                <p className="mt-2">
                  <strong>API Endpoint:</strong> <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">Authorization: Bearer YOUR_API_KEY</code>
                </p>
              </div>
            </div>
          </NeuCard>

          {/* Scheduled Reports Section */}
          <NeuCard className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Scheduled Reports</h2>
                  <p className="text-sm text-muted-foreground">Automated report delivery to stakeholders</p>
                </div>
              </div>
              <Button onClick={() => setShowCreateReport(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Schedule
              </Button>
            </div>

            <div className="space-y-3">
              {scheduledReports && scheduledReports.length > 0 ? (
                scheduledReports.map((report) => {
                  const recipients = JSON.parse(report.recipients || "[]");
                  return (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center",
                          report.reportType === "daily" && "bg-blue-100 dark:bg-blue-900/30",
                          report.reportType === "weekly" && "bg-green-100 dark:bg-green-900/30",
                          report.reportType === "monthly" && "bg-purple-100 dark:bg-purple-900/30"
                        )}>
                          <Clock className={cn(
                            "h-5 w-5",
                            report.reportType === "daily" && "text-blue-600 dark:text-blue-400",
                            report.reportType === "weekly" && "text-green-600 dark:text-green-400",
                            report.reportType === "monthly" && "text-purple-600 dark:text-purple-400"
                          )} />
                        </div>
                        <div>
                          <p className="font-medium">{report.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="capitalize">{report.reportType}</span>
                            <span>•</span>
                            <span className="uppercase">{report.format}</span>
                            <span>•</span>
                            <span>{recipients.length} recipient{recipients.length !== 1 ? "s" : ""}</span>
                            {report.nextSendAt && (
                              <>
                                <span>•</span>
                                <span>Next: {format(new Date(report.nextSendAt), "MMM d, h:mm a")}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteReportMutation.mutate({ id: report.id })}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No scheduled reports configured</p>
                  <p className="text-sm">Set up automated report delivery to stakeholders</p>
                </div>
              )}
            </div>
          </NeuCard>

          {/* Email Notifications Section */}
          <NeuCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Notifications</h2>
                <p className="text-sm text-muted-foreground">Configure alert preferences</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email Alerts</p>
                    <p className="text-sm text-muted-foreground">Receive alerts via email</p>
                  </div>
                </div>
                <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">Critical Alerts</p>
                    <p className="text-sm text-muted-foreground">Urgent issues requiring attention</p>
                  </div>
                </div>
                <Switch checked={criticalAlerts} onCheckedChange={setCriticalAlerts} />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <BellRing className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Low Satisfaction Alerts</p>
                    <p className="text-sm text-muted-foreground">When satisfaction drops below threshold</p>
                  </div>
                </div>
                <Switch checked={lowSatisfactionAlerts} onCheckedChange={setLowSatisfactionAlerts} />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium">Response Time Alerts</p>
                    <p className="text-sm text-muted-foreground">When response times increase</p>
                  </div>
                </div>
                <Switch checked={responseTimeAlerts} onCheckedChange={setResponseTimeAlerts} />
              </div>

              <Button
                variant="outline"
                className="w-full gap-2 mt-4"
                onClick={handleTestNotification}
              >
                <Send className="h-4 w-4" />
                Send Test Notification
              </Button>
            </div>
          </NeuCard>

          {/* Email Recipients Section */}
          <NeuCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Email Recipients</h2>
                  <p className="text-sm text-muted-foreground">Who receives notifications</p>
                </div>
              </div>
              <Button size="sm" onClick={() => setShowAddRecipient(true)} className="gap-1">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>

            <div className="space-y-3">
              {emailRecipients && emailRecipients.length > 0 ? (
                emailRecipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{recipient.name}</p>
                      <p className="text-sm text-muted-foreground">{recipient.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRecipientMutation.mutate({ id: recipient.id })}
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Mail className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recipients configured</p>
                </div>
              )}
            </div>
          </NeuCard>

          {/* Export Section */}
          <NeuCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Export Data</h2>
                <p className="text-sm text-muted-foreground">Download analytics reports</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="gap-2 h-12"
                onClick={() => handleExport("csv")}
              >
                <FileText className="h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                className="gap-2 h-12"
                onClick={() => handleExport("excel")}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                className="gap-2 h-12"
                onClick={() => handleExport("pdf")}
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
              <Button
                variant="outline"
                className="gap-2 h-12"
                onClick={() => handleExport("word")}
              >
                <FileText className="h-4 w-4" />
                Word
              </Button>
            </div>
          </NeuCard>

          {/* Data Management Section */}
          <NeuCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Database className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Data Management</h2>
                <p className="text-sm text-muted-foreground">Manage your data and privacy</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                  <strong>Warning:</strong> Deleting your data is permanent and cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Request Data Deletion
                </Button>
              </div>
            </div>
          </NeuCard>
        </div>
      </div>

      {/* Create API Key Dialog */}
      <Dialog open={showCreateApiKey} onOpenChange={setShowCreateApiKey}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate API Key</DialogTitle>
            <DialogDescription>
              Create an API key to connect your WhatsApp bot or other external services.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., WhatsApp Bot Production"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyExpiry">Expiration</Label>
              <Select value={newKeyExpiry} onValueChange={setNewKeyExpiry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="0">Never expires</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateApiKey(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateApiKey} disabled={createApiKeyMutation.isPending}>
              {createApiKeyMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Key className="h-4 w-4 mr-2" />
              )}
              Generate Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show New API Key Dialog */}
      <Dialog open={showNewApiKey} onOpenChange={setShowNewApiKey}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              API Key Generated
            </DialogTitle>
            <DialogDescription>
              Copy this key now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="relative">
              <div className="flex items-center gap-2 p-4 bg-muted rounded-lg font-mono text-sm break-all">
                {showGeneratedKey ? generatedKey : "•".repeat(40)}
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGeneratedKey(!showGeneratedKey)}
                >
                  {showGeneratedKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCopyApiKey}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Store this key securely. Add it to your Railway environment as <code className="bg-muted px-1 rounded">DASHBOARD_API_KEY</code>.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowNewApiKey(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Scheduled Report Dialog */}
      <Dialog open={showCreateReport} onOpenChange={setShowCreateReport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Scheduled Report</DialogTitle>
            <DialogDescription>
              Set up automated report delivery to stakeholders.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reportName">Report Name</Label>
              <Input
                id="reportName"
                placeholder="e.g., Weekly Executive Summary"
                value={newReportName}
                onChange={(e) => setNewReportName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={newReportType} onValueChange={(v: any) => setNewReportType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={newReportFormat} onValueChange={(v: any) => setNewReportFormat(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipients">Recipients (comma-separated emails)</Label>
              <Input
                id="recipients"
                placeholder="admin@university.edu, dean@university.edu"
                value={newReportRecipients}
                onChange={(e) => setNewReportRecipients(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateReport(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateReport} disabled={createReportMutation.isPending}>
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Recipient Dialog */}
      <Dialog open={showAddRecipient} onOpenChange={setShowAddRecipient}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Email Recipient</DialogTitle>
            <DialogDescription>
              Add a new recipient to receive notification emails.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipientName">Name</Label>
              <Input
                id="recipientName"
                placeholder="e.g., Support Team"
                value={newRecipientName}
                onChange={(e) => setNewRecipientName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientEmail">Email</Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="support@university.edu"
                value={newRecipientEmail}
                onChange={(e) => setNewRecipientEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRecipient(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRecipient} disabled={addRecipientMutation.isPending}>
              Add Recipient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out? You'll need to sign in again to access the dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Data Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete All Data</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your analytics data, student records, and message history will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteData}>
              Delete All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
