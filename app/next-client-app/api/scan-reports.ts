import { scanReports } from "./data";
import request from "./request";

const fetchKeys = {
  list: "scanreports",
};

export async function getScanReports(): Promise<ScanReport[]> {
  try {
    return await request<ScanReport[]>(fetchKeys.list);
  } catch (error) {
    console.warn("Failed to fetch data.");
    return [];
  }
}
