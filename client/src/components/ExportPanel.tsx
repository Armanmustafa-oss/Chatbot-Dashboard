/**
 * Export Panel Component
 * Floating panel for selective metric export with format selection
 */

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ExportableData,
  ExportFormat,
  exportSelectedMetrics,
  formatResponseTime,
  SelectableMetric,
} from "@/lib/export-service";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileType,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ExportPanelProps {
  metrics: SelectableMetric[];
  onMetricToggle: (id: string) => void;
  onClearAll: () => void;
  data: ExportableData;
}

export function ExportPanel({
  metrics,
  onMetricToggle,
  onClearAll,
  data,
}: ExportPanelProps) {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf");
  const [isExporting, setIsExporting] = useState(false);

  const selectedMetrics = metrics.filter((m) => m.selected);
  const selectedCount = selectedMetrics.length;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Prepare data with formatted response time
      const exportData: ExportableData = {
        ...data,
        kpiSummary: data.kpiSummary
          ? {
              ...data.kpiSummary,
              avgResponseTimeFormatted: formatResponseTime(data.kpiSummary.avgResponseTime),
            }
          : undefined,
      };

      exportSelectedMetrics(
        selectedFormat,
        selectedMetrics.map((m) => m.id),
        exportData
      );

      toast.success(`Export successful! Downloaded as ${selectedFormat.toUpperCase()}`);
      setIsExportDialogOpen(false);
      onClearAll();
    } catch (error) {
      toast.error("Export failed. Please try again.");
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatOptions: { value: ExportFormat; label: string; icon: React.ReactNode; description: string }[] = [
    {
      value: "pdf",
      label: "PDF Report",
      icon: <FileText className="h-4 w-4" />,
      description: "Print-optimized document with branding",
    },
    {
      value: "excel",
      label: "Excel Spreadsheet",
      icon: <FileSpreadsheet className="h-4 w-4" />,
      description: "Multi-sheet workbook for data analysis",
    },
    {
      value: "word",
      label: "Word Document",
      icon: <FileType className="h-4 w-4" />,
      description: "Narrative report with recommendations",
    },
    {
      value: "csv",
      label: "CSV File",
      icon: <FileText className="h-4 w-4" />,
      description: "Raw data for custom processing",
    },
  ];

  return (
    <>
      {/* Floating Export Panel */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="neu-raised px-4 py-3 rounded-2xl flex items-center gap-4 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{selectedCount}</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  metric{selectedCount !== 1 ? "s" : ""} selected
                </span>
              </div>

              <div className="h-6 w-px bg-border" />

              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>

              <Button
                onClick={() => setIsExportDialogOpen(true)}
                className="bg-primary hover:bg-primary/90 text-white gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Analytics</DialogTitle>
            <DialogDescription>
              Choose a format to export {selectedCount} selected metric{selectedCount !== 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Selected Metrics Summary */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Selected Metrics</label>
              <div className="flex flex-wrap gap-2">
                {selectedMetrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                  >
                    <span>{metric.label}</span>
                    <button
                      onClick={() => onMetricToggle(metric.id)}
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Export Format</label>
              <Select value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as ExportFormat)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Info */}
            {data.dateRange && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <span className="text-muted-foreground">Date Range: </span>
                <span className="font-medium">
                  {data.dateRange.from.toLocaleDateString()} - {data.dateRange.to.toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {selectedFormat.toUpperCase()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Metric Checkbox Component
 * Used to make individual metrics selectable for export
 */
interface MetricCheckboxProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function MetricCheckbox({ id, checked, onCheckedChange, className }: MetricCheckboxProps) {
  return (
    <div className={`absolute top-2 right-2 z-10 ${className}`}>
      <Checkbox
        id={`export-${id}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="h-5 w-5 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
    </div>
  );
}
