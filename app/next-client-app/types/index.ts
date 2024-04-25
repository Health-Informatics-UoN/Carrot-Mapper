interface ScanReportResult {
  id: number;
  dataset: string;
  parent_dataset: string;
  data_partner: string;
  status: string;
  created_at: Date;
}
interface ScanReport {
  count: number;
  next: string | null;
  previous: string | null;
  results: ScanReportResult[];
}
