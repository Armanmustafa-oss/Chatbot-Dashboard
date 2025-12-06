/**
 * Enhanced Export Utilities
 * Supports CSV, PDF, Excel (XLSX), and Word (DOCX) exports
 */

export interface ExportColumn {
  key: string;
  header: string;
}

/**
 * Convert data array to CSV string
 */
export function toCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[]
): string {
  const headers = columns.map((col) => col.header).join(",");
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key];
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? "";
      })
      .join(",")
  );
  return [headers, ...rows].join("\n");
}

/**
 * Download a string as a file
 */
export function downloadFile(content: string | Blob, filename: string, mimeType?: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data as CSV file
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  const csv = toCSV(data, columns);
  downloadFile(csv, `${filename}.csv`, "text/csv;charset=utf-8;");
}

/**
 * Format date for export
 */
export function formatDateForExport(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

/**
 * Export messages to CSV
 */
export function exportMessagesToCSV(messages: Array<{
  id: number;
  studentId: number;
  query: string;
  response: string | null;
  sentiment: string | null;
  category: string | null;
  responseTimeMs: number | null;
  rating: number | null;
  createdAt: Date | string;
}>): void {
  const columns: ExportColumn[] = [
    { key: "id", header: "ID" },
    { key: "studentId", header: "Student ID" },
    { key: "query", header: "Query" },
    { key: "response", header: "Response" },
    { key: "sentiment", header: "Sentiment" },
    { key: "category", header: "Category" },
    { key: "responseTimeMs", header: "Response Time (ms)" },
    { key: "rating", header: "Rating" },
    { key: "createdAt", header: "Date" },
  ];

  const formattedData = messages.map((m) => ({
    ...m,
    createdAt: formatDateForExport(m.createdAt),
  }));

  exportToCSV(formattedData, columns, `messages_export_${formatDateForExport(new Date())}`);
}

/**
 * Export analytics to CSV
 */
export function exportAnalyticsToCSV(analytics: Array<{
  date: Date | string;
  totalMessages: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  avgResponseTimeMs: number | null;
  avgRating: number | null;
  uniqueStudents: number;
}>): void {
  const columns: ExportColumn[] = [
    { key: "date", header: "Date" },
    { key: "totalMessages", header: "Total Messages" },
    { key: "positiveCount", header: "Positive" },
    { key: "neutralCount", header: "Neutral" },
    { key: "negativeCount", header: "Negative" },
    { key: "avgResponseTimeMs", header: "Avg Response Time (ms)" },
    { key: "avgRating", header: "Avg Rating" },
    { key: "uniqueStudents", header: "Unique Students" },
  ];

  const formattedData = analytics.map((a) => ({
    ...a,
    date: formatDateForExport(a.date),
    avgRating: a.avgRating ? (a.avgRating / 10).toFixed(1) : "",
  }));

  exportToCSV(formattedData, columns, `analytics_export_${formatDateForExport(new Date())}`);
}

/**
 * Export students to CSV
 */
export function exportStudentsToCSV(students: Array<{
  id: number;
  studentId: string;
  name: string | null;
  email: string | null;
  department: string | null;
  createdAt: Date | string;
  lastActiveAt: Date | string;
}>): void {
  const columns: ExportColumn[] = [
    { key: "id", header: "ID" },
    { key: "studentId", header: "Student ID" },
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "department", header: "Department" },
    { key: "createdAt", header: "Created At" },
    { key: "lastActiveAt", header: "Last Active" },
  ];

  const formattedData = students.map((s) => ({
    ...s,
    createdAt: formatDateForExport(s.createdAt),
    lastActiveAt: formatDateForExport(s.lastActiveAt),
  }));

  exportToCSV(formattedData, columns, `students_export_${formatDateForExport(new Date())}`);
}

/**
 * Generate HTML content for PDF export
 */
