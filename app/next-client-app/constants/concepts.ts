export const m_allowed_tables = [
  "person",
  "measurement",
  "condition_occurrence",
  "observation",
  "drug_exposure",
  "procedure_occurrence",
  "specimen",
];

export const m_date_field_mapper = {
  person: ["birth_datetime"],
  condition_occurrence: ["condition_start_datetime", "condition_end_datetime"],
  measurement: ["measurement_datetime"],
  observation: ["observation_datetime"],
  drug_exposure: ["drug_exposure_start_datetime", "drug_exposure_end_datetime"],
  procedure_occurrence: ["procedure_datetime"],
  specimen: ["specimen_datetime"],
};
