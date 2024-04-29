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

interface DataSet {
  count: number;
  next: string | null;
  previous: string | null;
  results: DataSetResult[];
}

interface DataSetResult {
  id: number;
  name: string;
  hidden: boolean;
  visibility: string;
  created_at: string;
  data_partner: DataPartnerData;
  admins: string[];
}

interface DataPartnerData {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}
