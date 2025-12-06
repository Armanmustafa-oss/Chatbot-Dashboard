/**
 * Enhanced Date Range Picker Component
 * Features:
 * - Independent start and end date selection
 * - 24-hour, 7-day, 30-day presets (removed 90-day)
 * - Visual date range display
 * - Custom calendar picker
 */

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, subDays, subHours } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { useState } from "react";

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
}

interface PresetRange {
  label: string;
  shortLabel: string;
  getValue: () => DateRange;
  isActive: (range: DateRange) => boolean;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectingDate, setSelectingDate] = useState<"from" | "to" | null>(null);

  // Preset ranges with 24h replacing 90d
  const presetRanges: PresetRange[] = [
    {
      label: "24 Hours",
      shortLabel: "24H",
      getValue: () => ({
        from: subHours(new Date(), 24),
        to: new Date(),
      }),
      isActive: (range) => {
        const hoursDiff = (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60);
        return hoursDiff >= 23 && hoursDiff <= 25;
      },
    },
    {
      label: "7 Days",
      shortLabel: "7D",
      getValue: () => ({
        from: subDays(new Date(), 7),
        to: new Date(),
      }),
      isActive: (range) => {
        const daysDiff = Math.round((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff === 7;
      },
    },
    {
      label: "30 Days",
      shortLabel: "30D",
      getValue: () => ({
        from: subDays(new Date(), 30),
        to: new Date(),
      }),
      isActive: (range) => {
        const daysDiff = Math.round((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff === 30;
      },
    },
  ];

  const handlePresetClick = (preset: PresetRange) => {
    onDateRangeChange(preset.getValue());
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (selectingDate === "from") {
      // Ensure from date is not after to date
      const newFrom = date > dateRange.to ? dateRange.to : date;
      onDateRangeChange({ ...dateRange, from: newFrom });
      setSelectingDate("to");
    } else if (selectingDate === "to") {
      // Ensure to date is not before from date
      const newTo = date < dateRange.from ? dateRange.from : date;
      onDateRangeChange({ ...dateRange, to: newTo });
      setSelectingDate(null);
      setIsCalendarOpen(false);
    }
  };

  const activePreset = presetRanges.find((p) => p.isActive(dateRange));

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      {/* Preset Range Buttons */}
      <div className="neu-flat px-1 p-1 rounded-xl flex items-center gap-1">
        {presetRanges.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePresetClick(preset)}
            className={cn(
              "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all touch-manipulation",
              activePreset?.label === preset.label
                ? "bg-primary text-white shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
            style={{ minHeight: "44px" }}
          >
            <span className="sm:hidden">{preset.shortLabel}</span>
            <span className="hidden sm:inline">{preset.label}</span>
          </button>
        ))}
      </div>

      {/* Custom Date Range Picker */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="neu-flat border-0 h-11 sm:h-12 px-3 sm:px-4 rounded-xl gap-2"
            style={{ minHeight: "44px" }}
            onClick={() => {
              setSelectingDate("from");
              setIsCalendarOpen(true);
            }}
          >
            <CalendarIcon className="h-4 w-4" />
            <span className="text-xs sm:text-sm">
              {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
            </span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b">
            <div className="flex items-center gap-4">
              {/* From Date Button */}
              <button
                onClick={() => setSelectingDate("from")}
                className={cn(
                  "flex-1 p-2 rounded-lg text-left transition-colors",
                  selectingDate === "from"
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                <div className="text-xs text-muted-foreground mb-1">Start Date</div>
                <div className="font-semibold">{format(dateRange.from, "MMM d, yyyy")}</div>
              </button>

              <div className="text-muted-foreground">→</div>

              {/* To Date Button */}
              <button
                onClick={() => setSelectingDate("to")}
                className={cn(
                  "flex-1 p-2 rounded-lg text-left transition-colors",
                  selectingDate === "to"
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                <div className="text-xs text-muted-foreground mb-1">End Date</div>
                <div className="font-semibold">{format(dateRange.to, "MMM d, yyyy")}</div>
              </button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground text-center">
              {selectingDate === "from"
                ? "Select start date"
                : selectingDate === "to"
                ? "Select end date"
                : "Click a date to modify"}
            </div>
          </div>

          {/* Single Calendar for Mobile */}
          <div className="sm:hidden">
            <Calendar
              mode="single"
              selected={selectingDate === "from" ? dateRange.from : dateRange.to}
              onSelect={handleDateSelect}
              disabled={(date) => date > new Date()}
              initialFocus
            />
          </div>

          {/* Dual Calendar for Desktop */}
          <div className="hidden sm:block">
            <Calendar
              mode="single"
              selected={selectingDate === "from" ? dateRange.from : dateRange.to}
              onSelect={handleDateSelect}
              disabled={(date) => date > new Date()}
              numberOfMonths={2}
              initialFocus
            />
          </div>

          {/* Quick Actions */}
          <div className="p-3 border-t flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsCalendarOpen(false);
                setSelectingDate(null);
              }}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              {presetRanges.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handlePresetClick(preset);
                    setIsCalendarOpen(false);
                    setSelectingDate(null);
                  }}
                >
                  {preset.shortLabel}
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Time Period Filter Component
 * For filtering by time of day (morning, afternoon, evening, overnight)
 */
interface TimePeriodFilterProps {
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}

export function TimePeriodFilter({ value, onChange, className }: TimePeriodFilterProps) {
  const periods = [
    { id: "morning", label: "Morning", shortLabel: "AM", hours: "6AM-12PM" },
    { id: "afternoon", label: "Afternoon", shortLabel: "PM", hours: "12PM-6PM" },
    { id: "evening", label: "Evening", shortLabel: "Eve", hours: "6PM-12AM" },
    { id: "overnight", label: "Overnight", shortLabel: "Night", hours: "12AM-6AM" },
  ];

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      <button
        onClick={() => onChange(null)}
        className={cn(
          "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
          value === null
            ? "bg-primary text-white"
            : "bg-muted text-muted-foreground hover:text-foreground"
        )}
      >
        All Day
      </button>
      {periods.map((period) => (
        <button
          key={period.id}
          onClick={() => onChange(period.id)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            value === period.id
              ? "bg-primary text-white"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
          title={period.hours}
        >
          <span className="sm:hidden">{period.shortLabel}</span>
          <span className="hidden sm:inline">{period.label}</span>
        </button>
      ))}
    </div>
  );
}
