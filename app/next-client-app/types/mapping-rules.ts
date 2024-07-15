interface MappingRule {
  rule_id: number;
  omop_term: string;
  destination_table: MappingRuleTable;
  domain: MappingRuleDomain;
  destination_field: MappingRuleField;
  source_table: MappingRuleTable;
  source_field: MappingRuleField;
  term_mapping: MappingRuleTermMapping | null;
  creation_type: string;
}

interface MappingRuleTable {
  id: number;
  name: string;
}

interface MappingRuleDomain {
  name: string;
}

interface MappingRuleField {
  id: number;
  name: string;
}

interface MappingRuleTermMapping {
  [key: string]: number;
}

interface RawData {
  data: AnalyseRuleData[];
}
interface AnalyseRuleData {
  rule_id: number;
  rule_name: string;
  anc_desc: AncDesc[];
}

interface AncDesc {
  descendants: Descendant[];
  ancestors: Ancestor[];
}

interface Ancestor {
  a_id: number;
  a_name: string;
  source: SourceField[];
  level: string[];
}

interface Descendant {
  d_id: number;
  d_name: string;
  source: SourceField[];
  level: string[];
}

interface SourceField {
  source_field__id: number;
  source_field__name: string;
  source_field__scan_report_table__id: number;
  source_field__scan_report_table__name: string;
  source_field__scan_report_table__scan_report: number;
  concept__content_type: number;
}
