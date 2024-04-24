import request from "./request";

const fetchKeys = {
  list: "datasets_data_partners/?p=1&page_size=20",
};

export async function getDataSets(): Promise<DataSet> {
  try {
    return await request<DataSet>(fetchKeys.list);
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}
