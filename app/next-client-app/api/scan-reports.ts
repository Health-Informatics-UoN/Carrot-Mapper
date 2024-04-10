import request from "./request";

const fetchKeys = {
  list: "scanreports2",
};

export async function getScanReports(): Promise<ScanReport> {
  try {
    return await request<ScanReport>(fetchKeys.list);
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}
