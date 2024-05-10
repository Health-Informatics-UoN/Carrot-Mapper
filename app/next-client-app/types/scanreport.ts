interface ScanReportResult {
  id: number;
  dataset: string;
  parent_dataset: string;
  data_partner: string;
  status: string;
  created_at: Date;
  hidden: boolean;
}
interface ScanReport {
  count: number;
  next: string | null;
  previous: string | null;
  results: ScanReportResult[];
}

interface ScanReportTables {
  count: number;
  next: string | null;
  previous: string | null;
  results: ScanReportTablesResult[];
}

interface ScanReportTablesResult {
  id: number;
  created_at: Date;
  updated_at: Date;
  name: string;
  scan_report: number;
  person_id: string | null;
  date_event: string | null;
}
