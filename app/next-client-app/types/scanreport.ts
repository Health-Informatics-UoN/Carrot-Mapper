interface ScanReport {
  count: number;
  next: string | null;
  previous: string | null;
  results: ScanReportResult[];
}

type ScanReportResult = ScanReportList | ScanReportTable | ScanReportField;

interface ScanReportList {
  id: number;
  dataset: string;
  parent_dataset: string;
  data_partner: string;
  status: string;
  created_at: Date;
  hidden: boolean;
}

interface ScanReportTable {
  id: number;
  created_at: Date;
  updated_at: Date;
  name: string;
  scan_report: number;
  person_id: string | null;
  date_event: string | null;
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
  field_description: string | null;
  scan_report_table: number;
}

interface Concept {
  concept_id: number;
  concept_name: string;
  domain_id: string;
  vocabulary_id: string;
  concept_class_id: string;
  standard_concept: string | null;
  concept_code: string;
  valid_start_date: Date;
  valid_end_date: Date;
  invalid_reason: string;
}

interface OmopField {
  id: number;
  created_at: Date;
  updated_at: Date;
  field: string;
  table: number;
}

interface OmopTable {
  id: number;
  created_at: Date;
  updated_at: Date;
  table: string;
}

interface ConceptFilter {
  concept_id: number;
  concept_name: string;
  domain_id: string;
  vocabulary_id: string;
  concept_class_id: string;
  standard_concept: string | null;
  concept_code: string;
  valid_start_date: Date;
  valid_end_date: Date;
  invalid_reason: string;
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

interface AddMappingRuleResponse {
  id: number;
  created_at: Date;
  updated_at: Date;
  approved: boolean;
  scan_report: number;
  omop_field: number;
  source_table: any;
  source_field: number;
  concept: number;
}
