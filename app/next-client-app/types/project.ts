interface Project {
  id: number;
  name: string;
  members: number[];
  datasets: DataSet[];
  created_at: Date;
  updated_at: Date;
}
