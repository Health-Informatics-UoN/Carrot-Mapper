"use server";

import request from "@/lib/api/request";

const fetchKeys = {
  list: (filter?: string) => (filter ? `projects/?${filter}` : "projects/"),
  projects: "projects/",
  projectsDataset: (dataset: string) => `projects/?dataset=${dataset}`,
};

export async function getProjectsList(
  filter: string | undefined
): Promise<PaginatedResponse<Project>> {
  try {
    return await request<Project>(fetchKeys.list(filter));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function getProjectsDataset(dataset: string): Promise<Project[]> {
  try {
    return request<Project[]>(fetchKeys.projectsDataset(dataset));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return [];
  }
}

export async function getProjects(): Promise<Project[]> {
  try {
    return request<Project[]>(fetchKeys.projects);
  } catch (error) {
    console.warn("Failed to fetch data.");
    return [];
  }
}
