interface ScanReportResult {
  id: number;
  name: string;
  dataset: string;
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
