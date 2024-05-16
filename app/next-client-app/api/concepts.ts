"use server";
import request from "@/lib/api/request";
import { revalidatePath } from "next/cache";

const fetchKeys = {
  concept: (conceptCode: number) => `omop/concepts/${conceptCode}/`,
  conceptFilter: (filter: string) =>
    `omop/conceptsfilter/?concept_id__in=${filter}`,
  addConcept: "scanreportconcepts/",
  deleteConcept: (conceptId: number) => `scanreportconcepts/${conceptId}`,
  scanreportConcept: (id: number) =>
    `/scanreportconceptsfilter/?object_id=${id}`,
  typeName: (filter?: string) => `contenttypeid?${filter}`,
  mappingrule: "mappingrules/",
};

export async function getConcept(conceptCode: number): Promise<Concept> {
  try {
    return await request<Concept>(fetchKeys.concept(conceptCode));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return {
      concept_id: 0,
      concept_name: "",
      domain_id: "",
      vocabulary_id: "",
      concept_class_id: "",
      standard_concept: null,
      concept_code: "",
      valid_start_date: new Date(),
      valid_end_date: new Date(),
      invalid_reason: "",
    };
  }
}

export async function getScanReportConcept(
  id: number,
): Promise<ScanReportConcept[]> {
  try {
    return await request<ScanReportConcept[]>(fetchKeys.scanreportConcept(id));
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

export async function getContentTypeId(
  filter: string | undefined,
): Promise<{ content_type_id: number }> {
  try {
    return await request<{ content_type_id: number }>(
      fetchKeys.typeName(filter),
    );
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { content_type_id: 0 };
  }
}

export async function addConcept(data: {}): Promise<ScanReportConcept> {
  try {
    const response = await request<ScanReportConcept>(fetchKeys.addConcept, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(data),
    });
    revalidatePath("");
    return response;
  } catch (error) {
    console.warn("Failed to fetch data.");
    return {
      id: 0,
      created_at: new Date(),
      updated_at: new Date(),
      nlp_entity: null,
      nlp_entity_type: null,
      nlp_confidence: null,
      nlp_vocabulary: null,
      nlp_concept_code: null,
      nlp_processed_string: null,
      object_id: 0,
      creation_type: "",
      concept: 0,
      content_type: 0,
    };
  }
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

export async function AddMappingRule(data: {}): Promise<AddMappingRuleResponse> {
  try {
    return await request<AddMappingRuleResponse>(fetchKeys.mappingrule, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.warn("Failed to fetch data.");
    return {
      id: 0,
      created_at: new Date(),
      updated_at: new Date(),
      approved: false,
      scan_report: 0,
      omop_field: 0,
      source_table: null,
      source_field: 0,
      concept: 0,
    };
  }
}
