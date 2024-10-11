interface Project {
  id: number;
  name: string;
  members: User[];
  datasets: DataSet[];
  created_at: Date;
  updated_at: Date;
}
