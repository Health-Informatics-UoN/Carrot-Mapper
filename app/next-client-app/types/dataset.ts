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
