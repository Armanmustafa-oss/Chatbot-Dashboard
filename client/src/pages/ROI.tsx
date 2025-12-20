import { DashboardLayout } from "@/components/DashboardLayout";
import { DateRangePicker, DateRange } from "@/components/DateRangePicker";
import { NeuCard } from "@/components/NeuCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { formatResponseTime } from "@/lib/export-service";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  FileText,
  Lightbulb,
  PieChart,
  Shield,
  Target,
  TrendingUp,
  Users,
  Zap,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Eye,
  Settings,
  BookOpen,
  Award,
  Activity,
  Database,
  LineChart as LineChartIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  LineChart,
  Line,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Area,
  AreaChart,
} from "recharts";

interface Initiative {
  id: string;
  title: string;
  impact: "High" | "Medium" | "Low";
  effort: "High" | "Medium" | "Low";
  description: string;
  roi: string;
  timeline: string;
  complexity: number;
  requiredResources: string[];
  riskFactors: string[];
  successMetrics: string[];
  implementationSteps: { step: number; title: string; description: string; duration: string }[];
  studentCount: number;
  timeSavingsHours: number;
}

interface KnowledgeGap {
  topic: string;
  unanswered: number;
  potentialSavings: number;
  priority: "High" | "Medium" | "Low";
  studentCount: number;
  avgResponseTime: string;
  topQuestions: string[];
}

