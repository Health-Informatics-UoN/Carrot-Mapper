"use server";
import { revalidatePath } from "next/cache";
import request from "@/lib/api/request";

const fetchKeys = {
  list: (filter?: string) =>
    filter ? `v2/scanreports/?${filter}` : "v2/scanreports",
  tables: (filter?: string) => `v2/scanreporttables/?${filter}`,
  scanReport: (id: string) => `v2/scanreports/${id}/`,
  update: (id: number) => `scanreports/${id}/`,
  permissions: (id: number) => `scanreports/${id}/permissions/`,
};

export async function getScanReportsTables(
  filter: string | undefined,
): Promise<ScanReportTables> {
  try {
    return await request<ScanReportTables>(fetchKeys.tables(filter));
  } catch (error) {
    console.warn("Failed to fetch data.");
    console.log(error);
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function getScanReports(
  filter: string | undefined,
): Promise<ScanReport> {
  try {
    return await request<ScanReport>(fetchKeys.list(filter));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function getScanReportPermissions(id: number): Promise<{}> {
  try {
    return await request<[]>(fetchKeys.permissions(id));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { permissions: [] };
  }
}

export async function getScanReportName(id: string): Promise<ScanReportResult> {
  try {
    return await request<ScanReportResult>(fetchKeys.scanReport(id));
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
