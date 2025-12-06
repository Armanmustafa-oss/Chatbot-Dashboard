/**
 * Unified Export Service
 * Provides selective metric export with PDF, Excel, Word, and CSV formats
 */

import {
  exportToCSV,
  exportToPDF,
  exportToExcel,
  exportToWord,
  formatDateForExport,
  ExportColumn,
  downloadFile,
} from "./export";

// Types for selectable metrics
export interface SelectableMetric {
  id: string;
  label: string;
  category: "kpi" | "chart" | "table";
  selected: boolean;
}

export interface ExportableData {
  kpiSummary?: {
    totalMessages: number;
    avgResponseTime: number;
    avgResponseTimeFormatted: string;
    satisfactionScore: number;
    costSaved: number;
  };
  dailyAnalytics?: Array<{
    date: Date | string;
    totalMessages: number;
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
    avgResponseTimeMs: number | null;
    avgRating: number | null;
    uniqueStudents: number;
  }>;
  hourlyData?: Array<{
    hour: number;
    totalMessages: number;
  }>;
  sentimentData?: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topQueries?: Array<{
    name: string;
    count: number;
  }>;
  messages?: Array<{
    id: number;
    studentId: number;
    query: string;
    response: string | null;
    sentiment: string | null;
    category: string | null;
    responseTimeMs: number | null;
    rating: number | null;
    createdAt: Date | string;
  }>;
  students?: Array<{
    id: number;
    studentId: string;
    name: string | null;
    phone: string | null;
    department: string | null;
    createdAt: Date | string;
    lastActiveAt: Date | string;
  }>;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export type ExportFormat = "csv" | "pdf" | "excel" | "word";

/**
 * Format milliseconds to human-readable time
 * - Under 1 second: "850 ms"
 * - 1-60 seconds: "3.2 seconds"
 * - Over 60 seconds: "2.3 minutes"
 */
export function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)} ms`;
  } else if (ms < 60000) {
    const seconds = ms / 1000;
    return `${seconds.toFixed(1)} seconds`;
  } else {
    const minutes = ms / 60000;
    return `${minutes.toFixed(1)} minutes`;
  }
}

/**
 * Format milliseconds to compact human-readable time (for tight spaces)
 * - Under 1 second: "850ms"
 * - 1-60 seconds: "3.2s"
 * - Over 60 seconds: "2.3m"
 */
export function formatResponseTimeCompact(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    return `${(ms / 60000).toFixed(1)}m`;
  }
}

/**
 * Format hour to 12-hour format
 */
export function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

/**
 * Get default selectable metrics for the dashboard
 */
export function getDefaultMetrics(): SelectableMetric[] {
  return [
    { id: "totalMessages", label: "Total Messages", category: "kpi", selected: false },
    { id: "avgResponseTime", label: "Avg Response Time", category: "kpi", selected: false },
    { id: "satisfactionScore", label: "Satisfaction Score", category: "kpi", selected: false },
    { id: "costSaved", label: "Est. Cost Saved", category: "kpi", selected: false },
    { id: "messageVolumeTrend", label: "Message Volume Trend", category: "chart", selected: false },
    { id: "peakMessagingTimes", label: "Peak Messaging Times", category: "chart", selected: false },
    { id: "sentimentAnalysis", label: "Sentiment Analysis", category: "chart", selected: false },
    { id: "topQueries", label: "Top Queries", category: "table", selected: false },
  ];
}

/**
 * Generate comprehensive PDF report with selected metrics
 */
function generateComprehensivePDF(
  selectedMetrics: string[],
  data: ExportableData
): void {
  const dateRangeStr = data.dateRange
    ? `${formatDateForExport(data.dateRange.from)} to ${formatDateForExport(data.dateRange.to)}`
    : "All Time";

  let content = `
    <h2>Report Period: ${dateRangeStr}</h2>
  `;

  // KPI Section
  const kpiMetrics = selectedMetrics.filter((m) =>
    ["totalMessages", "avgResponseTime", "satisfactionScore", "costSaved"].includes(m)
  );
  if (kpiMetrics.length > 0 && data.kpiSummary) {
    content += `<h2>Key Performance Indicators</h2><table><tr>`;
    if (kpiMetrics.includes("totalMessages")) {
      content += `<th>Total Messages</th>`;
    }
    if (kpiMetrics.includes("avgResponseTime")) {
      content += `<th>Avg Response Time</th>`;
    }
    if (kpiMetrics.includes("satisfactionScore")) {
      content += `<th>Satisfaction Score</th>`;
    }
    if (kpiMetrics.includes("costSaved")) {
      content += `<th>Est. Cost Saved</th>`;
    }
    content += `</tr><tr>`;
    if (kpiMetrics.includes("totalMessages")) {
      content += `<td>${data.kpiSummary.totalMessages.toLocaleString()}</td>`;
    }
    if (kpiMetrics.includes("avgResponseTime")) {
      content += `<td>${data.kpiSummary.avgResponseTimeFormatted}</td>`;
    }
    if (kpiMetrics.includes("satisfactionScore")) {
      content += `<td>${data.kpiSummary.satisfactionScore}%</td>`;
    }
    if (kpiMetrics.includes("costSaved")) {
      content += `<td>$${data.kpiSummary.costSaved.toLocaleString()}</td>`;
    }
    content += `</tr></table>`;
  }

  // Sentiment Analysis
  if (selectedMetrics.includes("sentimentAnalysis") && data.sentimentData) {
    const total = data.sentimentData.positive + data.sentimentData.neutral + data.sentimentData.negative;
    content += `
      <h2>Sentiment Analysis</h2>
      <table>
        <tr><th>Sentiment</th><th>Count</th><th>Percentage</th></tr>
        <tr><td>Positive</td><td>${data.sentimentData.positive.toLocaleString()}</td><td>${Math.round((data.sentimentData.positive / total) * 100)}%</td></tr>
        <tr><td>Neutral</td><td>${data.sentimentData.neutral.toLocaleString()}</td><td>${Math.round((data.sentimentData.neutral / total) * 100)}%</td></tr>
        <tr><td>Negative</td><td>${data.sentimentData.negative.toLocaleString()}</td><td>${Math.round((data.sentimentData.negative / total) * 100)}%</td></tr>
      </table>
    `;
  }

  // Top Queries
  if (selectedMetrics.includes("topQueries") && data.topQueries) {
    content += `
      <h2>Top Student Queries</h2>
      <table>
        <tr><th>Rank</th><th>Query Category</th><th>Count</th></tr>
        ${data.topQueries
          .map((q, i) => `<tr><td>${i + 1}</td><td>${q.name}</td><td>${q.count.toLocaleString()}</td></tr>`)
          .join("")}
      </table>
    `;
  }

  // Daily Analytics
  if (selectedMetrics.includes("messageVolumeTrend") && data.dailyAnalytics) {
    content += `
      <h2>Daily Message Volume</h2>
      <table>
        <tr><th>Date</th><th>Messages</th><th>Positive</th><th>Neutral</th><th>Negative</th><th>Unique Students</th></tr>
        ${data.dailyAnalytics
          .map(
            (d) =>
              `<tr><td>${formatDateForExport(d.date)}</td><td>${d.totalMessages}</td><td>${d.positiveCount}</td><td>${d.neutralCount}</td><td>${d.negativeCount}</td><td>${d.uniqueStudents}</td></tr>`
          )
          .join("")}
      </table>
    `;
  }

  // Peak Times
  if (selectedMetrics.includes("peakMessagingTimes") && data.hourlyData) {
    content += `
      <h2>Peak Messaging Times</h2>
      <table>
        <tr><th>Hour</th><th>Messages</th></tr>
        ${data.hourlyData
          .map((h) => `<tr><td>${formatHour(h.hour)}</td><td>${h.totalMessages.toLocaleString()}</td></tr>`)
          .join("")}
      </table>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #111827; }
        h1 { margin: 0 0 8px 0; font-size: 28px; color: #1e3a5f; }
        h2 { font-size: 18px; color: #2563eb; margin-top: 24px; margin-bottom: 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
        .subtitle { color: #6b7280; margin-bottom: 24px; }
        .meta { font-size: 12px; color: #9ca3af; margin-bottom: 32px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px; }
        th { text-align: left; padding: 10px 8px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-weight: 600; }
        td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <h1>Student Messaging Analytics Report</h1>
      <div class="subtitle">Comprehensive Dashboard Export</div>
      <div class="meta">Generated on ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} at ${new Date().toLocaleTimeString()}</div>
      ${content}
      <div class="footer">
        <p>EduBot Analytics Dashboard • Confidential Report</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

/**
 * Generate Excel export with multiple worksheets
 */
function generateComprehensiveExcel(
  selectedMetrics: string[],
  data: ExportableData
): void {
  const dateRangeStr = data.dateRange
    ? `${formatDateForExport(data.dateRange.from)}_to_${formatDateForExport(data.dateRange.to)}`
    : "all_time";

  let worksheets = "";

  // KPI Summary Sheet
  const kpiMetrics = selectedMetrics.filter((m) =>
    ["totalMessages", "avgResponseTime", "satisfactionScore", "costSaved"].includes(m)
  );
  if (kpiMetrics.length > 0 && data.kpiSummary) {
    const kpiRows = [];
    if (kpiMetrics.includes("totalMessages")) {
      kpiRows.push({ metric: "Total Messages", value: data.kpiSummary.totalMessages });
    }
    if (kpiMetrics.includes("avgResponseTime")) {
      kpiRows.push({ metric: "Avg Response Time", value: data.kpiSummary.avgResponseTimeFormatted });
    }
    if (kpiMetrics.includes("satisfactionScore")) {
      kpiRows.push({ metric: "Satisfaction Score", value: `${data.kpiSummary.satisfactionScore}%` });
    }
    if (kpiMetrics.includes("costSaved")) {
      kpiRows.push({ metric: "Est. Cost Saved", value: `$${data.kpiSummary.costSaved.toLocaleString()}` });
    }

    worksheets += `
      <Worksheet ss:Name="KPI Summary">
        <Table>
          <Row><Cell ss:StyleID="Header"><Data ss:Type="String">Metric</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Value</Data></Cell></Row>
          ${kpiRows.map((r) => `<Row><Cell><Data ss:Type="String">${r.metric}</Data></Cell><Cell><Data ss:Type="String">${r.value}</Data></Cell></Row>`).join("")}
        </Table>
      </Worksheet>
    `;
  }

  // Daily Analytics Sheet
  if (selectedMetrics.includes("messageVolumeTrend") && data.dailyAnalytics) {
    worksheets += `
      <Worksheet ss:Name="Daily Analytics">
        <Table>
          <Row>
            <Cell ss:StyleID="Header"><Data ss:Type="String">Date</Data></Cell>
            <Cell ss:StyleID="Header"><Data ss:Type="String">Messages</Data></Cell>
            <Cell ss:StyleID="Header"><Data ss:Type="String">Positive</Data></Cell>
            <Cell ss:StyleID="Header"><Data ss:Type="String">Neutral</Data></Cell>
            <Cell ss:StyleID="Header"><Data ss:Type="String">Negative</Data></Cell>
            <Cell ss:StyleID="Header"><Data ss:Type="String">Unique Students</Data></Cell>
          </Row>
          ${data.dailyAnalytics
            .map(
              (d) => `
            <Row>
              <Cell><Data ss:Type="String">${formatDateForExport(d.date)}</Data></Cell>
              <Cell><Data ss:Type="Number">${d.totalMessages}</Data></Cell>
              <Cell><Data ss:Type="Number">${d.positiveCount}</Data></Cell>
              <Cell><Data ss:Type="Number">${d.neutralCount}</Data></Cell>
              <Cell><Data ss:Type="Number">${d.negativeCount}</Data></Cell>
              <Cell><Data ss:Type="Number">${d.uniqueStudents}</Data></Cell>
            </Row>
          `
            )
            .join("")}
        </Table>
      </Worksheet>
    `;
  }

  // Hourly Data Sheet
  if (selectedMetrics.includes("peakMessagingTimes") && data.hourlyData) {
    worksheets += `
      <Worksheet ss:Name="Peak Times">
        <Table>
          <Row>
            <Cell ss:StyleID="Header"><Data ss:Type="String">Hour</Data></Cell>
            <Cell ss:StyleID="Header"><Data ss:Type="String">Messages</Data></Cell>
          </Row>
          ${data.hourlyData
            .map(
              (h) => `
            <Row>
              <Cell><Data ss:Type="String">${formatHour(h.hour)}</Data></Cell>
              <Cell><Data ss:Type="Number">${h.totalMessages}</Data></Cell>
            </Row>
          `
            )
            .join("")}
        </Table>
      </Worksheet>
    `;
  }

  // Top Queries Sheet
  if (selectedMetrics.includes("topQueries") && data.topQueries) {
    worksheets += `
      <Worksheet ss:Name="Top Queries">
        <Table>
          <Row>
            <Cell ss:StyleID="Header"><Data ss:Type="String">Rank</Data></Cell>
            <Cell ss:StyleID="Header"><Data ss:Type="String">Category</Data></Cell>
            <Cell ss:StyleID="Header"><Data ss:Type="String">Count</Data></Cell>
          </Row>
          ${data.topQueries
            .map(
              (q, i) => `
            <Row>
              <Cell><Data ss:Type="Number">${i + 1}</Data></Cell>
              <Cell><Data ss:Type="String">${q.name}</Data></Cell>
              <Cell><Data ss:Type="Number">${q.count}</Data></Cell>
            </Row>
          `
            )
            .join("")}
        </Table>
      </Worksheet>
    `;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#F3F4F6" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  ${worksheets}
</Workbook>`;

  downloadFile(xml, `analytics_export_${dateRangeStr}.xls`, "application/vnd.ms-excel");
}

/**
 * Generate Word narrative report
 */
function generateComprehensiveWord(
  selectedMetrics: string[],
  data: ExportableData
): void {
  const dateRangeStr = data.dateRange
    ? `${formatDateForExport(data.dateRange.from)} to ${formatDateForExport(data.dateRange.to)}`
    : "All Time";

  let content = `
    <h2>Executive Summary</h2>
    <p>This report provides a comprehensive analysis of student messaging activity for the period <strong>${dateRangeStr}</strong>.</p>
  `;

  if (data.kpiSummary) {
    content += `
      <p>During this period, the chatbot system processed <strong>${data.kpiSummary.totalMessages.toLocaleString()}</strong> student queries with an average response time of <strong>${data.kpiSummary.avgResponseTimeFormatted}</strong>. The overall satisfaction score stands at <strong>${data.kpiSummary.satisfactionScore}%</strong>, with estimated cost savings of <strong>$${data.kpiSummary.costSaved.toLocaleString()}</strong>.</p>
    `;
  }

  // KPI Details
  if (selectedMetrics.some((m) => ["totalMessages", "avgResponseTime", "satisfactionScore", "costSaved"].includes(m)) && data.kpiSummary) {
    content += `
      <h2>Key Performance Indicators</h2>
      <table>
        <tr><th>Metric</th><th>Value</th><th>Analysis</th></tr>
    `;
    if (selectedMetrics.includes("totalMessages")) {
      content += `<tr><td>Total Messages</td><td>${data.kpiSummary.totalMessages.toLocaleString()}</td><td>Total student queries handled by the chatbot</td></tr>`;
    }
    if (selectedMetrics.includes("avgResponseTime")) {
      content += `<tr><td>Avg Response Time</td><td>${data.kpiSummary.avgResponseTimeFormatted}</td><td>Average time to generate a response</td></tr>`;
    }
    if (selectedMetrics.includes("satisfactionScore")) {
      content += `<tr><td>Satisfaction Score</td><td>${data.kpiSummary.satisfactionScore}%</td><td>Percentage of positive sentiment interactions</td></tr>`;
    }
    if (selectedMetrics.includes("costSaved")) {
      content += `<tr><td>Est. Cost Saved</td><td>$${data.kpiSummary.costSaved.toLocaleString()}</td><td>Estimated savings from automation</td></tr>`;
    }
    content += `</table>`;
  }

  // Sentiment Analysis
  if (selectedMetrics.includes("sentimentAnalysis") && data.sentimentData) {
    const total = data.sentimentData.positive + data.sentimentData.neutral + data.sentimentData.negative;
    content += `
      <h2>Sentiment Analysis</h2>
      <p>Student interactions have been categorized by sentiment analysis to understand overall satisfaction levels:</p>
      <table>
        <tr><th>Sentiment</th><th>Count</th><th>Percentage</th></tr>
        <tr><td>Positive</td><td>${data.sentimentData.positive.toLocaleString()}</td><td>${Math.round((data.sentimentData.positive / total) * 100)}%</td></tr>
        <tr><td>Neutral</td><td>${data.sentimentData.neutral.toLocaleString()}</td><td>${Math.round((data.sentimentData.neutral / total) * 100)}%</td></tr>
        <tr><td>Negative</td><td>${data.sentimentData.negative.toLocaleString()}</td><td>${Math.round((data.sentimentData.negative / total) * 100)}%</td></tr>
      </table>
      <p>The ${Math.round((data.sentimentData.negative / total) * 100)}% negative sentiment rate indicates areas for improvement in the knowledge base and response quality.</p>
    `;
  }

  // Top Queries
  if (selectedMetrics.includes("topQueries") && data.topQueries) {
    content += `
      <h2>Top Student Queries</h2>
      <p>The following categories represent the most frequently asked topics by students:</p>
      <table>
        <tr><th>Rank</th><th>Query Category</th><th>Count</th></tr>
        ${data.topQueries.map((q, i) => `<tr><td>${i + 1}</td><td>${q.name}</td><td>${q.count.toLocaleString()}</td></tr>`).join("")}
      </table>
      <p>Focus on improving response quality for the top categories to maximize student satisfaction.</p>
    `;
  }

  // Recommendations
  content += `
    <h2>Recommendations</h2>
    <h3>Short-term Actions</h3>
    <ul>
      <li>Review and improve responses for queries with negative sentiment</li>
      <li>Update knowledge base for frequently asked topics</li>
      <li>Monitor peak hours to ensure adequate system capacity</li>
    </ul>
    <h3>Long-term Strategy</h3>
    <ul>
      <li>Expand chatbot capabilities to handle more complex queries</li>
      <li>Implement proactive notifications for common issues</li>
      <li>Develop department-specific response templates</li>
    </ul>
  `;

  const html = `
    <!DOCTYPE html>
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Calibri, sans-serif; font-size: 11pt; line-height: 1.6; }
        h1 { font-size: 24pt; color: #1e3a5f; margin-bottom: 12pt; }
        h2 { font-size: 16pt; color: #2563eb; margin-top: 18pt; margin-bottom: 6pt; }
        h3 { font-size: 13pt; color: #374151; margin-top: 12pt; margin-bottom: 6pt; }
        p { margin-bottom: 12pt; }
        table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
        th, td { border: 1px solid #d1d5db; padding: 8pt; text-align: left; }
        th { background-color: #f3f4f6; font-weight: bold; }
        ul { margin-bottom: 12pt; }
        li { margin-bottom: 6pt; }
        .meta { color: #6b7280; font-size: 10pt; margin-bottom: 24pt; }
      </style>
    </head>
    <body>
      <h1>Student Messaging Analytics Report</h1>
      <p class="meta">Generated on ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      ${content}
    </body>
    </html>
  `;

  const dateStr = data.dateRange
    ? `${formatDateForExport(data.dateRange.from)}_to_${formatDateForExport(data.dateRange.to)}`
    : formatDateForExport(new Date());

  downloadFile(html, `analytics_report_${dateStr}.doc`, "application/msword");
}

/**
 * Generate CSV export
 */
function generateComprehensiveCSV(
  selectedMetrics: string[],
  data: ExportableData
): void {
  const rows: string[] = [];
  const dateRangeStr = data.dateRange
    ? `${formatDateForExport(data.dateRange.from)}_to_${formatDateForExport(data.dateRange.to)}`
    : "all_time";

  // KPI Summary
  if (data.kpiSummary && selectedMetrics.some((m) => ["totalMessages", "avgResponseTime", "satisfactionScore", "costSaved"].includes(m))) {
    rows.push("=== KPI Summary ===");
    rows.push("Metric,Value");
    if (selectedMetrics.includes("totalMessages")) {
      rows.push(`Total Messages,${data.kpiSummary.totalMessages}`);
    }
    if (selectedMetrics.includes("avgResponseTime")) {
      rows.push(`Avg Response Time,${data.kpiSummary.avgResponseTimeFormatted}`);
    }
    if (selectedMetrics.includes("satisfactionScore")) {
      rows.push(`Satisfaction Score,${data.kpiSummary.satisfactionScore}%`);
    }
    if (selectedMetrics.includes("costSaved")) {
      rows.push(`Est. Cost Saved,$${data.kpiSummary.costSaved}`);
    }
    rows.push("");
  }

  // Daily Analytics
  if (selectedMetrics.includes("messageVolumeTrend") && data.dailyAnalytics) {
    rows.push("=== Daily Analytics ===");
    rows.push("Date,Messages,Positive,Neutral,Negative,Unique Students");
    data.dailyAnalytics.forEach((d) => {
      rows.push(`${formatDateForExport(d.date)},${d.totalMessages},${d.positiveCount},${d.neutralCount},${d.negativeCount},${d.uniqueStudents}`);
    });
    rows.push("");
  }

  // Hourly Data
  if (selectedMetrics.includes("peakMessagingTimes") && data.hourlyData) {
    rows.push("=== Peak Messaging Times ===");
    rows.push("Hour,Messages");
    data.hourlyData.forEach((h) => {
      rows.push(`${formatHour(h.hour)},${h.totalMessages}`);
    });
    rows.push("");
  }

  // Top Queries
  if (selectedMetrics.includes("topQueries") && data.topQueries) {
    rows.push("=== Top Queries ===");
    rows.push("Rank,Category,Count");
    data.topQueries.forEach((q, i) => {
      rows.push(`${i + 1},${q.name},${q.count}`);
    });
  }

  downloadFile(rows.join("\n"), `analytics_export_${dateRangeStr}.csv`, "text/csv;charset=utf-8;");
}

/**
 * Main export function - exports selected metrics in specified format
 */
export function exportSelectedMetrics(
  format: ExportFormat,
  selectedMetrics: string[],
  data: ExportableData
): void {
  if (selectedMetrics.length === 0) {
    throw new Error("No metrics selected for export");
  }

  switch (format) {
    case "pdf":
      generateComprehensivePDF(selectedMetrics, data);
      break;
    case "excel":
      generateComprehensiveExcel(selectedMetrics, data);
      break;
    case "word":
      generateComprehensiveWord(selectedMetrics, data);
      break;
    case "csv":
      generateComprehensiveCSV(selectedMetrics, data);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}
