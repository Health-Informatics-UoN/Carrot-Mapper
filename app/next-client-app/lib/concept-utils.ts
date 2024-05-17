import { AddMappingRule, getContentTypeId } from "@/api/concepts";
import { getOmopFields, getOmopTable, getOmopTables } from "@/api/omop";
import { m_allowed_tables, m_date_field_mapper } from "@/constants/concepts";
import { objToQuery } from "./client-utils";
import { getTableValues } from "@/api/scanreports";

//function to map concept domain to an omop field
export const mapConceptToOmopField = () => {
  let omopTables: OmopTable[] | null = null;
  // This const will return a function which will receive three params, and one is optional
  // This optional one is the name of the omop table (check api/omoptables/ to confirm), so it should have the name omop_table_name: string, not table (misleading)
  return async (
    fields: OmopField[],
    domain: string,
    omop_table_name?: string
  ) => {
    // If omop_table_name is not provided, the function filters fields to get those that match the provided domain

    if (!omop_table_name) {
      // get omop fields that match specified domain
      const mappedFields = fields.filter((field) => field.field == domain);
      if (mappedFields.length < 2) {
        return mappedFields[0];
      }
      //  If there are multiple matching fields, it retrieves OMOP tables data
      if (!omopTables) {
        omopTables = await getOmopTables();
      }
      // finds the field whose table is included in the m_allowed_tables list, which we will do again in the next step of add_conept.tsx, but we need it here.
      let mappedTables: {
        table: OmopTable | null;
        field: OmopField;
        isAllowed?: boolean; // Add this one here only for the purpose of filter the field whose table is included in the m_allowed_tables list or not
      }[] = mappedFields.map((field) => ({
        table: omopTables?.find((t) => t.id == field.table) ?? null,
        field: field,
      }));
      mappedTables = mappedTables.map((val) => ({
        ...val,
        isAllowed: m_allowed_tables.includes(val.table?.table ?? ""),
      }));
      return mappedTables.find((val) => val.isAllowed == true)?.field; // Return the valid field
    }
    // If omop_table_name is provided, the function retrieves OMOP tables data ...
    if (!omopTables) {
      omopTables = await getOmopTables();
    }
    // ... then finds the field that matches both the provided omop_table_name and passed domain
    let mappedTable =
      omopTables.find((t) => t.table == omop_table_name) ?? null;
    const mappedField = fields.find(
      (f) => f.table == mappedTable?.id && f.field == domain
    );
    return mappedField; // return the matching field
  };
};

// function to save mapping rules copying python implementation
export const saveMappingRules = async (
  scan_report_concept: ScanReportConcept,
  // scan_report_value,
  table: ScanReportTable,
  destination_field: OmopField
) => {
  // Get the number values of person_id and date_event from v1 scanreporttables API
  const tableValues = await getTableValues(table.id.toString());
  const domain = (
    scan_report_concept.concept as Concept
  ).domain_id.toLowerCase();

  const fields = await getOmopFields();
  const typeNameQuery = objToQuery({
    type_name: "scanreportfield",
  });
  const cachedOmopFunction = mapConceptToOmopField();

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
      field.field == "person_id" && field.table == destination_field.table
  )[0].id;
  data.source_field = tableValues.person_id;
  promises.push(await AddMappingRule(data));
  //date_event
  data.source_field = tableValues.date_event;
  const omopTable = await getOmopTable(destination_field.table.toString());
  const date_omop_fields =
    m_date_field_mapper[omopTable.table as keyof typeof m_date_field_mapper];
  date_omop_fields.forEach(async (element: any) => {
    data.omop_field = fields.filter(
      (field) =>
        field.field == element && field.table == destination_field.table
    )[0].id;
    promises.push(await AddMappingRule(data));
  });

  // Get the content_type_id for the scan_report_field
  const { content_type_id } = await getContentTypeId(typeNameQuery);

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
      "measurement"
    );
    data.omop_field = tempOmopField?.id;
    promises.push(await AddMappingRule(data));
  }
  // when all requests have finished, return
  return promises;
};

// Method to add concepts to a scanreport result
export const addConceptsToResults = (
  scanReportsResult: ScanReportField[],
  scanReportsConcepts: ScanReportConcept[],
  concepts: Concept[]
) => {
  for (const result of scanReportsResult) {
    result.concepts = [];
    scanReportsConcepts.map((scanreportconcept) => {
      if (scanreportconcept.object_id === result.id) {
        let concept = concepts.find(
          (x) => x.concept_id === scanreportconcept.concept
        );
        if (concept) {
          result.concepts?.push({
            ...concept,
            scan_report_concept_id: scanreportconcept.id,
          });
        }
      }
    });
  }
  return scanReportsResult;
};
