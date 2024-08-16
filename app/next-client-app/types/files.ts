type FileTypeFormat = "application/json" | "image/svg+xml" | "text/csv";
type FileTypeValue =
  | "mapping_json"
  | "mapping_csv"
  | "mapping_svg"
  | "data_dictionary"
  | "scan_report";

interface FileType {
  value: FileTypeValue;
  display_name:
    | "Mapping Rules JSON"
    | "Mapping Rules CSV"
    | "Mapping Rules SVG"
    | "Data Dictionary"
    | "Scan Report";
}

interface FileDownload {
  id: number;
  scan_report: number;
  name: string;
  created_at: Date;
  user: User;
  file_type: FileType;
  file_url: string;
}
