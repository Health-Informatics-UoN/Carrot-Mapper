"use server";
import request from "@/lib/api/request";

const fetchKeys = {
  mappingruleslist: (filter?: string) => `mappingruleslist/?${filter}`,
  getMapDiagram: (id: string, filter?: string) =>
    `scanreports/${id}/mapping_rules/?${filter}`,
};

export async function getMappingRulesList(
  filter: string | undefined,
): Promise<PaginatedResponse<MappingRule>> {
  try {
    return await request<PaginatedResponse<MappingRule>>(
      fetchKeys.mappingruleslist(filter),
    );
  } catch (error) {
    console.warn("Failed to fetch data.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function getMapDiagram(
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
    console.warn("Failed to fetch data.");
    return null;
  }
}
