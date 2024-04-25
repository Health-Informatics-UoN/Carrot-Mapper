"use server";
import { revalidatePath } from "next/cache";
import request from "./request";

const fetchKeys = {
  list: (filterName?: string) =>
    filterName ? `v2/scanreports/?${filterName}` : "v2/scanreports",
  archive: (id: number) => `scanreports/${id}/`,
};

export async function getScanReports(
  filterName: string | undefined,
): Promise<ScanReport> {
  try {
    return await request<ScanReport>(fetchKeys.list(filterName));
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