function generatePDFHTML(
  title: string,
  subtitle: string,
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  summary?: { label: string; value: string | number }[]
): string {
  const tableRows = data
    .map(
      (row) =>
        `<tr>${columns
          .map((col) => `<td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${row[col.key] ?? ""}</td>`)
          .join("")}</tr>`
    )
    .join("");

  const summarySection = summary
    ? `<div style="display: flex; gap: 24px; margin-bottom: 24px; flex-wrap: wrap;">
        ${summary
          .map(
            (s) => `
          <div style="background: #f3f4f6; padding: 16px 24px; border-radius: 8px;">
            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">${s.label}</div>
            <div style="font-size: 24px; font-weight: bold; color: #111827;">${s.value}</div>
          </div>
        `
          )
          .join("")}
      </div>`
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #111827; }
        h1 { margin: 0 0 8px 0; font-size: 28px; }
        .subtitle { color: #6b7280; margin-bottom: 24px; }
        .meta { font-size: 12px; color: #9ca3af; margin-bottom: 32px; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th { text-align: left; padding: 12px 8px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-weight: 600; }
        td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="subtitle">${subtitle}</div>
      <div class="meta">Generated on ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
      ${summarySection}
      <table>
        <thead>
          <tr>${columns.map((col) => `<th>${col.header}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <div class="footer">
        <p>EduBot Analytics Dashboard • Confidential Report</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Export data as PDF (uses print dialog)
 */
export function exportToPDF(
  title: string,
  subtitle: string,
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  summary?: { label: string; value: string | number }[]
): void {
  const html = generatePDFHTML(title, subtitle, data, columns, summary);
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
 * Export analytics as PDF report
 */
export function exportAnalyticsToPDF(
  analytics: Array<{
    date: Date | string;
    totalMessages: number;
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
    avgResponseTimeMs: number | null;
    avgRating: number | null;
    uniqueStudents: number;
  }>,
  kpiSummary?: {
    totalMessages: number;
    avgResponseTime: number;
    satisfactionScore: number;
    costSaved: number;
  }
): void {
  const columns: ExportColumn[] = [
    { key: "date", header: "Date" },
    { key: "totalMessages", header: "Messages" },
    { key: "positiveCount", header: "Positive" },
    { key: "neutralCount", header: "Neutral" },
    { key: "negativeCount", header: "Negative" },
    { key: "uniqueStudents", header: "Students" },
  ];

  const formattedData = analytics.map((a) => ({
    ...a,
    date: formatDateForExport(a.date),
  }));

  const summary = kpiSummary
    ? [
        { label: "Total Messages", value: kpiSummary.totalMessages.toLocaleString() },
        { label: "Avg Response Time", value: `${kpiSummary.avgResponseTime}ms` },
        { label: "Satisfaction Score", value: `${kpiSummary.satisfactionScore}%` },
        { label: "Est. Cost Saved", value: `$${kpiSummary.costSaved.toLocaleString()}` },
      ]
    : undefined;

  exportToPDF("Analytics Report", "Student Messaging Analytics Dashboard", formattedData, columns, summary);
}

/**
 * Export messages as PDF report
 */
export function exportMessagesToPDF(
  messages: Array<{
    id: number;
    studentId: number;
    query: string;
    response: string | null;
    sentiment: string | null;
    category: string | null;
    createdAt: Date | string;
  }>
): void {
  const columns: ExportColumn[] = [
    { key: "id", header: "ID" },
    { key: "query", header: "Query" },
    { key: "sentiment", header: "Sentiment" },
    { key: "category", header: "Category" },
    { key: "createdAt", header: "Date" },
  ];

  const formattedData = messages.map((m) => ({
    ...m,
    query: m.query.length > 50 ? m.query.substring(0, 50) + "..." : m.query,
    createdAt: formatDateForExport(m.createdAt),
  }));

  exportToPDF("Messages Report", "Student Query Log", formattedData, columns);
}

/**
 * Generate Excel-compatible XML (SpreadsheetML)
 * This creates a file that Excel can open without additional libraries
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string,
  sheetName: string = "Sheet1"
): void {
  const rows = data
    .map(
      (row) =>
        `<Row>${columns
          .map((col) => {
            const value = row[col.key];
            const type = typeof value === "number" ? "Number" : "String";
            return `<Cell><Data ss:Type="${type}">${value ?? ""}</Data></Cell>`;
          })
          .join("")}</Row>`
    )
    .join("");

  const headerRow = `<Row>${columns
    .map((col) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${col.header}</Data></Cell>`)
    .join("")}</Row>`;

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
  <Worksheet ss:Name="${sheetName}">
    <Table>
      ${headerRow}
      ${rows}
    </Table>
  </Worksheet>
</Workbook>`;

  downloadFile(xml, `${filename}.xls`, "application/vnd.ms-excel");
}

/**
 * Export analytics to Excel
 */
export function exportAnalyticsToExcel(
  analytics: Array<{
    date: Date | string;
    totalMessages: number;
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
    avgResponseTimeMs: number | null;
    avgRating: number | null;
    uniqueStudents: number;
  }>
): void {
  const columns: ExportColumn[] = [
    { key: "date", header: "Date" },
    { key: "totalMessages", header: "Total Messages" },
    { key: "positiveCount", header: "Positive" },
    { key: "neutralCount", header: "Neutral" },
    { key: "negativeCount", header: "Negative" },
    { key: "avgResponseTimeMs", header: "Avg Response Time (ms)" },
    { key: "uniqueStudents", header: "Unique Students" },
  ];

  const formattedData = analytics.map((a) => ({
    ...a,
    date: formatDateForExport(a.date),
    avgResponseTimeMs: a.avgResponseTimeMs ?? 0,
  }));

  exportToExcel(formattedData, columns, `analytics_export_${formatDateForExport(new Date())}`, "Analytics");
}

/**
 * Export messages to Excel
 */
export function exportMessagesToExcel(
  messages: Array<{
    id: number;
    studentId: number;
    query: string;
    response: string | null;
    sentiment: string | null;
    category: string | null;
    responseTimeMs: number | null;
    rating: number | null;
    createdAt: Date | string;
  }>
): void {
  const columns: ExportColumn[] = [
    { key: "id", header: "ID" },
    { key: "studentId", header: "Student ID" },
    { key: "query", header: "Query" },
    { key: "response", header: "Response" },
    { key: "sentiment", header: "Sentiment" },
    { key: "category", header: "Category" },
    { key: "responseTimeMs", header: "Response Time (ms)" },
    { key: "rating", header: "Rating" },
    { key: "createdAt", header: "Date" },
  ];

  const formattedData = messages.map((m) => ({
    ...m,
    createdAt: formatDateForExport(m.createdAt),
    responseTimeMs: m.responseTimeMs ?? 0,
    rating: m.rating ?? 0,
  }));

  exportToExcel(formattedData, columns, `messages_export_${formatDateForExport(new Date())}`, "Messages");
}

/**
 * Generate Word-compatible HTML document
 */
export function exportToWord(
  title: string,
  content: string,
  filename: string
): void {
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
        .meta { color: #6b7280; font-size: 10pt; margin-bottom: 24pt; }
        .highlight { background-color: #fef3c7; padding: 2pt 4pt; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="meta">Generated on ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      ${content}
    </body>
    </html>
  `;

  downloadFile(html, `${filename}.doc`, "application/msword");
}

/**
 * Export analytics narrative report to Word
 */
export function exportAnalyticsToWord(
  analytics: Array<{
    date: Date | string;
    totalMessages: number;
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
  }>,
  kpiSummary: {
    totalMessages: number;
    avgResponseTime: number;
    satisfactionScore: number;
    costSaved: number;
  }
): void {
  const totalPositive = analytics.reduce((sum, a) => sum + a.positiveCount, 0);
  const totalNeutral = analytics.reduce((sum, a) => sum + a.neutralCount, 0);
  const totalNegative = analytics.reduce((sum, a) => sum + a.negativeCount, 0);
  const avgDaily = Math.round(kpiSummary.totalMessages / analytics.length);

  const content = `
    <h2>Executive Summary</h2>
    <p>This report provides an analysis of student messaging activity over the past ${analytics.length} days. The chatbot system has demonstrated strong performance with a <span class="highlight">${kpiSummary.satisfactionScore}% satisfaction rate</span> and estimated cost savings of <span class="highlight">$${kpiSummary.costSaved.toLocaleString()}</span>.</p>

    <h2>Key Performance Indicators</h2>
    <table>
      <tr><th>Metric</th><th>Value</th></tr>
      <tr><td>Total Messages Processed</td><td>${kpiSummary.totalMessages.toLocaleString()}</td></tr>
      <tr><td>Average Response Time</td><td>${kpiSummary.avgResponseTime}ms</td></tr>
      <tr><td>Satisfaction Score</td><td>${kpiSummary.satisfactionScore}%</td></tr>
      <tr><td>Estimated Cost Savings</td><td>$${kpiSummary.costSaved.toLocaleString()}</td></tr>
      <tr><td>Average Daily Messages</td><td>${avgDaily.toLocaleString()}</td></tr>
    </table>

    <h2>Sentiment Analysis</h2>
    <p>Student interactions have been categorized by sentiment analysis:</p>
    <table>
      <tr><th>Sentiment</th><th>Count</th><th>Percentage</th></tr>
      <tr><td>Positive</td><td>${totalPositive.toLocaleString()}</td><td>${Math.round((totalPositive / kpiSummary.totalMessages) * 100)}%</td></tr>
      <tr><td>Neutral</td><td>${totalNeutral.toLocaleString()}</td><td>${Math.round((totalNeutral / kpiSummary.totalMessages) * 100)}%</td></tr>
      <tr><td>Negative</td><td>${totalNegative.toLocaleString()}</td><td>${Math.round((totalNegative / kpiSummary.totalMessages) * 100)}%</td></tr>
    </table>

    <h2>Recommendations</h2>
    <h3>Short-term Actions</h3>
    <p>Based on the data analysis, we recommend focusing on improving response quality for the ${totalNegative.toLocaleString()} negative interactions identified. Review these conversations to identify common pain points and update the knowledge base accordingly.</p>

    <h3>Long-term Strategy</h3>
    <p>With an average of ${avgDaily.toLocaleString()} messages per day, the system is operating efficiently. Consider expanding the chatbot's capabilities to handle more complex queries and reduce the need for human escalation.</p>

    <h2>Conclusion</h2>
    <p>The student messaging analytics indicate a healthy and effective chatbot system. Continued monitoring and iterative improvements will ensure sustained performance and student satisfaction.</p>
  `;

  exportToWord("Student Messaging Analytics Report", content, `analytics_report_${formatDateForExport(new Date())}`);
}

export type ExportFormat = "csv" | "pdf" | "excel" | "word";

export interface ExportOptions {
  format: ExportFormat;
  title?: string;
  subtitle?: string;
  includeKPI?: boolean;
}
