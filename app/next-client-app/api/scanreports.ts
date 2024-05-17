"use server";
import { revalidatePath } from "next/cache";
import request from "@/lib/api/request";

const fetchKeys = {
  list: (filter?: string) =>
    filter ? `v2/scanreports/?${filter}` : "v2/scanreports",
  tables: (filter?: string) => `v2/scanreporttables/?${filter}`,
  fields: (filter?: string) => `v2/scanreportfields/?${filter}`,
  scanReport: (id: string) => `v2/scanreports/${id}/`,
  tableName: (id: string) => `v2/scanreporttables/${id}/`,
  update: (id: number) => `scanreports/${id}/`,
  tableValues: (id: string) => `scanreporttables/${id}/`,
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
): Promise<PaginatedResponse<ScanReportList>> {
  try {
    return await request<PaginatedResponse<ScanReportList>>(
      fetchKeys.list(filter),
    );
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
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
    };
  }
}

export async function getTableValues(id: string): Promise<ScanReportTable> {
  try {
    return await request<ScanReportTable>(fetchKeys.tableValues(id));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return {
      id: 0,
      name: "",
      scan_report: 0,
      person_id: 0,
      created_at: new Date(),
      updated_at: new Date(),
      date_event: 0,
    };
  }
}

export async function updateScanReport(id: number, field: string, value: any) {
  await request(fetchKeys.update(id), {
    method: "PATCH",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({ [field]: value }),
  });
  revalidatePath("/scanreports/");
}
