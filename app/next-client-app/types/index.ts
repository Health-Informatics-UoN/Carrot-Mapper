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

interface DataSetPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: DataSet[];
}

interface DataSet {
  id: number;
  name: string;
  hidden: boolean;
  visibility: string;
  created_at: string;
  data_partner: DataPartner;
  admins: string[];
}

interface DataPartner {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}
