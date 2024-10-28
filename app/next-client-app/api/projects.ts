"use server";

import request from "@/lib/api/request";
import { fetchAllPages } from "@/lib/api/utils";

const fetchKeys = {
  list: (filter?: string) => (filter ? `projects/?${filter}` : "projects/"),
  projectsDataset: (dataset: string) => `projects/?dataset=${dataset}`,
  project: (id: string) => `projects/${id}/`,
};

export async function getProjectsList(
  filter?: string | undefined
): Promise<PaginatedResponse<Project>> {
  try {
    return await request<Project>(fetchKeys.list(filter));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function getAllProjects(): Promise<Project[]> {
  try {
    // Add a fake filter to the query to ensure the fetchAllPages call works normally
    return await fetchAllPages<Project>(fetchKeys.list(" "));
  } catch (error) {
    console.warn("Failed to fetch all projects data");
    return [];
  }
}

export async function getProjectsDataset(
  dataset: string
): Promise<PaginatedResponse<Project>> {
  try {
    return request<Project>(fetchKeys.projectsDataset(dataset));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function getProject(id: string): Promise<Project | null> {
  try {
    return await request<Project | null>(fetchKeys.project(id));
  } catch (error) {
    return null;
  }
}
