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
