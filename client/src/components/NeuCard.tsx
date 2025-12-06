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
  label: string;
  value: string | number;
  icon?: React.ElementType;
  trend?: string;
  tooltipContent?: string;
  drillDown?: DrillDownContent;
}

export function NeuStat({
  label,
  value,
  icon: Icon,
  trend,
  tooltipContent,
  drillDown,
}: NeuStatProps) {
  const [isOpen, setIsOpen] = useState(false);

  const cardContent = (
    <div className="flex flex-col items-start justify-between h-full min-h-[140px]">
      <div className="flex w-full justify-between items-start mb-4">
        <span className="text-muted-foreground font-semibold text-xs sm:text-sm uppercase tracking-wider">
          {label}
        </span>
        {Icon && <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary opacity-80" />}
      </div>
      <div className="flex items-end gap-2 w-full flex-wrap">
        <span className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "text-xs sm:text-sm font-bold mb-0.5 sm:mb-1.5",
              trend.startsWith("+") || trend.startsWith("-") && !trend.includes("-")
                ? "text-green-500"
                : trend.startsWith("-")
                ? "text-red-500"
                : "text-green-500"
            )}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );

  // If there's drill-down content, wrap in Dialog
  if (drillDown) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <NeuCard
                interactive
                className="cursor-pointer group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setIsOpen(true);
                  }
                }}
              >
                {cardContent}
                <div className="mt-2 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Click for details →
                </div>
              </NeuCard>
            </DialogTrigger>
          </TooltipTrigger>
          {tooltipContent && (
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-sm">{tooltipContent}</p>
            </TooltipContent>
          )}
        </Tooltip>

        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">{drillDown.title}</DialogTitle>
            <DialogDescription>{drillDown.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Formula */}
            {drillDown.formula && (
              <div className="p-4 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Calculation Formula
                </p>
                <p className="font-mono text-sm text-foreground">{drillDown.formula}</p>
              </div>
            )}

            {/* Breakdown */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Breakdown
              </p>
              {drillDown.breakdown.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-muted/30 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                  <span className="font-bold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Assumptions */}
            {drillDown.assumptions && drillDown.assumptions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Assumptions
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {drillDown.assumptions.map((assumption, index) => (
                    <div key={index} className="p-2 bg-muted/20 rounded-lg">
                      <p className="text-xs text-muted-foreground">{assumption.label}</p>
                      <p className="font-medium text-sm text-foreground">{assumption.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // If there's tooltip content but no drill-down
  if (tooltipContent) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <NeuCard interactive className="cursor-help">
            {cardContent}
          </NeuCard>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Default: no interactivity
  return <NeuCard>{cardContent}</NeuCard>;
}
