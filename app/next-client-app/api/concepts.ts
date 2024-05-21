"use server";
import request from "@/lib/api/request";
import { revalidatePath } from "next/cache";

const fetchKeys = {
  conceptFilter: (filter: string) =>
    `omop/conceptsfilter/?concept_id__in=${filter}`,
  addConcept: "v2/scanreportconcept/",
  deleteConcept: (conceptId: number) => `scanreportconcepts/${conceptId}`,
  scanreportConcepts: (filter?: string) =>
    `scanreportconceptsfilter/?${filter}`,
};

export async function getScanReportConcepts(
  filter: string
): Promise<ScanReportConcept[]> {
  try {
    return await request<ScanReportConcept[]>(
      fetchKeys.scanreportConcepts(filter)
    );
  } catch (error) {
    console.warn("Failed to fetch data.");
    return [];
  }
}

export async function getConceptFilters(filter: string): Promise<Concept[]> {
  try {
    return await request<Concept[]>(fetchKeys.conceptFilter(filter));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return [];
  }
}

export async function addConcept(data: {}): Promise<ScanReportConcept> {
  const response = await request<ScanReportConcept>(fetchKeys.addConcept, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(data),
  });
  revalidatePath("");
  return response;
}

export async function deleteConcept(conceptId: number) {
  await request(fetchKeys.deleteConcept(conceptId), {
    method: "DELETE",
    headers: {
      "Content-type": "application/json",
    },
  });
  revalidatePath("");
}
