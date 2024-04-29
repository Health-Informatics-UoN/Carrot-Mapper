"use server";
import { revalidatePath } from "next/cache";
import request from "./request";

const fetchKeys = {
  list: (filterName?: string) =>
    filterName
      ? `datasets_data_partners/?${filterName}`
      : "datasets_data_partners/",
  archive: (id: number) => `datasets/update/${id}/`,
};

export async function getDataSets(
  filterName: string | undefined
): Promise<DataSetPage> {
  try {
    return await request<DataSetPage>(fetchKeys.list(filterName));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function archiveDataSets(id: number, hidden: boolean) {
  await request(fetchKeys.archive(id), {
    method: "PATCH",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({ hidden: hidden }),
  });
  revalidatePath("/datasets/");
}
