import request from "./request";

const fetchKeys = {
  list: (filterName?: string) =>
    filterName ? `scanreports2/?${filterName}` : "scanreports2",
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
