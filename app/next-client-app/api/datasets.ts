"use server";
import { revalidatePath } from "next/cache";
import request from "@/lib/api/request";

const fetchKeys = {
  list: (filter?: string) =>
    filter ? `datasets_data_partners/?${filter}` : "datasets_data_partners/",
  dataset: (id: string) => `datasets/${id}/`,
  archive: (id: number) => `datasets/update/${id}/`,
};

export async function getDataSets(
  filter: string | undefined
): Promise<PaginatedResponse<DataSet>> {
  try {
    return await request<DataSet>(fetchKeys.list(filter));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function getDataSet(id: string): Promise<DataSetSRList> {
  try {
    return await request<DataSetSRList>(fetchKeys.dataset(id));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return {
      id: 0,
      created_at: new Date(),
      updated_at: new Date(),
      name: "",
      visibility: "",
      hidden: null,
      data_partner: 0,
      viewers: [],
      admins: [],
      editors: [],
    };
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
