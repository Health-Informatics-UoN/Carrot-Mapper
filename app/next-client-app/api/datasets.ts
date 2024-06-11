"use server";
import { revalidatePath } from "next/cache";
import request from "@/lib/api/request";

const fetchKeys = {
  list: (filter?: string) =>
    filter ? `datasets_data_partners/?${filter}` : "datasets_data_partners/",
  dataset: (id: string) => `datasets/${id}/`,
  project: (filter: string) => `projects/?${filter}/`,
  dataPartners: () => "datapartners/",
  users: () => "usersfilter/?is_active=true",
  projects: () => "projects/",
  updateDataset: (id: number) => `datasets/update/${id}/`,
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

export async function getDataPartners(): Promise<DataPartner[]> {
  try {
    return request<DataPartner[]>(fetchKeys.dataPartners());
  } catch (error) {
    console.warn("Failed to fetch data.");
    return [];
  }
}

export async function getDataUsers(): Promise<Users[]> {
  try {
    return request<Users[]>(fetchKeys.users());
  } catch (error) {
    console.warn("Failed to fetch data.");
    return [];
  }
}

export async function getProjects(): Promise<Projects[]> {
  try {
    return request<Projects[]>(fetchKeys.projects());
  } catch (error) {
    console.warn("Failed to fetch data.");
    return [];
  }
}

export async function getDatasetProject(filter: string): Promise<Projects[]> {
  try {
    return request<Projects[]>(fetchKeys.project(filter));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return [];
  }
}

export async function archiveDataSets(id: number, hidden: boolean) {
  try {
    await request(fetchKeys.archive(id), {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({ hidden: hidden }),
    });
    revalidatePath("/datasets/");
  } catch (error: any) {
    // Only return a response when there is an error
    return { errorMessage: error.message };
  }
}

export async function updateDatasetDetails(
  id: number,
  name: string,
  visibility: string,
  data_partner: number,
  admins: number[],
  editors: number[]
  // projects: number[]
) {
  try {
    await request(fetchKeys.updateDataset(id), {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        visibility: visibility,
        data_partner: data_partner,
        admins: admins,
        editors: editors,
        // projects: projects,
      }),
    });
  } catch (error) {
    console.error(error);
  }
  revalidatePath(`/datasets/${id}/details/`);
}
