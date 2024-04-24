interface ScanReport {
  id: number;
  author: number | null;
  name: string;
  dataset: string;
  hidden: boolean;
  file: string | null;
  status: string;
  data_dictionary: number | null;
  parent_dataset: number | null;
  visibility: string;
  viewers: number[];
  editors: number[];
  created_at: string;
  updated_at: string;
  data_partner: string;
  dataset_name: string;
  author_name: string;
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
