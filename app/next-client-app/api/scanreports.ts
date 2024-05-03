"use server";
import { revalidatePath } from "next/cache";
import request from "./request";

const fetchKeys = {
  list: (filter?: string) =>
    filter ? `v2/scanreports/?${filter}` : "v2/scanreports",
  tables: (filter?: string) =>
    `scanreporttables/?${filter}&scan_report__in=&name__in=&name__icontains=&id__in=&id=`,
  archive: (id: number) => `scanreports/${id}/`,
};

export async function getScanReportsTables(
  filter: string | undefined
): Promise<ScanReportTable[]> {
  try {
    console.log(filter, typeof filter);
    return await request<ScanReportTable[]>(fetchKeys.tables(filter));
  } catch (error) {
    console.warn("Failed to fetch data.");
    console.log(error);
    return [];
  }
}

export async function getScanReports(
  filter: string | undefined
): Promise<ScanReport> {
  try {
    return await request<ScanReport>(fetchKeys.list(filter));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function archiveScanReports(id: number, hidden: boolean) {
  await request(fetchKeys.archive(id), {
    method: "PATCH",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({ hidden: hidden }),
  });
  revalidatePath("/scanreports/");
}
