import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React, { useState } from "react";

interface NeuCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "flat" | "pressed";
  className?: string;
  interactive?: boolean;
}

export function NeuCard({
  children,
  variant = "flat",
  className,
  interactive = false,
  ...props
}: NeuCardProps) {
  return (
    <div
      className={cn(
        "p-6 transition-all duration-300",
        variant === "flat" ? "neu-flat" : "neu-pressed",
        interactive && "cursor-pointer hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface DrillDownContent {
  title: string;
  description: string;
  breakdown: Array<{
    label: string;
    value: string | number;
    description?: string;
  }>;
  formula?: string;
  assumptions?: Array<{ label: string; value: string }>;
}

interface NeuStatProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: string;
  isPositive?: boolean;
  onClick?: () => void;
  tooltip?: string;
  drillDown?: DrillDownContent;
  // Legacy props for backward compatibility
  label?: string;
  trend?: string;
  tooltipContent?: string;
}

export function NeuStat({
  title,
  label,
  value,
  icon,
  change,
  trend,
  isPositive = true,
  onClick,
  tooltip,
  tooltipContent,
  drillDown,
}: NeuStatProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Support both new and legacy prop names
  const displayLabel = title || label || "";
  const displayTrend = change || trend;
  const displayTooltip = tooltip || tooltipContent;

  const cardContent = (
    <div 
      className={cn(
        "flex flex-col items-start justify-between h-full min-h-[140px]",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <div className="flex w-full justify-between items-start mb-4">
        <span className="text-muted-foreground font-semibold text-xs sm:text-sm uppercase tracking-wider">
          {displayLabel}
        </span>
        {icon && <div className="opacity-80">{icon}</div>}
      </div>
      <div className="flex items-end gap-2 w-full flex-wrap">
        <span className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
          {value}
        </span>
        {displayTrend && (
          <span
            className={cn(
              "text-xs sm:text-sm font-bold mb-0.5 sm:mb-1.5",
              isPositive ? "text-green-500" : "text-red-500"
            )}
          >
            {displayTrend}
          </span>
        )}
      </div>
      {displayTooltip && (
        <p className="text-xs text-muted-foreground mt-2">{displayTooltip}</p>
      )}
    </div>
  );

  // If there's a drill-down, wrap in dialog
  if (drillDown) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <NeuCard interactive className="cursor-pointer">
            {cardContent}
          </NeuCard>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{drillDown.title}</DialogTitle>
            <DialogDescription>{drillDown.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {drillDown.breakdown.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <span className="font-medium text-foreground">{item.label}</span>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  )}
                </div>
                <span className="font-bold text-primary">{item.value}</span>
              </div>
            ))}
            {drillDown.formula && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">Formula</p>
                <code className="text-sm text-foreground">{drillDown.formula}</code>
              </div>
            )}
            {drillDown.assumptions && drillDown.assumptions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase">Assumptions</p>
                {drillDown.assumptions.map((assumption, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{assumption.label}</span>
                    <span className="text-foreground">{assumption.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // If there's a tooltip, wrap in tooltip
  if (displayTooltip && !onClick) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <NeuCard interactive={!!onClick}>
            {cardContent}
          </NeuCard>
        </TooltipTrigger>
        <TooltipContent>
          <p>{displayTooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <NeuCard interactive={!!onClick}>
      {cardContent}
    </NeuCard>
  );
}