export default function ROI() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);
  const [selectedGap, setSelectedGap] = useState<KnowledgeGap | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("executive");
  
  // Cost calculator state
  const [avgHandlingTime, setAvgHandlingTime] = useState(5);
  const [hourlyRate, setHourlyRate] = useState(25);
  const [automationRate, setAutomationRate] = useState(62);

  // Fetch data
  const { data: kpiData, isLoading: isLoadingKPI } = trpc.analytics.getKPISummary.useQuery({
    startDate: dateRange.from,
    endDate: dateRange.to,
  });

  const { data: topQueries } = trpc.analytics.getTopQueries.useQuery({ limit: 10 });

  // Calculate ROI metrics with adjustable assumptions
  const roiMetrics = useMemo(() => {
    const totalMessages = kpiData?.totalMessages || 0;
    const botMonthlyCost = 500;

    const automatedQueries = Math.round(totalMessages * (automationRate / 100));
    const minutesSaved = automatedQueries * avgHandlingTime;
    const hoursSaved = minutesSaved / 60;
    const laborCostSaved = hoursSaved * hourlyRate;
    const netSavings = laborCostSaved - botMonthlyCost;
    const roi = botMonthlyCost > 0 ? ((netSavings / botMonthlyCost) * 100).toFixed(0) : 0;

    return {
      totalMessages,
      automatedQueries,
      hoursSaved: hoursSaved.toFixed(1),
      laborCostSaved: Math.round(laborCostSaved),
      botMonthlyCost,
      netSavings: Math.round(netSavings),
      roi,
      avgHandlingTime,
      hourlyRate,
      automationRate,
    };
  }, [kpiData, avgHandlingTime, hourlyRate, automationRate]);

  // Departmental data with drill-down info
  const departmentalData = useMemo(() => {
    return [
      {
        name: "Admissions",
        volume: 850,
        satisfaction: 92,
        size: 850,
        avgResponseTime: 1200,
        topQueries: ["Application status", "Deadline info", "Requirements"],
        staffSaved: 28,
        trend: "+12%",
        automationRate: 68,
      },
      {
        name: "Financial Aid",
        volume: 720,
        satisfaction: 78,
        size: 720,
        avgResponseTime: 1800,
        topQueries: ["FAFSA help", "Scholarship info", "Payment plans"],
        staffSaved: 24,
        trend: "-5%",
        automationRate: 54,
      },
      {
        name: "Registrar",
        volume: 650,
        satisfaction: 88,
        size: 650,
        avgResponseTime: 1400,
        topQueries: ["Transcript requests", "Course registration", "Grades"],
        staffSaved: 22,
        trend: "+8%",
        automationRate: 65,
      },
      {
        name: "IT Support",
        volume: 480,
        satisfaction: 85,
        size: 480,
        avgResponseTime: 1600,
        topQueries: ["Password reset", "WiFi issues", "Software access"],
        staffSaved: 16,
        trend: "+3%",
        automationRate: 72,
      },
      {
        name: "Library",
        volume: 320,
        satisfaction: 95,
        size: 320,
        avgResponseTime: 1100,
        topQueries: ["Book availability", "Study rooms", "Database access"],
        staffSaved: 11,
        trend: "+15%",
        automationRate: 78,
      },
      {
        name: "Housing",
        volume: 280,
        satisfaction: 72,
        size: 280,
        avgResponseTime: 2100,
        topQueries: ["Room assignments", "Move-in dates", "Maintenance"],
        staffSaved: 9,
        trend: "-8%",
        automationRate: 48,
      },
    ];
  }, []);

  // Knowledge gap priorities with expanded details
  const knowledgeGaps: KnowledgeGap[] = useMemo(() => {
    return [
      {
        topic: "Scholarship Application Deadlines",
        unanswered: 156,
        potentialSavings: 13,
        priority: "High",
        studentCount: 89,
        avgResponseTime: "N/A",
        topQuestions: [
          "When is the deadline for merit scholarships?",
          "Can I apply for multiple scholarships?",
          "What documents do I need for scholarship applications?",
        ],
      },
      {
        topic: "Transfer Credit Policies",
        unanswered: 124,
        potentialSavings: 10,
        priority: "High",
        studentCount: 67,
        avgResponseTime: "N/A",
        topQuestions: [
          "How do I transfer credits from community college?",
          "What's the minimum grade for transfer credits?",
          "How long does credit evaluation take?",
        ],
      },
      {
        topic: "Parking Permit Renewal",
        unanswered: 98,
        potentialSavings: 8,
        priority: "Medium",
        studentCount: 54,
        avgResponseTime: "N/A",
        topQuestions: [
          "How do I renew my parking permit?",
          "What are the parking permit costs?",
          "Can I get a refund on my parking permit?",
        ],
      },
      {
        topic: "Meal Plan Changes",
        unanswered: 76,
        potentialSavings: 6,
        priority: "Medium",
        studentCount: 42,
        avgResponseTime: "N/A",
        topQuestions: [
          "How do I change my meal plan?",
          "When can I modify my meal plan?",
          "What meal plan options are available?",
        ],
      },
      {
        topic: "Graduation Requirements",
        unanswered: 65,
        potentialSavings: 5,
        priority: "Medium",
        studentCount: 38,
        avgResponseTime: "N/A",
        topQuestions: [
          "What are the general education requirements?",
          "How many credits do I need to graduate?",
          "When should I apply for graduation?",
        ],
      },
    ];
  }, []);

  // Initiative recommendations with full implementation details
  const initiatives: Initiative[] = useMemo(() => {
    return [
      {
        id: "fin-aid",
        title: "Expand Financial Aid Content",
        impact: "High",
        effort: "Medium",
        description: "342 unanswered questions could save 12 staff hours monthly",
        roi: "+$3,600/year",
        timeline: "4-6 weeks",
        complexity: 65,
        requiredResources: [
          "Financial Aid office SME (10 hrs)",
          "Content writer (20 hrs)",
          "Bot training specialist (8 hrs)",
        ],
        riskFactors: [
          "Policy changes may require frequent updates",
          "Complex edge cases may still need human intervention",
          "Integration with financial systems may be needed",
        ],
        successMetrics: [
          "Reduce unanswered financial aid queries by 70%",
          "Improve satisfaction score to 85%+",
          "Decrease call center volume by 15%",
        ],
        implementationSteps: [
          { step: 1, title: "Content Audit", description: "Review existing FAQs and identify gaps", duration: "1 week" },
          { step: 2, title: "SME Interviews", description: "Gather information from Financial Aid staff", duration: "1 week" },
          { step: 3, title: "Content Creation", description: "Write and review new bot responses", duration: "2 weeks" },
          { step: 4, title: "Bot Training", description: "Train bot on new content and test", duration: "1 week" },
          { step: 5, title: "Soft Launch", description: "Deploy to subset of users for feedback", duration: "1 week" },
        ],
        studentCount: 342,
        timeSavingsHours: 12,
      },
      {
        id: "24-7",
        title: "Add 24/7 Coverage",
        impact: "Medium",
        effort: "Low",
        description: "Capture after-hours queries (currently 18% of traffic)",
        roi: "+$1,800/year",
        timeline: "1-2 weeks",
        complexity: 25,
        requiredResources: [
          "IT configuration (4 hrs)",
          "Monitoring setup (2 hrs)",
          "Documentation update (2 hrs)",
        ],
        riskFactors: [
          "May need escalation path for urgent issues",
          "After-hours monitoring may be needed initially",
        ],
        successMetrics: [
          "Capture 100% of after-hours queries",
          "Maintain 90%+ resolution rate",
          "Zero critical issues missed",
        ],
        implementationSteps: [
          { step: 1, title: "Configuration", description: "Enable 24/7 availability settings", duration: "2 days" },
          { step: 2, title: "Escalation Setup", description: "Configure urgent issue routing", duration: "2 days" },
          { step: 3, title: "Testing", description: "Verify after-hours functionality", duration: "3 days" },
          { step: 4, title: "Launch", description: "Enable and monitor", duration: "1 week" },
        ],
        studentCount: 180,
        timeSavingsHours: 6,
      },
      {
        id: "voice",
        title: "Voice Interaction Pilot",
        impact: "High",
        effort: "High",
        description: "Accessibility improvement for diverse student population",
        roi: "+$2,400/year",
        timeline: "8-12 weeks",
        complexity: 85,
        requiredResources: [
          "Voice AI platform license ($200/mo)",
          "Integration developer (40 hrs)",
          "Accessibility consultant (16 hrs)",
          "User testing participants (20 students)",
        ],
        riskFactors: [
          "Voice recognition accuracy for accents",
          "Integration complexity with existing systems",
          "Higher ongoing maintenance costs",
          "Privacy concerns with voice data",
        ],
        successMetrics: [
          "95%+ voice recognition accuracy",
          "20% adoption among accessibility users",
          "Positive feedback from 80%+ of pilot users",
        ],
        implementationSteps: [
          { step: 1, title: "Platform Selection", description: "Evaluate and select voice AI provider", duration: "2 weeks" },
          { step: 2, title: "Integration", description: "Connect voice platform to chatbot", duration: "3 weeks" },
          { step: 3, title: "Training", description: "Train voice model on common queries", duration: "2 weeks" },
          { step: 4, title: "Accessibility Testing", description: "Test with diverse user group", duration: "2 weeks" },
          { step: 5, title: "Pilot Launch", description: "Limited rollout to volunteer users", duration: "3 weeks" },
        ],
        studentCount: 120,
        timeSavingsHours: 8,
      },
      {
        id: "multilang",
        title: "Multi-language Support",
        impact: "Medium",
        effort: "Medium",
        description: "Support for international students (12% of population)",
        roi: "+$1,200/year",
        timeline: "6-8 weeks",
        complexity: 55,
        requiredResources: [
          "Translation service ($500)",
          "Multilingual content review (20 hrs)",
          "Bot configuration (8 hrs)",
        ],
        riskFactors: [
          "Translation quality for technical terms",
          "Ongoing translation maintenance",
          "Cultural context differences",
        ],
        successMetrics: [
          "Support 3+ languages",
          "85%+ satisfaction from international students",
          "Reduce language barrier complaints by 50%",
        ],
        implementationSteps: [
          { step: 1, title: "Language Selection", description: "Identify top 3 languages by student population", duration: "1 week" },
          { step: 2, title: "Content Translation", description: "Translate core content", duration: "3 weeks" },
          { step: 3, title: "Review", description: "Native speaker review of translations", duration: "1 week" },
          { step: 4, title: "Integration", description: "Configure language detection and switching", duration: "1 week" },
          { step: 5, title: "Testing", description: "Test with international student group", duration: "2 weeks" },
        ],
        studentCount: 240,
        timeSavingsHours: 4,
      },
    ];
  }, []);

  // Comparison data for previous period
  const comparisonData = useMemo(() => {
    return [
      { period: "Week 1", current: 850, previous: 720 },
      { period: "Week 2", current: 920, previous: 780 },
      { period: "Week 3", current: 1100, previous: 850 },
      { period: "Week 4", current: 980, previous: 890 },
    ];
  }, []);

  // Adoption metrics
  const adoptionMetrics = useMemo(() => {
    return {
      activeUsers: 47,
      sessionsPerWeek: 156,
      avgSessionDuration: "4.2 minutes",
      featureUtilization: [
        { feature: "Dashboard Overview", usage: 92 },
        { feature: "Message Search", usage: 78 },
        { feature: "Student Lookup", usage: 65 },
        { feature: "Analytics Export", usage: 43 },
        { feature: "ROI Reports", usage: 38 },
      ],
      satisfactionScore: 4.2,
      npsScore: 42,
    };
  }, []);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "High":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Low":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-red-600 dark:text-red-400";
      case "Medium":
        return "text-yellow-600 dark:text-yellow-400";
      case "Low":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600";
    }
  };

  const handleExportROIReport = (reportType: string) => {
    const report = {
      reportType,
      generatedAt: new Date().toISOString(),
      period: `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`,
      metrics: roiMetrics,
      departments: departmentalData,
      knowledgeGaps,
      initiatives: initiatives.map((i) => ({
        title: i.title,
        impact: i.impact,
        roi: i.roi,
        timeline: i.timeline,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${reportType} exported successfully`);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              ROI Intelligence Dashboard
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Strategic insights for institutional decision-making
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
            <div className="relative group">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Report
                <ChevronDown className="h-4 w-4" />
              </Button>
              <div className="absolute right-0 top-full mt-2 w-64 bg-popover border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => handleExportROIReport("Executive ROI Report")}
                    className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4 text-blue-500" />
                    Executive ROI Report
                  </button>
                  <button
                    onClick={() => handleExportROIReport("Quarterly Performance Report")}
                    className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm flex items-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4 text-green-500" />
                    Quarterly Performance
                  </button>
                  <button
                    onClick={() => handleExportROIReport("Budget Justification Report")}
                    className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm flex items-center gap-2"
                  >
                    <DollarSign className="h-4 w-4 text-yellow-500" />
                    Budget Justification
                  </button>
                  <button
                    onClick={() => handleExportROIReport("Custom Analysis Report")}
                    className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4 text-purple-500" />
                    Custom Analysis
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary Section */}
        <NeuCard className="border-l-4 border-l-primary">
          <button
            className="w-full p-6 flex items-center justify-between"
            onClick={() => toggleSection("executive")}
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold">Executive Summary</h2>
                <p className="text-sm text-muted-foreground">Strategic value proposition at a glance</p>
              </div>
            </div>
            <ChevronRight className={cn("h-5 w-5 transition-transform", expandedSection === "executive" && "rotate-90")} />
          </button>
          
          {expandedSection === "executive" && (
            <div className="px-6 pb-6 space-y-6">
              <div className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl">
                <p className="text-lg leading-relaxed">
                  This dashboard transforms student support from a <strong>cost center into a strategic asset</strong> by 
                  automating <strong>{roiMetrics.automationRate}%</strong> of routine inquiries, enabling real-time issue 
                  detection that prevents crises, and providing data-driven insights that guide resource allocation decisions. 
                  The system has saved an estimated <strong>{roiMetrics.hoursSaved} staff hours</strong> this period valued 
                  at <strong>${roiMetrics.laborCostSaved.toLocaleString()}</strong> while improving operational efficiency 
                  across all departments.
                </p>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl text-center">
                  <p className="text-3xl font-bold text-green-600">{roiMetrics.automationRate}%</p>
                  <p className="text-sm text-muted-foreground">Self-Service Rate</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-center">
                  <p className="text-3xl font-bold text-blue-600">{roiMetrics.hoursSaved}</p>
                  <p className="text-sm text-muted-foreground">Hours Saved</p>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-xl text-center">
                  <p className="text-3xl font-bold text-yellow-600">${roiMetrics.laborCostSaved.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Cost Savings</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl text-center">
                  <p className="text-3xl font-bold text-purple-600">{roiMetrics.roi}%</p>
                  <p className="text-sm text-muted-foreground">ROI</p>
                </div>
              </div>
            </div>
          )}
        </NeuCard>

        {/* Section 1: Eliminating Siloed Data */}
        <NeuCard>
          <button
            className="w-full p-6 flex items-center justify-between"
            onClick={() => toggleSection("data")}
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold">Eliminating Siloed Data</h2>
                <p className="text-sm text-muted-foreground">Unified data repository replacing manual reporting</p>
              </div>
            </div>
            <ChevronRight className={cn("h-5 w-5 transition-transform", expandedSection === "data" && "rotate-90")} />
          </button>
          
          {expandedSection === "data" && (
            <div className="px-6 pb-6 space-y-6">
              <p className="text-muted-foreground">
                Before implementing this chatbot dashboard, student support data was scattered across email archives, 
                ticketing systems, spreadsheets, and phone logs. Generating quarterly reports required staff to spend 
                days aggregating data manually.
              </p>

              {/* Before/After Comparison */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900">
                  <h3 className="font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Before: Manual Process
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      3 days to generate quarterly report
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      48 staff hours per quarter
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Data from 5+ disconnected sources
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      High error rate from manual entry
                    </li>
                  </ul>
                </div>
                <div className="p-6 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-900">
                  <h3 className="font-bold text-green-700 dark:text-green-400 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    After: Automated Dashboard
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      15 minutes to generate any report
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Real-time data, always current
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Single source of truth
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Zero manual data entry
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">99.3%</p>
                <p className="text-sm text-muted-foreground">Time savings on report generation</p>
              </div>
            </div>
          )}
        </NeuCard>

        {/* Section 2: Real-Time Visibility */}
        <NeuCard>
          <button
            className="w-full p-6 flex items-center justify-between"
            onClick={() => toggleSection("visibility")}
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Eye className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold">Real-Time Visibility</h2>
                <p className="text-sm text-muted-foreground">Proactive management through continuous monitoring</p>
              </div>
            </div>
            <ChevronRight className={cn("h-5 w-5 transition-transform", expandedSection === "visibility" && "rotate-90")} />
          </button>
          
          {expandedSection === "visibility" && (
            <div className="px-6 pb-6 space-y-6">
              <p className="text-muted-foreground">
                Traditional monthly reporting means issues fester for weeks before appearing in official reports. 
                The dashboard enables real-time visibility through continuously updating metrics and automated alerts.
              </p>

              {/* Alert Prevention Timeline */}
              <div className="space-y-4">
                <h3 className="font-semibold">Early Detection Prevented Issues</h3>
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Housing Policy Confusion Detected</p>
                      <p className="text-sm text-muted-foreground">
                        Caught 47% spike in housing questions within 2 hours. Prevented estimated 300 additional 
                        confused students and 8 hours of staff time.
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium text-green-600">$200 saved</p>
                      <p className="text-muted-foreground">8 hrs prevented</p>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Financial Aid Deadline Surge</p>
                      <p className="text-sm text-muted-foreground">
                        Identified 3x increase in FAFSA questions 48 hours before deadline. Proactively updated 
                        bot responses and prevented call center overflow.
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium text-green-600">$450 saved</p>
                      <p className="text-muted-foreground">18 hrs prevented</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </NeuCard>

        {/* Section 3: Operational Efficiency - Interactive Cost Calculator */}
        <NeuCard>
          <button
            className="w-full p-6 flex items-center justify-between"
            onClick={() => toggleSection("efficiency")}
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold">Operational Efficiency & ROI</h2>
                <p className="text-sm text-muted-foreground">Interactive cost savings calculator with adjustable assumptions</p>
              </div>
            </div>
            <ChevronRight className={cn("h-5 w-5 transition-transform", expandedSection === "efficiency" && "rotate-90")} />
          </button>
          
          {expandedSection === "efficiency" && (
            <div className="px-6 pb-6 space-y-6">
              {/* Self-Service Rate Highlight */}
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl text-center">
                <p className="text-5xl font-bold text-green-600">{roiMetrics.automationRate}%</p>
                <p className="text-lg font-medium mt-2">Self-Service Resolution Rate</p>
                <p className="text-sm text-muted-foreground mt-1">
                  The bot successfully answered {roiMetrics.automationRate}% of all student queries without human intervention
                </p>
              </div>

              {/* Interactive Cost Calculator */}
              <div className="p-6 border rounded-xl space-y-6">
                <h3 className="font-bold flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Adjust Assumptions to Calculate Your ROI
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      Avg. Handling Time per Query: <span className="text-primary">{avgHandlingTime} minutes</span>
                    </label>
                    <Slider
                      value={[avgHandlingTime]}
                      onValueChange={(v) => setAvgHandlingTime(v[0])}
                      min={1}
                      max={15}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">Industry average: 5-7 minutes</p>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      Staff Hourly Rate: <span className="text-primary">${hourlyRate}/hr</span>
                    </label>
                    <Slider
                      value={[hourlyRate]}
                      onValueChange={(v) => setHourlyRate(v[0])}
                      min={15}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">Including benefits & overhead</p>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      Automation Rate: <span className="text-primary">{automationRate}%</span>
                    </label>
                    <Slider
                      value={[automationRate]}
                      onValueChange={(v) => setAutomationRate(v[0])}
                      min={30}
                      max={90}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">Current measured rate: 62%</p>
                  </div>
                </div>

                <Separator />

                {/* Calculated Results */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{roiMetrics.totalMessages.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Queries</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{roiMetrics.automatedQueries.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Automated</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{roiMetrics.hoursSaved}</p>
                    <p className="text-xs text-muted-foreground">Hours Saved</p>
                  </div>
                  <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">${roiMetrics.laborCostSaved.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Cost Savings</p>
                  </div>
                </div>

                {/* Calculation Breakdown */}
                <div className="p-4 bg-muted/50 rounded-lg text-sm font-mono">
                  <p>Calculation: {roiMetrics.automatedQueries.toLocaleString()} queries × {avgHandlingTime} min ÷ 60 = {roiMetrics.hoursSaved} hours</p>
                  <p>{roiMetrics.hoursSaved} hours × ${hourlyRate}/hr = ${roiMetrics.laborCostSaved.toLocaleString()} saved</p>
                  <p>Net ROI: ${roiMetrics.laborCostSaved.toLocaleString()} - ${roiMetrics.botMonthlyCost} (bot cost) = ${roiMetrics.netSavings.toLocaleString()}</p>
                </div>
              </div>

              {/* Bot vs Human Comparison */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Response Time</span>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Bot</span>
                      <span className="font-bold text-green-600">~3 seconds</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Human</span>
                      <span className="text-muted-foreground">~5 minutes</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Availability</span>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Bot</span>
                      <span className="font-bold text-green-600">24/7/365</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Human</span>
                      <span className="text-muted-foreground">Business hours</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Consistency</span>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Bot</span>
                      <span className="font-bold text-green-600">100% consistent</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Human</span>
                      <span className="text-muted-foreground">Variable</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </NeuCard>

        {/* Section 4: Compliance & Quality Control */}
        <NeuCard>
          <button
            className="w-full p-6 flex items-center justify-between"
            onClick={() => toggleSection("compliance")}
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold">Compliance & Quality Control</h2>
                <p className="text-sm text-muted-foreground">Audit capabilities and accountability measures</p>
              </div>
            </div>
            <ChevronRight className={cn("h-5 w-5 transition-transform", expandedSection === "compliance" && "rotate-90")} />
          </button>
          
          {expandedSection === "compliance" && (
            <div className="px-6 pb-6 space-y-6">
              <p className="text-muted-foreground">
                The dashboard maintains comprehensive audit logs and quality metrics to ensure accountability 
                and compliance with institutional standards.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-lg space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Audit Log Capabilities
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Complete interaction history with timestamps
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Student identifiers (privacy-protected)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Full message content and bot responses
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Categorization and sentiment analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Satisfaction ratings and feedback
                    </li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-lg space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Quality Metrics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">First Response Time</span>
                      <span className="font-bold text-green-600">&lt; 3 seconds</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Escalation Rate</span>
                      <span className="font-bold">{100 - roiMetrics.automationRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Accuracy Score</span>
                      <span className="font-bold text-green-600">94%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Data Retention</span>
                      <span className="font-bold">90 days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </NeuCard>

        {/* Section 5: Adoption Success */}
        <NeuCard>
          <button
            className="w-full p-6 flex items-center justify-between"
            onClick={() => toggleSection("adoption")}
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold">Adoption Success</h2>
                <p className="text-sm text-muted-foreground">Dashboard usage and administrator satisfaction</p>
              </div>
            </div>
            <ChevronRight className={cn("h-5 w-5 transition-transform", expandedSection === "adoption" && "rotate-90")} />
          </button>
          
          {expandedSection === "adoption" && (
            <div className="px-6 pb-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{adoptionMetrics.activeUsers}</p>
                  <p className="text-xs text-muted-foreground">Active Users</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{adoptionMetrics.sessionsPerWeek}</p>
                  <p className="text-xs text-muted-foreground">Sessions/Week</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{adoptionMetrics.avgSessionDuration}</p>
                  <p className="text-xs text-muted-foreground">Avg. Session</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-500">
                    {"★".repeat(Math.round(adoptionMetrics.satisfactionScore))}
                  </p>
                  <p className="text-xs text-muted-foreground">{adoptionMetrics.satisfactionScore}/5 Satisfaction</p>
                </div>
              </div>

              {/* Feature Utilization */}
              <div className="space-y-3">
                <h3 className="font-semibold">Feature Utilization</h3>
                {adoptionMetrics.featureUtilization.map((item) => (
                  <div key={item.feature} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.feature}</span>
                      <span className="font-medium">{item.usage}%</span>
                    </div>
                    <Progress value={item.usage} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </NeuCard>

        {/* Section 6: Strategic Recommendations */}
        <NeuCard>
          <button
            className="w-full p-6 flex items-center justify-between"
            onClick={() => toggleSection("recommendations")}
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Lightbulb className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold">Strategic Recommendations</h2>
                <p className="text-sm text-muted-foreground">Prioritized initiatives with implementation roadmaps</p>
              </div>
            </div>
            <ChevronRight className={cn("h-5 w-5 transition-transform", expandedSection === "recommendations" && "rotate-90")} />
          </button>
          
          {expandedSection === "recommendations" && (
            <div className="px-6 pb-6 space-y-4">
              {initiatives.map((initiative) => (
                <div
                  key={initiative.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedInitiative(initiative)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{initiative.title}</h3>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getImpactColor(initiative.impact))}>
                          {initiative.impact} Impact
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{initiative.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          {initiative.roi}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-blue-500" />
                          {initiative.timeline}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-purple-500" />
                          {initiative.studentCount} students
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </NeuCard>

        {/* Departmental Performance */}
        <NeuCard className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Departmental Performance Matrix
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="volume" name="Query Volume" domain={[0, 1000]} />
                <YAxis type="number" dataKey="satisfaction" name="Satisfaction" domain={[60, 100]} />
                <ZAxis type="number" dataKey="size" range={[100, 500]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border rounded-lg p-3 shadow-lg">
                          <p className="font-bold">{data.name}</p>
                          <p className="text-sm">Volume: {data.volume} queries</p>
                          <p className="text-sm">Satisfaction: {data.satisfaction}%</p>
                          <p className="text-sm">Automation: {data.automationRate}%</p>
                          <p className="text-sm">Trend: {data.trend}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter
                  data={departmentalData}
                  fill="#8884d8"
                  onClick={(data) => setSelectedDepartment(data)}
                >
                  {departmentalData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.satisfaction >= 85 ? "#22c55e" : entry.satisfaction >= 75 ? "#eab308" : "#ef4444"}
                      cursor="pointer"
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Click on a bubble to view department details. Size = query volume, Color = satisfaction level
          </p>
        </NeuCard>

        {/* Knowledge Gaps */}
        <NeuCard className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Knowledge Gap Priorities
          </h2>
          <div className="space-y-3">
            {knowledgeGaps.map((gap) => (
              <div
                key={gap.topic}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedGap(gap)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{gap.topic}</h3>
                      <span className={cn("text-xs font-medium", getPriorityColor(gap.priority))}>
                        {gap.priority} Priority
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{gap.unanswered} unanswered</span>
                      <span>{gap.studentCount} students affected</span>
                      <span className="text-green-600">+{gap.potentialSavings} hrs/mo potential</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </NeuCard>
      </div>

      {/* Initiative Detail Modal */}
      <Dialog open={selectedInitiative !== null} onOpenChange={(open) => !open && setSelectedInitiative(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
            <DialogTitle>{selectedInitiative?.title}</DialogTitle>
            <DialogDescription>Implementation details and roadmap</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {selectedInitiative && (
              <>
                {/* Impact Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                    <p className="text-xl font-bold text-green-600">{selectedInitiative.roi}</p>
                    <p className="text-xs text-muted-foreground">Annual ROI</p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
                    <p className="text-xl font-bold text-blue-600">{selectedInitiative.timeline}</p>
                    <p className="text-xs text-muted-foreground">Timeline</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-center">
                    <p className="text-xl font-bold text-purple-600">{selectedInitiative.studentCount}</p>
                    <p className="text-xs text-muted-foreground">Students Impacted</p>
                  </div>
                </div>

                {/* Complexity */}
                <div>
                  <p className="text-sm font-medium mb-2">Implementation Complexity</p>
                  <Progress value={selectedInitiative.complexity} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">{selectedInitiative.complexity}% complexity</p>
                </div>

                {/* Required Resources */}
                <div>
                  <p className="text-sm font-medium mb-2">Required Resources</p>
                  <ul className="space-y-1">
                    {selectedInitiative.requiredResources.map((resource, i) => (
                      <li key={i} className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        {resource}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risk Factors */}
                <div>
                  <p className="text-sm font-medium mb-2">Risk Factors</p>
                  <ul className="space-y-1">
                    {selectedInitiative.riskFactors.map((risk, i) => (
                      <li key={i} className="text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Success Metrics */}
                <div>
                  <p className="text-sm font-medium mb-2">Success Metrics</p>
                  <ul className="space-y-1">
                    {selectedInitiative.successMetrics.map((metric, i) => (
                      <li key={i} className="text-sm flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        {metric}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Implementation Steps */}
                <div>
                  <p className="text-sm font-medium mb-3">Implementation Roadmap</p>
                  <div className="space-y-3">
                    {selectedInitiative.implementationSteps.map((step) => (
                      <div key={step.step} className="flex gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {step.step}
                        </div>
                        <div className="flex-1 pb-3 border-b last:border-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{step.title}</p>
                            <span className="text-xs text-muted-foreground">{step.duration}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="p-4 border-t flex-shrink-0 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedInitiative(null)}>
              Close
            </Button>
            <Button onClick={() => {
              toast.success("Initiative added to implementation queue");
              setSelectedInitiative(null);
            }}>
              Add to Queue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Knowledge Gap Detail Modal */}
      <Dialog open={selectedGap !== null} onOpenChange={(open) => !open && setSelectedGap(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
            <DialogTitle>{selectedGap?.topic}</DialogTitle>
            <DialogDescription>Knowledge gap analysis and top questions</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {selectedGap && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg text-center">
                    <p className="text-xl font-bold text-red-600">{selectedGap.unanswered}</p>
                    <p className="text-xs text-muted-foreground">Unanswered</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
                    <p className="text-xl font-bold text-blue-600">{selectedGap.studentCount}</p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                    <p className="text-xl font-bold text-green-600">+{selectedGap.potentialSavings}h</p>
                    <p className="text-xs text-muted-foreground">Potential/mo</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3">Top Questions Asked</p>
                  <ul className="space-y-2">
                    {selectedGap.topQuestions.map((q, i) => (
                      <li key={i} className="p-3 bg-muted rounded-lg text-sm">
                        "{q}"
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          <div className="p-4 border-t flex-shrink-0 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedGap(null)}>
              Close
            </Button>
            <Button onClick={() => {
              toast.success("Added to content development queue");
              setSelectedGap(null);
            }}>
              Create Content
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Department Detail Modal */}
      <Dialog open={selectedDepartment !== null} onOpenChange={(open) => !open && setSelectedDepartment(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
            <DialogTitle>{selectedDepartment?.name} Department</DialogTitle>
            <DialogDescription>Performance metrics and insights</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {selectedDepartment && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{selectedDepartment.volume}</p>
                    <p className="text-xs text-muted-foreground">Total Queries</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className={cn(
                      "text-2xl font-bold",
                      selectedDepartment.satisfaction >= 85 ? "text-green-600" : 
                      selectedDepartment.satisfaction >= 75 ? "text-yellow-600" : "text-red-600"
                    )}>
                      {selectedDepartment.satisfaction}%
                    </p>
                    <p className="text-xs text-muted-foreground">Satisfaction</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{selectedDepartment.automationRate}%</p>
                    <p className="text-xs text-muted-foreground">Automation Rate</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{formatResponseTime(selectedDepartment.avgResponseTime)}</p>
                    <p className="text-xs text-muted-foreground">Avg Response</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Trend</p>
                  <p className={cn(
                    "text-lg font-bold",
                    selectedDepartment.trend.startsWith("+") ? "text-green-600" : "text-red-600"
                  )}>
                    {selectedDepartment.trend} vs last period
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Top Queries</p>
                  <ul className="space-y-1">
                    {selectedDepartment.topQueries.map((q: string, i: number) => (
                      <li key={i} className="text-sm flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Staff Hours Saved</p>
                  <p className="text-2xl font-bold text-green-600">{selectedDepartment.staffSaved} hours/month</p>
                </div>
              </>
            )}
          </div>

          <div className="p-4 border-t flex-shrink-0 flex justify-end">
            <Button variant="outline" onClick={() => setSelectedDepartment(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
