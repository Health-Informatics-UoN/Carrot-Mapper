"use server";
import request from "@/lib/api/request";

const fetchKeys = {
  mappingruleslist: (filter?: string) => `mappingruleslist/?${filter}`,
  getMapDiagram: (id: string, filter?: string) =>
    `scanreports/${id}/mapping_rules/?${filter}`,
  analyseRules: (id: string) => `analyse/${id}/`,
  summaryRules: (id?: string) => `mappingruleslistsummary/?id=${id}`,
};

export async function getMappingRulesList(
  filter: string | undefined
): Promise<PaginatedResponse<MappingRule>> {
  try {
    return await request<PaginatedResponse<MappingRule>>(
      fetchKeys.mappingruleslist(filter)
    );
  } catch (error) {
    console.warn("Failed to fetch mapping rules.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function getMapDiagram(
  id: string,
  filter: string,
  type: "svg" | "json" | "csv"
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

export async function getAnalyseRules(id: string): Promise<AnalyseRule> {
  try {
    return await request<AnalyseRule>(fetchKeys.analyseRules(id));
  } catch (error) {
    console.warn("Failed to fetch analyse rules data.");
    return { data: [] };
  }
}

export async function getSummaryRules(
  id: string
): Promise<PaginatedResponse<MappingRule>> {
  try {
    return await request<PaginatedResponse<MappingRule>>(
      fetchKeys.summaryRules(id)
    );
  } catch (error) {
    console.warn("Failed to fetch analyse rules data.");
    return { count: 0, next: null, previous: null, results: [] };
  }
}
