interface Job {
  id: number;
  created_at: Date;
  updated_at: Date;
  details: string;
  scan_report: number | null;
  scan_report_table: number | null;
  status: { value: string };
  stage: { value: string };
}
