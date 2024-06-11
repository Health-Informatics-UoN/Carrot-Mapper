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
  created_at: Date;
  updated_at: Date;
}

interface DataSetSRList {
  id: number;
  created_at: Date;
  updated_at: Date;
  name: string;
  visibility: string;
  hidden: boolean | null;
  data_partner: number;
  viewers: number[];
  admins: number[];
  editors: number[];
}
interface Projects {
  id: number;
  name: string;
  members: number[];
  created_at: Date;
  updated_at: Date;
  datasets: number[];
}

interface Users {
  id: number;
  username: string;
}
