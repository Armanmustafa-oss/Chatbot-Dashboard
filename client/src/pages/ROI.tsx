import { DashboardLayout } from "@/components/DashboardLayout";
import { NeuCard, NeuStat } from "@/components/NeuCard";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BarChart3,
  DollarSign,
  Lightbulb,
  PieChart,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

export default function ROI() {
  const [dateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

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
    const botMonthlyCost = 500; // Estimated platform cost

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

  // Simulated departmental data for scatter plot
  const departmentalData = useMemo(() => {
    return [
      { name: "Admissions", volume: 850, satisfaction: 92, size: 850 },
      { name: "Financial Aid", volume: 720, satisfaction: 78, size: 720 },
      { name: "Registrar", volume: 650, satisfaction: 88, size: 650 },
      { name: "IT Support", volume: 480, satisfaction: 85, size: 480 },
      { name: "Library", volume: 320, satisfaction: 95, size: 320 },
      { name: "Housing", volume: 280, satisfaction: 72, size: 280 },
      { name: "Career Services", volume: 180, satisfaction: 90, size: 180 },
      { name: "Student Life", volume: 150, satisfaction: 88, size: 150 },
    ];
  }, []);

  // Knowledge gap priorities
  const knowledgeGaps = useMemo(() => {
    return [
      { topic: "Scholarship Application Deadlines", unanswered: 156, potentialSavings: 13, priority: "High" },
      { topic: "Transfer Credit Policies", unanswered: 124, potentialSavings: 10, priority: "High" },
      { topic: "Parking Permit Renewal", unanswered: 98, potentialSavings: 8, priority: "Medium" },
      { topic: "Meal Plan Changes", unanswered: 76, potentialSavings: 6, priority: "Medium" },
      { topic: "Graduation Requirements", unanswered: 65, potentialSavings: 5, priority: "Medium" },
    ];
  }, []);

  // Initiative recommendations
  const initiatives = useMemo(() => {
    return [
      {
        title: "Expand Financial Aid Content",
        impact: "High",
        effort: "Medium",
        description: "342 unanswered questions could save 12 staff hours monthly",
        roi: "+$3,600/year",
      },
      {
        title: "Add 24/7 Coverage",
        impact: "Medium",
        effort: "Low",
        description: "Capture after-hours queries (currently 18% of traffic)",
        roi: "+$1,800/year",
      },
      {
        title: "Voice Interaction Pilot",
        impact: "High",
        effort: "High",
        description: "Accessibility improvement for diverse student population",
        roi: "+$2,400/year",
      },
      {
        title: "Multi-language Support",
        impact: "Medium",
        effort: "Medium",
        description: "Support for international students (12% of population)",
        roi: "+$1,200/year",
      },
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

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          ROI Intelligence
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Strategic insights and investment recommendations for your chatbot system
        </p>
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

      {/* Departmental Performance Matrix */}
      <NeuCard className="min-h-[400px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">Departmental Performance Matrix</h3>
            <p className="text-sm text-muted-foreground">
              Volume vs. Satisfaction by department (bubble size = query volume)
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
                formatter={(value: number, name: string) => [
                  name === "Query Volume" ? value.toLocaleString() : `${value}%`,
                  name,
                ]}
              />
              <Scatter name="Departments" data={departmentalData} fill="var(--color-primary)">
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
              <p className="text-sm text-muted-foreground">Topics with highest unanswered queries</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
            </div>
          </div>

          <div className="space-y-3">
            {knowledgeGaps.map((gap, index) => (
              <div
                key={index}
                className="p-3 sm:p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm sm:text-base truncate">
                      {gap.topic}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {gap.unanswered} unanswered • {gap.potentialSavings} hrs/month potential
                    </p>
                  </div>
                  <span className={`text-xs font-bold ${getPriorityColor(gap.priority)}`}>
                    {gap.priority}
                  </span>
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
              <p className="text-sm text-muted-foreground">Strategic improvements ranked by ROI</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="h-5 w-5 text-green-600" />
            </div>
          </div>

          <div className="space-y-3">
            {initiatives.map((initiative, index) => (
              <div
                key={index}
                className="p-3 sm:p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
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
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {initiative.description}
                    </p>
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

      {/* Top Query Categories Performance */}
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
    </DashboardLayout>
  );
}
