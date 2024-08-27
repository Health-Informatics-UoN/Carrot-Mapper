"use server";
import request from "@/lib/api/request";

const fetchKeys = {
  mappingruleslist: (id: string, filter?: string) =>
    `v2/scanreports/${id}/rules/?${filter}`,
  getMapDiagram: (id: string, filter?: string) =>
    `scanreports/${id}/mapping_rules/?${filter}`,
  summaryRules: (id: string, filter?: string) =>
    `v2/scanreports/${id}/rules/summary/?${filter}`,
};

export async function getMappingRulesList(
  id: string,
  filter: string | undefined,
): Promise<PaginatedResponse<MappingRule>> {
  try {
    return await request<PaginatedResponse<MappingRule>>(
      fetchKeys.mappingruleslist(id, filter),
    );
  } catch (error) {
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function getMappingRules(
  id: string,
  filter: string,
  type: "svg" | "json" | "csv",
) {
  let body;
  switch (type) {
    case "svg":
      body = { get_svg: true };
      break;
    case "json":
      body = { download_rules: true };
      break;
    case "csv":
      body = { download_rules_as_csv: true };
      break;
    default:
      body = {};
      break;
  }
  try {
    const response = await request(fetchKeys.getMapDiagram(id, filter), {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return response;
  } catch (error) {
    return null;
  }
}

export async function getSummaryRules(
  id: string,
  filter: string,
): Promise<PaginatedResponse<MappingRule>> {
  try {
    return await request<PaginatedResponse<MappingRule>>(
      fetchKeys.summaryRules(id, filter),
    );
  } catch (error) {
    return { count: 0, next: null, previous: null, results: [] };
  }
}
