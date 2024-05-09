"use server";
import { revalidatePath } from "next/cache";
import request from "@/lib/api/request";

const fetchKeys = {
  list: (filter?: string) =>
    filter ? `v2/scanreports/?${filter}` : "v2/scanreports",
  tables: (filter?: string) => `v2/scanreporttables/?${filter}`,
  fields: (filter?: string) => `v2/scanreportfields/?${filter}`,
  scanReport: (id: string) => `v2/scanreports/${id}/`,
  tableName: (id: string) => `v2/scanreporttables/${id}/`,
  update: (id: number) => `scanreports/${id}/`,
  validateConcept: (conceptCode: number) => `omop/concepts/${conceptCode}/`,
};

export async function getScanReportsTables(
  filter: string | undefined
): Promise<ScanReport> {
  try {
    return await request<ScanReport>(fetchKeys.tables(filter));
  } catch (error) {
    console.warn("Failed to fetch data.");
    console.log(error);
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function getScanReports(
  filter: string | undefined
): Promise<ScanReport> {
  try {
    return await request<ScanReport>(fetchKeys.list(filter));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function getScanReportFields(
  filter: string | undefined
): Promise<ScanReport> {
  try {
    return await request<ScanReport>(fetchKeys.fields(filter));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function getScanReport(id: string): Promise<ScanReportList> {
  try {
    return await request<ScanReportList>(fetchKeys.scanReport(id));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return {
      id: 0,
      dataset: "",
      parent_dataset: "",
      data_partner: "",
      status: "",
      created_at: new Date(),
      hidden: true,
    };
  }
}

export async function getScanReportTable(id: string): Promise<ScanReportTable> {
  try {
    return await request<ScanReportTable>(fetchKeys.tableName(id));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return {
      id: 0,
      name: "",
      scan_report: 0,
      person_id: "",
      created_at: new Date(),
      updated_at: new Date(),
      date_event: "",
    };
  }
}

export async function updateScanReport(id: number, field: string, value: any) {
  await request(fetchKeys.update(id), {
    method: "PATCH",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({ [field]: value }),
  });
  revalidatePath("/scanreports/");
}

export async function validateConceptCode(
  conceptCode: number
): Promise<Concept> {
  try {
    return await request<Concept>(fetchKeys.validateConcept(conceptCode));
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
