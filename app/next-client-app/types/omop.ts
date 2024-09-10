interface Concept {
  concept_id: number;
  concept_name: string;
  concept_code: string;
  // TODO: these are added in code, not returned in API.
  scan_report_concept_id?: number;
  creation_type: string;
}
