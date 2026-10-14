import type { SpinePerformanceReport } from "./spinePerformanceReport";

export interface PerformanceBaseline {
  label: string;
  modelName: string;
  report: SpinePerformanceReport;
}
