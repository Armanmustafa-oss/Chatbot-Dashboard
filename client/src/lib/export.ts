/**
 * Export utilities for downloading data as CSV or PDF
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
        // Handle values that might contain commas or quotes
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
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
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
