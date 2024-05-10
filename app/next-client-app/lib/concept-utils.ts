import { getOmopTable } from "@/api/scanreports";

//function to map concept domain to an omop field
export const mapConceptToOmopField = async (conceptCode, tableId) => {
  // cached values
  let omopTables = null;

  const concept = await validateConceptCode(conceptCode);
  const domain = concept?.domain_id.toLocaleLowerCase();
  const table = await getScanReportTable(tableId);
  const fields = await getOmopField();

  // mapping function which is returned by this function
  return async (fields, domain, table) => {
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
        omopTables = await getOmopTable();
      }
      // find correct field to return
      let mappedTables = mappedFields.map((field) => ({
        table: omopTables.find((t) => t.id == field.table),
        field: field,
      }));
      mappedTables = mappedTables.map((val) => ({
        ...val,
        isAllowed: m_allowed_tables.includes(val.table.table),
      }));
      return mappedTables.find((val) => val.isAllowed == true).field;
    }
    if (!omopTables) {
      omopTables = await getOmopTable();
    }
    // find omop field with specified table and domain
    let mappedTable = omopTables.find((t) => t.table == table);
    const mappedField = fields.find(
      (f) => f.table == mappedTable.id && f.field == domain,
    );
    return mappedField;
  };
};
