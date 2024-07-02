"use server";
import { revalidatePath } from "next/cache";
import request from "@/lib/api/request";
import { redirect } from "next/navigation";

const fetchKeys = {
  list: (filter?: string) =>
    filter ? `datasets_data_partners/?${filter}` : "datasets_data_partners/",
  dataset: (id: string) => `datasets/${id}/`,
  datasetList: (dataPartnerId: string) =>
    `datasets/?data_partner=${dataPartnerId}&hidden=false`,
  dataPartners: () => "datapartners/",
  users: () => "usersfilter/?is_active=true",
  projects: (dataset?: string) =>
    dataset ? `projects/?dataset=${dataset}` : "projects/",
  updateDataset: (id: number) => `datasets/update/${id}/`,
  permissions: (id: string) => `dataset/${id}/permissions/`,
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
      projects: [],
    };
  }
}

export async function getDatasetList(filter: string): Promise<DataSetSRList[]> {
  try {
    return await request<DataSetSRList>(fetchKeys.datasetList(filter));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return [];
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

export async function getDataUsers(): Promise<User[]> {
  try {
    return request<User[]>(fetchKeys.users());
  } catch (error) {
    console.warn("Failed to fetch data.");
    return [];
  }
}

export async function getProjects(dataset?: string): Promise<Project[]> {
  try {
    return request<Project[]>(fetchKeys.projects(dataset));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return [];
  }
}

export async function archiveDataSets(id: number, hidden: boolean) {
  try {
    await request(fetchKeys.updateDataset(id), {
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

export async function updateDatasetDetails(id: number, data: {}) {
  try {
    await request(fetchKeys.updateDataset(id), {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch (error: any) {
    return { errorMessage: error.message };
  }
  redirect(`/datasets/${id}/`);
}

export async function getDatasetPermissions(
  id: string
): Promise<PermissionsResponse> {
  try {
    return await request<PermissionsResponse>(fetchKeys.permissions(id));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { permissions: [] };
  }
}
