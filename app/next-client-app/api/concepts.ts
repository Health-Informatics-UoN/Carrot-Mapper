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

export async function addConcept(data: {}) {
  try {
    await request(fetchKeys.addConcept, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(data),
    });
    // Re-validate to prevent the newly added concepts can't be seen in the "next" pages (not page 1) that not be refreshed (or reloaded) before
    // revalidatePath("");
  } catch (error: any) {
    // Only return a response when there is an error
    return { errorMessage: error.message };
  }
}

export async function deleteConcept(conceptId: number) {
  await request(fetchKeys.deleteConcept(conceptId), {
    method: "DELETE",
    headers: {
      "Content-type": "application/json",
    },
  });
}
