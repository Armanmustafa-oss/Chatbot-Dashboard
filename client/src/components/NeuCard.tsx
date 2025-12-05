import { cn } from "@/lib/utils";
import React from "react";

interface NeuCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "flat" | "pressed";
  className?: string;
}

export function NeuCard({ 
  children, 
  variant = "flat", 
  className, 
  ...props 
}: NeuCardProps) {
  return (
    <div
      className={cn(
        "p-6 transition-all duration-300",
        variant === "flat" ? "neu-flat" : "neu-pressed",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function NeuStat({ 
  label, 
  value, 
  icon: Icon, 
  trend 
}: { 
  label: string; 
  value: string | number; 
  icon?: React.ElementType;
  trend?: string;
}) {
  return (
    <NeuCard className="flex flex-col items-start justify-between h-full min-h-[140px]">
      <div className="flex w-full justify-between items-start mb-4">
        <span className="text-muted-foreground font-semibold text-sm uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="h-6 w-6 text-primary opacity-80" />}
      </div>
      <div className="flex items-end gap-2 w-full">
        <span className="text-4xl font-bold text-foreground tracking-tight">{value}</span>
        {trend && (
          <span className={cn(
            "text-sm font-bold mb-1.5",
            trend.startsWith("+") ? "text-green-500" : "text-red-500"
          )}>
            {trend}
          </span>
        )}
      </div>
    </NeuCard>
  );
}
