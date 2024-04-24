import request from "./request";

const fetchKeys = {
  list: "datasets",
};

export async function getDataSets(): Promise<DataSet[]> {
  try {
    return await request<DataSet[]>(fetchKeys.list);
  } catch (error) {
    console.warn("Failed to fetch data.");
    return [];
  }
}



