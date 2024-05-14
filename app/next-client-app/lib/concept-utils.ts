import { AddMappingRule, getContentTypeId } from "@/api/concepts";
import { getOmopFields, getOmopTable, getOmopTables } from "@/api/omop";
import { m_allowed_tables } from "@/constants/concepts";

//function to map concept domain to an omop field
export const mapConceptToOmopField = () => {
  // cached values
  let omopTables: OmopTable[] | null = null;

  // mapping function which is returned by this function
  return async (fields: OmopField[], domain: string, table?: any) => {
    //if omop table is not specified
    if (!table) {
      // get omop fields that match specified domain
      const mappedFields = fields.filter((field) => field.field == domain);
      if (mappedFields.length < 2) {
        return mappedFields[0];
      }
      // if there are more than 1 fields that match the domain
      // if omopTables hasn't previously been retrieved retreive it, otherwise, use cached version
      if (!omopTables) {
        omopTables = await getOmopTables();
      }
      // find correct field to return
      let mappedTables: {
        table: OmopTable | null;
        field: OmopField;
        isAllowed?: any;
      }[] = mappedFields.map((field) => ({
        table: omopTables?.find((t) => t.id == field.table) ?? null,
        field: field,
      }));
      mappedTables = mappedTables.map((val) => ({
        ...val,
        isAllowed: m_allowed_tables.includes(val.table?.table ?? ""),
      }));
      return mappedTables.find((val) => val.isAllowed == true)?.field;
    }
    if (!omopTables) {
      omopTables = await getOmopTables();
    }
    // find omop field with specified table and domain
    let mappedTable = omopTables.find((t) => t.table == table) ?? null;
    const mappedField = fields.find(
      (f) => f.table == mappedTable?.id && f.field == domain,
    );
    return mappedField;
  };
};

// function to save mapping rules copying python implementation
export const saveMappingRules = async (
  scan_report_concept: ScanReportConcept,
  // scan_report_value,
  table: ScanReportTable,
) => {
  const domain = (
    scan_report_concept.concept as Concept
  ).domain_id.toLowerCase();
  const fields = await getOmopFields();
  const cachedOmopFunction = mapConceptToOmopField();
  const m_date_field_mapper = {
    person: ["birth_datetime"],
    condition_occurrence: [
      "condition_start_datetime",
      "condition_end_datetime",
    ],
    measurement: ["measurement_datetime"],
    observation: ["observation_datetime"],
    drug_exposure: [
      "drug_exposure_start_datetime",
      "drug_exposure_end_datetime",
    ],
    procedure_occurrence: ["procedure_datetime"],
    specimen: ["specimen_datetime"],
  };
  const destination_field = await cachedOmopFunction(
    fields,
    domain + "_source_concept_id",
  );
  // if a destination field can't be found for concept domain, return error
  if (destination_field == undefined) {
    throw "Could not find a destination field for this concept";
  }
  // create a list to populate with requests for each structural mapping rule to be created
  const promises = [];
  // data object to be passed to post request to create mapping rule
  const data: any = {
    scan_report: table.scan_report,
    concept: scan_report_concept.id,
    approved: true,
    creation_type: "M",
  };
  // create mapping rule for the following
  //person_id
  data.omop_field = fields.filter(
    (field) =>
      field.field == "person_id" && field.table == destination_field.table,
  )[0].id;
  data.source_field = table.person_id;
  promises.push(await AddMappingRule(data));
  //date_event
  data.source_field = table.date_event;
  const omopTable = await getOmopTable(destination_field.table.toString());
  const date_omop_fields =
    m_date_field_mapper[omopTable.table as keyof typeof m_date_field_mapper];
  date_omop_fields.forEach(async (element: any) => {
    data.omop_field = fields.filter(
      (field) =>
        field.field == element && field.table == destination_field.table,
    )[0].id;
    promises.push(await AddMappingRule(data));
  });

  // Get the content_type_id for the scan_report_field
  const { content_type_id } = await getContentTypeId("scanreportfield");

  // set source field depending on content type
  if (scan_report_concept.content_type == content_type_id) {
    data.source_field = scan_report_concept.object_id;
  } else {
    // data.source_field = scan_report_value.scan_report_field;
  }
  //_source_concept_id
  data.omop_field = destination_field.id;
  promises.push(await AddMappingRule(data));
  //_concept_id
  let tempOmopField = await cachedOmopFunction(fields, domain + "_concept_id");
  data.omop_field = tempOmopField?.id;
  promises.push(await AddMappingRule(data));
  //_source_value
  tempOmopField = await cachedOmopFunction(fields, domain + "_source_value");
  data.omop_field = tempOmopField?.id;
  promises.push(await AddMappingRule(data));
  //measurement
  if (domain == "measurement") {
    tempOmopField = await cachedOmopFunction(
      fields,
      "value_as_number",
      "measurement",
    );
    data.omop_field = tempOmopField?.id;
    promises.push(await AddMappingRule(data));
  }
  // when all requests have finished, return
  return promises;
};
