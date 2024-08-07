"use server";
import { revalidatePath } from "next/cache";
import request from "@/lib/api/request";
import { redirect } from "next/navigation";
import { fetchAllPages } from "@/lib/api/utils";

const fetchKeys = {
  list: (filter?: string) =>
    filter ? `v2/scanreports/?${filter}` : "v2/scanreports",
  tables: (filter?: string) => `v2/scanreporttables/?${filter}`,
  fields: (filter?: string) => `v2/scanreportfields/?${filter}`,
  values: (filter?: string) => `v2/scanreportvalues/?${filter}`,
  scanReport: (id: string | number) => `v2/scanreports/${id}/`,
  tableName: (id: string) => `scanreporttables/${id}/`,
  fieldName: (id: string | null) => `scanreportfields/${id}/`,
  update: (id: number) => `scanreports/${id}/`,
  updateTable: (id: number) => `scanreporttables/${id}/`,
  permissions: (id: string) => `scanreports/${id}/permissions/`,
  createScanreport: "v2/scanreports/",
};

export async function getScanReportsTables(
  filter: string | undefined,
): Promise<PaginatedResponse<ScanReportTable>> {
  try {
    return await request<PaginatedResponse<ScanReportTable>>(
      fetchKeys.tables(filter),
    );
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function getScanReports(
  filter: string | undefined,
): Promise<PaginatedResponse<ScanReport>> {
  try {
    return await request<PaginatedResponse<ScanReport>>(fetchKeys.list(filter));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}

/**
 * Get the current users permissions for a Scan Report.
 * @param id The Id of the Scan Report
 * @returns A object with a list of the users permissions.
 */
export async function getScanReportPermissions(
  id: string,
): Promise<PermissionsResponse> {
  try {
    return await request<PermissionsResponse>(fetchKeys.permissions(id));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { permissions: [] };
  }
}

export async function getScanReportFields(
  filter: string | undefined,
): Promise<PaginatedResponse<ScanReportField>> {
  try {
    return await request<PaginatedResponse<ScanReportField>>(
      fetchKeys.fields(filter),
    );
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function getAllScanReportFields(
  filter: string | undefined,
): Promise<ScanReportField[]> {
  try {
    return await fetchAllPages<ScanReportField>(fetchKeys.fields(filter));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return [];
  }
}

export async function getScanReportValues(
  filter: string | undefined,
): Promise<PaginatedResponse<ScanReportValue>> {
  try {
    return await request<PaginatedResponse<ScanReportValue>>(
      fetchKeys.values(filter),
    );
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function getScanReport(id: string): Promise<ScanReport | null> {
  try {
    return await request<ScanReport>(fetchKeys.scanReport(id));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return null;
  }
}

export async function getScanReportTable(id: string): Promise<ScanReportTable> {
  try {
    return await request<ScanReportTable>(fetchKeys.tableName(id));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return {
      id: 0,
      name: "",
      scan_report: 0,
      person_id: "",
      created_at: new Date(),
      updated_at: new Date(),
      date_event: "",
      permissions: [],
    };
  }
}

export async function getScanReportField(id: string): Promise<ScanReportField> {
  try {
    return await request<ScanReportField>(fetchKeys.fieldName(id));
  } catch (error) {
    console.warn("Failed to fetch data. Passed ID could be null");
    return {
      id: 0,
      created_at: new Date(),
      updated_at: new Date(),
      name: "",
      description_column: "",
      type_column: "",
      max_length: 0,
      nrows: 0,
      nrows_checked: 0,
      fraction_empty: "",
      nunique_values: 0,
      fraction_unique: "",
      ignore_column: null,
      is_patient_id: false,
      is_ignore: false,
      classification_system: null,
      pass_from_source: false,
      concept_id: 0,
      permissions: [],
      field_description: null,
      scan_report_table: 0,
    };
  }
}

export async function updateScanReport(
  id: number,
  data: {},
  needRedirect?: boolean,
) {
  try {
    await request(fetchKeys.update(id), {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(data),
    });
    revalidatePath("/scanreports/");
  } catch (error: any) {
    // Only return a response when there is an error
    return { errorMessage: error.message };
  }
  if (needRedirect) {
    redirect(`/scanreports/`);
  }
}

export async function deleteScanReport(id: number) {
  try {
    await request(fetchKeys.scanReport(id), {
      method: "DELETE",
      headers: {
        "Content-type": "application/json",
      },
    });
    revalidatePath("/scanreports/");
  } catch (error: any) {
    return { errorMessage: error.message };
  }
}

export async function updateScanReportTable(
  id: number,
  data: {},
  scanreportID: number,
) {
  try {
    await request(fetchKeys.updateTable(id), {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch (error: any) {
    return { errorMessage: error.message };
  }
  redirect(`/scanreports/${scanreportID}/`);
}

export async function updateScanReportField(fieldId: string, data: {}) {
  try {
    await request(fetchKeys.fieldName(fieldId), {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch (error: any) {
    return { errorMessage: error.message };
  }
}

export async function createScanReport(data: FormData) {
  try {
    await request(fetchKeys.createScanreport, {
      method: "POST",
      body: data,
    });
  } catch (error: any) {
    // Only return a response when there is an error
    return { errorMessage: error.message };
  }
  redirect(`/scanreports/`);
}
