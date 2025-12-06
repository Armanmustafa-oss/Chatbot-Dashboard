import { DashboardLayout } from "@/components/DashboardLayout";
import { DateRangePicker, DateRange } from "@/components/DateRangePicker";
import { NeuCard, NeuStat } from "@/components/NeuCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Lightbulb,
  PieChart,
  Target,
  TrendingUp,
  Users,
  Zap,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
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

  // Fetch data
  const { data: kpiData, isLoading: isLoadingKPI } = trpc.analytics.getKPISummary.useQuery({
    startDate: dateRange.from,
    endDate: dateRange.to,
  });

  const { data: topQueries } = trpc.analytics.getTopQueries.useQuery({ limit: 10 });

  // Calculate ROI metrics
  const roiMetrics = useMemo(() => {
    const totalMessages = kpiData?.totalMessages || 0;
    const avgMinutesPerQuery = 5;
    const hourlyRate = 25;
    const botMonthlyCost = 500;

    const minutesSaved = totalMessages * avgMinutesPerQuery;
    const hoursSaved = minutesSaved / 60;
    const laborCostSaved = hoursSaved * hourlyRate;
    const netSavings = laborCostSaved - botMonthlyCost;
    const roi = botMonthlyCost > 0 ? ((netSavings / botMonthlyCost) * 100).toFixed(0) : 0;

    return {
      totalMessages,
      hoursSaved: hoursSaved.toFixed(1),
      laborCostSaved: Math.round(laborCostSaved),
      botMonthlyCost,
      netSavings: Math.round(netSavings),
      roi,
      avgMinutesPerQuery,
      hourlyRate,
    };
  }, [kpiData]);

  // Departmental data with drill-down info
  const departmentalData = useMemo(() => {
    return [
      {
        name: "Admissions",
        volume: 850,
        satisfaction: 92,
        size: 850,
        avgResponseTime: "1.2s",
        topQueries: ["Application status", "Deadline info", "Requirements"],
        staffSaved: 28,
        trend: "+12%",
      },
      {
        name: "Financial Aid",
        volume: 720,
        satisfaction: 78,
        size: 720,
        avgResponseTime: "1.8s",
        topQueries: ["FAFSA help", "Scholarship info", "Payment plans"],
        staffSaved: 24,
        trend: "-5%",
      },
      {
        name: "Registrar",
        volume: 650,
        satisfaction: 88,
        size: 650,
        avgResponseTime: "1.4s",
        topQueries: ["Transcript requests", "Course registration", "Grades"],
        staffSaved: 22,
        trend: "+8%",
      },
      {
        name: "IT Support",
        volume: 480,
        satisfaction: 85,
        size: 480,
        avgResponseTime: "1.6s",
        topQueries: ["Password reset", "WiFi issues", "Software access"],
        staffSaved: 16,
        trend: "+3%",
      },
      {
        name: "Library",
        volume: 320,
        satisfaction: 95,
        size: 320,
        avgResponseTime: "1.1s",
        topQueries: ["Book availability", "Study rooms", "Database access"],
        staffSaved: 11,
        trend: "+15%",
      },
      {
        name: "Housing",
        volume: 280,
        satisfaction: 72,
        size: 280,
        avgResponseTime: "2.1s",
        topQueries: ["Room assignments", "Move-in dates", "Maintenance"],
        staffSaved: 9,
        trend: "-8%",
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

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "High":
        return "bg-green-100 text-green-700";
      case "Medium":
        return "bg-yellow-100 text-yellow-700";
      case "Low":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-red-600";
      case "Medium":
        return "text-yellow-600";
      case "Low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const handleExportROIReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      period: `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`,
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
    a.download = `roi-report-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("ROI report exported");
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              ROI Intelligence
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Strategic insights and investment recommendations for your chatbot system
            </p>
          </div>
          <Button
            variant="outline"
            className="neu-flat border-0 gap-2"
            onClick={handleExportROIReport}
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Date Range */}
        <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>

      {/* Executive Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <NeuStat
          label="Net ROI"
          value={isLoadingKPI ? "..." : `${roiMetrics.roi}%`}
          icon={TrendingUp}
          trend="+15%"
          tooltipContent="Return on investment comparing bot costs to labor savings"
          drillDown={{
            title: "ROI Calculation Details",
            description: "How we calculate the return on investment",
            breakdown: [
              { label: "Labor Cost Saved", value: `$${roiMetrics.laborCostSaved.toLocaleString()}`, description: "Staff hours saved × hourly rate" },
              { label: "Bot Platform Cost", value: `$${roiMetrics.botMonthlyCost}`, description: "Monthly platform and maintenance" },
              { label: "Net Savings", value: `$${roiMetrics.netSavings.toLocaleString()}`, description: "Labor saved minus bot cost" },
            ],
            formula: "ROI = (Net Savings / Bot Cost) × 100",
            assumptions: [
              { label: "Staff Hourly Rate", value: `$${roiMetrics.hourlyRate}/hr` },
              { label: "Avg Query Time", value: `${roiMetrics.avgMinutesPerQuery} min` },
            ],
          }}
        />
        <NeuStat
          label="Hours Saved"
          value={isLoadingKPI ? "..." : roiMetrics.hoursSaved}
          icon={Zap}
          trend="+12%"
          tooltipContent="Total staff hours saved through automation"
        />
        <NeuStat
          label="Net Savings"
          value={isLoadingKPI ? "..." : `$${roiMetrics.netSavings.toLocaleString()}`}
          icon={DollarSign}
          trend="+18%"
          tooltipContent="Total cost savings after subtracting platform costs"
        />
        <NeuStat
          label="Queries Automated"
          value={isLoadingKPI ? "..." : roiMetrics.totalMessages.toLocaleString()}
          icon={BarChart3}
          trend="+10%"
          tooltipContent="Total student queries handled without human intervention"
        />
      </div>

      {/* Period Comparison */}
      <NeuCard>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">Period Comparison</h3>
            <p className="text-sm text-muted-foreground">
              Current period vs. previous period performance
            </p>
          </div>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="period" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="current" stroke="var(--color-primary)" strokeWidth={2} name="Current Period" />
              <Line type="monotone" dataKey="previous" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" name="Previous Period" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </NeuCard>

      {/* Departmental Performance Matrix */}
      <NeuCard className="min-h-[400px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">Departmental Performance Matrix</h3>
            <p className="text-sm text-muted-foreground">
              Click on a bubble to view department details
            </p>
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            <PieChart className="h-5 w-5 text-primary" />
          </div>
        </div>

        <div className="h-[300px] sm:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                type="number"
                dataKey="volume"
                name="Query Volume"
                domain={[0, 1000]}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                label={{ value: "Query Volume", position: "bottom", offset: 0, fill: "var(--color-muted-foreground)" }}
              />
              <YAxis
                type="number"
                dataKey="satisfaction"
                name="Satisfaction"
                domain={[60, 100]}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                label={{ value: "Satisfaction %", angle: -90, position: "insideLeft", fill: "var(--color-muted-foreground)" }}
              />
              <ZAxis type="number" dataKey="size" range={[100, 500]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "5px 5px 10px #d1d9e6",
                }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 bg-card rounded-xl shadow-lg">
                        <p className="font-semibold">{data.name}</p>
                        <p className="text-sm text-muted-foreground">Volume: {data.volume}</p>
                        <p className="text-sm text-muted-foreground">Satisfaction: {data.satisfaction}%</p>
                        <p className="text-xs text-primary mt-1">Click for details</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter
                name="Departments"
                data={departmentalData}
                fill="var(--color-primary)"
                onClick={(data) => setSelectedDepartment(data)}
                style={{ cursor: "pointer" }}
              >
                {departmentalData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.satisfaction >= 85 ? "#22c55e" : entry.satisfaction >= 75 ? "#eab308" : "#ef4444"}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>High Satisfaction (≥85%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Medium (75-84%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Needs Improvement (&lt;75%)</span>
          </div>
        </div>
      </NeuCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Knowledge Gap Prioritization */}
        <NeuCard className="min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">Knowledge Gap Priorities</h3>
              <p className="text-sm text-muted-foreground">Click to view details and top questions</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
            </div>
          </div>

          <div className="space-y-3">
            {knowledgeGaps.map((gap, index) => (
              <div
                key={index}
                className="p-3 sm:p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => setSelectedGap(gap)}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground text-sm sm:text-base truncate">
                        {gap.topic}
                      </p>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {gap.unanswered} unanswered • {gap.studentCount} students affected
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold ${getPriorityColor(gap.priority)}`}>
                      {gap.priority}
                    </span>
                    <p className="text-xs text-muted-foreground">{gap.potentialSavings} hrs/mo</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Addressing these gaps could save an estimated <strong>42 staff hours</strong> monthly
            </p>
          </div>
        </NeuCard>

        {/* Initiative Recommendations */}
        <NeuCard className="min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">Initiative Recommendations</h3>
              <p className="text-sm text-muted-foreground">Click for implementation roadmap</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="h-5 w-5 text-green-600" />
            </div>
          </div>

          <div className="space-y-3">
            {initiatives.map((initiative) => (
              <div
                key={initiative.id}
                className="p-3 sm:p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => setSelectedInitiative(initiative)}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground text-sm sm:text-base">
                        {initiative.title}
                      </p>
                      <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full ${getImpactColor(initiative.impact)}`}>
                        {initiative.impact} Impact
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {initiative.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {initiative.timeline}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {initiative.studentCount} students
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-green-600 text-sm">{initiative.roi}</p>
                    <p className="text-[10px] text-muted-foreground">{initiative.effort} effort</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </NeuCard>
      </div>

      {/* Query Category Performance */}
      <NeuCard>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">Query Category Performance</h3>
            <p className="text-sm text-muted-foreground">
              Volume distribution across top query categories
            </p>
          </div>
        </div>

        <div className="h-[250px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topQueries?.slice(0, 8) || []}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--color-border)" />
              <XAxis type="number" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
              <YAxis
                dataKey="name"
                type="category"
                width={120}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "5px 5px 10px #d1d9e6",
                }}
              />
              <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </NeuCard>

      {/* Action CTA */}
      <NeuCard className="bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Ready to Optimize?</h3>
            <p className="text-sm text-muted-foreground">
              Implement the recommended initiatives to maximize your chatbot's ROI
            </p>
          </div>
          <Link href="/settings">
            <Button className="gap-2 h-11" style={{ minHeight: "44px" }}>
              Configure Settings
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </NeuCard>

      {/* Initiative Detail Dialog */}
      <Dialog open={!!selectedInitiative} onOpenChange={() => setSelectedInitiative(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {selectedInitiative?.title}
            </DialogTitle>
            <DialogDescription>
              Implementation roadmap and resource requirements
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            {selectedInitiative && (
              <div className="space-y-6 pb-4">
                {/* Overview Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-green-50 rounded-xl text-center">
                    <p className="text-lg font-bold text-green-600">{selectedInitiative.roi}</p>
                    <p className="text-xs text-muted-foreground">Expected ROI</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl text-center">
                    <p className="text-lg font-bold text-blue-600">{selectedInitiative.timeline}</p>
                    <p className="text-xs text-muted-foreground">Timeline</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl text-center">
                    <p className="text-lg font-bold text-purple-600">{selectedInitiative.studentCount}</p>
                    <p className="text-xs text-muted-foreground">Students Impacted</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl text-center">
                    <p className="text-lg font-bold text-amber-600">{selectedInitiative.timeSavingsHours}h</p>
                    <p className="text-xs text-muted-foreground">Monthly Savings</p>
                  </div>
                </div>

                {/* Complexity Meter */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Complexity Assessment</span>
                    <span className="text-sm text-muted-foreground">{selectedInitiative.complexity}%</span>
                  </div>
                  <Progress value={selectedInitiative.complexity} className="h-2" />
                </div>

                {/* Required Resources */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Required Resources
                  </h4>
                  <div className="space-y-2">
                    {selectedInitiative.requiredResources.map((resource, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{resource}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Implementation Steps */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Implementation Roadmap
                  </h4>
                  <div className="space-y-3">
                    {selectedInitiative.implementationSteps.map((step) => (
                      <div key={step.step} className="flex gap-3 p-3 bg-muted/30 rounded-xl">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">{step.step}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground">{step.title}</p>
                            <span className="text-xs text-muted-foreground">{step.duration}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk Factors */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Risk Factors
                  </h4>
                  <div className="space-y-2">
                    {selectedInitiative.riskFactors.map((risk, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Success Metrics */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    Success Metrics
                  </h4>
                  <div className="space-y-2">
                    {selectedInitiative.successMetrics.map((metric, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{metric}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Knowledge Gap Detail Dialog */}
      <Dialog open={!!selectedGap} onOpenChange={() => setSelectedGap(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              {selectedGap?.topic}
            </DialogTitle>
            <DialogDescription>
              Knowledge gap details and top unanswered questions
            </DialogDescription>
          </DialogHeader>

          {selectedGap && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-muted/30 rounded-xl text-center">
                  <p className="text-xl font-bold text-foreground">{selectedGap.unanswered}</p>
                  <p className="text-xs text-muted-foreground">Unanswered</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl text-center">
                  <p className="text-xl font-bold text-foreground">{selectedGap.studentCount}</p>
                  <p className="text-xs text-muted-foreground">Students</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl text-center">
                  <p className="text-xl font-bold text-foreground">{selectedGap.potentialSavings}h</p>
                  <p className="text-xs text-muted-foreground">Potential Savings</p>
                </div>
              </div>

              {/* Top Questions */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Top Unanswered Questions</h4>
                <div className="space-y-2">
                  {selectedGap.topQuestions.map((question, i) => (
                    <div key={i} className="p-3 bg-muted/20 rounded-lg">
                      <p className="text-sm text-foreground">"{question}"</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <Button className="w-full gap-2" onClick={() => toast.info("This would open the content editor to add answers for this topic")}>
                <Lightbulb className="h-4 w-4" />
                Add Content for This Topic
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Department Detail Dialog */}
      <Dialog open={!!selectedDepartment} onOpenChange={() => setSelectedDepartment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {selectedDepartment?.name} Department
            </DialogTitle>
            <DialogDescription>
              Detailed performance metrics and insights
            </DialogDescription>
          </DialogHeader>

          {selectedDepartment && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 rounded-xl text-center">
                  <p className="text-xl font-bold text-foreground">{selectedDepartment.volume}</p>
                  <p className="text-xs text-muted-foreground">Query Volume</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl text-center">
                  <p className="text-xl font-bold text-foreground">{selectedDepartment.satisfaction}%</p>
                  <p className="text-xs text-muted-foreground">Satisfaction</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl text-center">
                  <p className="text-xl font-bold text-foreground">{selectedDepartment.avgResponseTime}</p>
                  <p className="text-xs text-muted-foreground">Avg Response</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl text-center">
                  <p className="text-xl font-bold text-foreground">{selectedDepartment.staffSaved}h</p>
                  <p className="text-xs text-muted-foreground">Staff Hours Saved</p>
                </div>
              </div>

              {/* Trend */}
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
                <span className="text-sm text-muted-foreground">Month-over-month trend</span>
                <span className={`font-bold ${selectedDepartment.trend.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                  {selectedDepartment.trend}
                </span>
              </div>

              {/* Top Queries */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Top Query Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDepartment.topQueries.map((query: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      {query}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
