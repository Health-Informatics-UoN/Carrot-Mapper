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
