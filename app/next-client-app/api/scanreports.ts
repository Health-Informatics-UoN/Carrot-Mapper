"use server";
import { revalidatePath } from "next/cache";
import request from "@/lib/api/request";
import { redirect } from "next/navigation";

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
  createScanreport: "scanreports/create/",
};

export async function getScanReportsTables(
  filter: string | undefined
): Promise<PaginatedResponse<ScanReportTable>> {
  try {
    return await request<PaginatedResponse<ScanReportTable>>(
      fetchKeys.tables(filter)
    );
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function getScanReports(
  filter: string | undefined
): Promise<PaginatedResponse<ScanReportList>> {
  try {
    return await request<PaginatedResponse<ScanReportList>>(
      fetchKeys.list(filter)
    );
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
  id: string
): Promise<PermissionsResponse> {
  try {
    return await request<PermissionsResponse>(fetchKeys.permissions(id));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { permissions: [] };
  }
}

export async function getScanReportFields(
  filter: string | undefined
): Promise<PaginatedResponse<ScanReportField>> {
  try {
    return await request<PaginatedResponse<ScanReportField>>(
      fetchKeys.fields(filter)
    );
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function getScanReportValues(
  filter: string | undefined
): Promise<PaginatedResponse<ScanReportValue>> {
  try {
    return await request<PaginatedResponse<ScanReportValue>>(
      fetchKeys.values(filter)
    );
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function getScanReport(id: string): Promise<ScanReportList> {
  try {
    return await request<ScanReportList>(fetchKeys.scanReport(id));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return {
      id: 0,
      dataset: "",
      parent_dataset: "",
      data_partner: "",
      status: "",
      created_at: new Date(),
      hidden: true,
    };
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

export async function getScanReportField(
  id: string | null
): Promise<ScanReportField | null> {
  if (id === null) {
    return null;
  }

  try {
    return await request<ScanReportField>(fetchKeys.fieldName(id));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return null;
  }
}

export async function updateScanReport(id: number, field: string, value: any) {
  try {
    await request(fetchKeys.update(id), {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({ [field]: value }),
    });
    revalidatePath("/scanreports/");
  } catch (error: any) {
    // Only return a response when there is an error
    return { errorMessage: error.message };
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
  field_1: string,
  value_1: number | null,
  field_2: string,
  value_2: number | null,
  scanreportID: number
) {
  try {
    await request(fetchKeys.updateTable(id), {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({ [field_1]: value_1, [field_2]: value_2 }),
    });
  } catch (error) {
    console.error(error);
  }
  redirect(`/scanreports/${scanreportID}/`);
}

export async function createScanReport(data: FormData) {
  try {
    await request(fetchKeys.createScanreport, {
      method: "POST",
      body: data,
    });
    redirect("/scanreports/");
  } catch (error: any) {
    // Only return a response when there is an error
    return { errorMessage: error.message };
  }
}
