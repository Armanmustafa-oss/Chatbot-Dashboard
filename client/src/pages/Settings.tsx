import { DashboardLayout } from "@/components/DashboardLayout";
import { NeuCard } from "@/components/NeuCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Bell,
  Download,
  Globe,
  Lock,
  Mail,
  Palette,
  Save,
  Shield,
} from "lucide-react";

export default function Settings() {
  const handleSave = () => {
    toast.success("Settings saved successfully!");
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your dashboard preferences
          </p>
        </div>

        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Email Alerts</p>
                <p className="text-sm text-muted-foreground">Receive daily summary emails</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Low Satisfaction Alerts</p>
                <p className="text-sm text-muted-foreground">Alert when satisfaction drops below 80%</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Weekly Reports</p>
                <p className="text-sm text-muted-foreground">Receive weekly analytics reports</p>
              </div>
              <Switch />
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
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Use dark theme</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Compact View</p>
                <p className="text-sm text-muted-foreground">Show more data in less space</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Animations</p>
                <p className="text-sm text-muted-foreground">Enable UI animations</p>
              </div>
              <Switch defaultChecked />
            </div>
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
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Data Retention</p>
                <p className="text-sm text-muted-foreground">Keep data for 90 days</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Anonymous Analytics</p>
                <p className="text-sm text-muted-foreground">Share anonymous usage data</p>
              </div>
              <Switch />
            </div>
          </div>
        </NeuCard>

        {/* Export */}
        <NeuCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Download className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Export Data</h3>
              <p className="text-sm text-muted-foreground">Download your analytics data</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2 neu-flat border-0">
              <Download className="h-4 w-4" />
              Export Messages (CSV)
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 neu-flat border-0">
              <Download className="h-4 w-4" />
              Export Analytics (CSV)
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 neu-flat border-0">
              <Download className="h-4 w-4" />
              Export Full Report (PDF)
            </Button>
          </div>
        </NeuCard>

        {/* Integration */}
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
                <p className="font-medium text-foreground">API Key</p>
              </div>
              <p className="text-sm text-muted-foreground font-mono bg-muted/50 p-2 rounded">
                ••••••••••••••••••••
              </p>
              <Button variant="link" className="p-0 h-auto mt-2 text-primary">
                Regenerate Key
              </Button>
            </div>
            <div className="p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium text-foreground">Webhook URL</p>
              </div>
              <input
                type="text"
                placeholder="https://your-webhook-url.com"
                className="w-full text-sm bg-muted/50 p-2 rounded border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </NeuCard>
      </div>
    </DashboardLayout>
  );
}
