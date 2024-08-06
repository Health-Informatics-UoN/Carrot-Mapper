interface ScanReport {
  id: number;
  dataset: string;
  parent_dataset: DatasetStrict;
  data_partner: string;
  status: string;
  created_at: Date;
  hidden: boolean;
  visibility: string;
  author: number;
  viewers: number[];
  editors: number[];
}

interface ScanReportTable {
  id: number;
  created_at: Date;
  updated_at: Date;
  name: string;
  scan_report: number;
  person_id: string | null;
  date_event: string | null;
  permissions: Permission[];
}

interface ScanReportField {
  id: number;
  created_at: Date;
  updated_at: Date;
  name: string;
  description_column: string;
  type_column: string;
  max_length: number;
  nrows: number;
  nrows_checked: number;
  fraction_empty: string;
  nunique_values: number;
  fraction_unique: string;
  ignore_column: boolean | null;
  is_patient_id: boolean;
  is_ignore: boolean;
  classification_system: string | null;
  pass_from_source: boolean;
  concept_id: number;
  concepts?: Concept[];
  permissions: Permission[];
  field_description: string | null;
  scan_report_table: number;
}

interface ScanReportConcept {
  id: number;
  created_at: Date;
  updated_at: Date;
  nlp_entity: string | null;
  nlp_entity_type: string | null;
  nlp_confidence: string | null;
  nlp_vocabulary: string | null;
  nlp_concept_code: string | null;
  nlp_processed_string: string | null;
  object_id: number;
  creation_type: string;
  concept: Concept | number;
  content_type: number;
}

interface ScanReportValue {
  id: number;
  value: string;
  frequency: number;
  value_description: string;
  scan_report_field: number;
  // TODO: These should be added in a inherited type, as they are not returned from the API.
  concepts?: Concept[];
  permissions: Permission[];
}
