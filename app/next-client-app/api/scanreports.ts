"use server";
import { revalidatePath } from "next/cache";
import request from "@/lib/api/request";

const fetchKeys = {
  list: (filter?: string) =>
    filter ? `v2/scanreports/?${filter}` : "v2/scanreports",
  update: (id: number) => `scanreports/${id}/`,
};

export async function getScanReports(
  filter: string | undefined,
): Promise<ScanReport> {
  try {
    return await request<ScanReport>(
      fetchKeys.list(
        filter?.includes("hidden") ? filter : `${filter}&hidden=false`,
      ),
    );
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
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
