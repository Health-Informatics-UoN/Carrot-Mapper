import { getOmopTable } from "@/api/scanreports";

//function to map concept domain to an omop field
export const mapConceptToOmopField = async (
  table: ScanReportTable,
  fields: OmopField[],
  domain: string,
  combinedDomain: string
): Promise<any> => {
  // cached values
  let omopTables: OmopTable[];
  // mapping function which is returned by this function
  //if omop table is not specified
  if (!table) {
    // get omop fields that match specified domain
    const mappedFields = fields.filter((field) => field.field == domain);
    if (mappedFields.length < 2) {
      return mappedFields[0];
    }
    // if there are more than 1 fields that match the domain
    // if omopTables hasn't previously been retrieved retreive it, otherwise, use cached version
    const m_allowed_tables = [] as any; // Declare the variable m_allowed_tables
    let omopTables: OmopTable[] = []; // Declare and initialize omopTables as an empty array
    omopTables = await getOmopTable();
    // find correct field to return
    let mappedTables = mappedFields.map((field) => ({
      table: omopTables.find((t) => t.id == field.table),
      field: field,
      isAllowed: false, // Add the 'isAllowed' property and initialize it as false
    }));
    mappedTables = mappedTables.map((val) => ({
      ...val,
      isAllowed: val.table && m_allowed_tables.includes(val.table.table),
    }));
    return mappedTables.find((val) => val.isAllowed == true)?.field;
  }

  omopTables = await getOmopTable();
  // find omop field with specified table and domain
  let mappedTable = omopTables.find((t) => t.table == domain);
  const mappedField = fields.find(
    (f) => f.table == (mappedTable?.id ?? "") && f.field == combinedDomain
  );
  return mappedField;
};
