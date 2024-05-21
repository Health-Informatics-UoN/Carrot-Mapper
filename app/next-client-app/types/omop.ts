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
  scan_report_concept_id?: number;
  creation_type: string;
}
