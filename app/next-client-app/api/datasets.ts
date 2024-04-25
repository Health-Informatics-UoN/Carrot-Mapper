import request from "./request";

const fetchKeys = {
  list: (filterName?: string) =>
    filterName
      ? `datasets_data_partners/?${filterName}`
      : "datasets_data_partners/",
  archive: (id: number) => `datasets/${id}/`,
};

export async function getDataSets(
  filterName: string | undefined
): Promise<DataSet> {
  try {
    return await request<DataSet>(fetchKeys.list(filterName));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}
