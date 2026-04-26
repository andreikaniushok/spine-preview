import type { SpinePerformanceReport } from "../analysis/spinePerformanceReport";

export interface PerformanceBaseline {
  label: string;
  modelName: string;
  report: SpinePerformanceReport;
}
