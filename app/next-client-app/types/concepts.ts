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
}
