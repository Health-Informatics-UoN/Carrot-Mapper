import { AddMappingRule, getContentTypeId } from "@/api/concepts";
import { getOmopFields, getOmopTable, getOmopTables } from "@/api/omop";
import { m_allowed_tables } from "@/constants/concepts";
import { objToQuery } from "./client-utils";

//function to map concept domain to an omop field
export const mapConceptToOmopField = () => {
  let omopTables: OmopTable[] | null = null;
  // This const will return a function which will receive three params, and one is optional
  // This optional one is the name of the omop table (check api/omoptables/ to confirm), so it should have the name omop_table_name: string, not table (misleading)
  // This optional one also maybe not nessessary because we didn't pass it anyway in add_concept.tsx, so it will not be there by any means. And because of the reason on line 44, I suggest we can remove it, line 19 and lines 45-54
  return async (
    fields: OmopField[],
    domain: string,
    omop_table_name?: string
  ) => {
    // If omop_table_name is not provided (which will not be anyway), the function filters fields to get those that match the provided domain

    if (!omop_table_name) {
      // This condition is confusing and misleading, I suggest to remove it
      // get omop fields that match specified domain
      const mappedFields = fields.filter((field) => field.field == domain);
      if (mappedFields.length < 2) {
        return mappedFields[0]; // The code last time still worked, even though it had some errors, becasue it stopped here
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
    // If omop_table_name is provided, which will not happen (so we can remove the code below, I suppose), the function retrieves OMOP tables data ...
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
  table: ScanReportTable
) => {
  const domain = (
    scan_report_concept.concept as Concept
  ).domain_id.toLowerCase();
  const fields = await getOmopFields();
  const typeNameQuery = objToQuery({
    type_name: "scanreportfield",
  });
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
    domain + "_source_concept_id"
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
      field.field == "person_id" && field.table == destination_field.table
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
  scanReportsResult: ScanReportResult[],
  scanReportsConcepts: ScanReportConcept[],
  concepts: Concept[]
) => {
  for (const result of scanReportsResult) {
    (result as ScanReportField).concepts = [];
    scanReportsConcepts.map((scanreportconcept) => {
      if (scanreportconcept.object_id === (result as ScanReportField).id) {
        let concept = concepts.find(
          (x) => x.concept_id === scanreportconcept.concept
        );
        if (concept) {
          (result as ScanReportField).concepts?.push({
            ...concept,
            scan_report_concept_id: scanreportconcept.id,
          });
        }
      }
    });
  }
  return scanReportsResult;
};
