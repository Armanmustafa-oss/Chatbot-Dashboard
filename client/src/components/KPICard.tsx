import { ReactNode } from "react";

interface KPICardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  description?: string;
}

export function KPICard({ icon, label, value, change, changeType = "neutral", description }: KPICardProps) {
  const changeColor = {
    positive: "text-green-500",
    negative: "text-red-500",
    neutral: "text-gray-500",
  }[changeType];

  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {change && <p className={`mt-1 text-sm ${changeColor}`}>{change}</p>}
          {description && <p className="mt-2 text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="text-3xl text-primary opacity-20">{icon}</div>
      </div>
    </div>
  );
}
