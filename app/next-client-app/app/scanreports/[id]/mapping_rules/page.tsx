import { FilterParameters } from "@/types/filter";
import { getMappingRulesList } from "@/api/mapping-rules";
import { objToQuery } from "@/lib/client-utils";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";
import { RulesButton } from "./rules-buttons";

interface ScanReportsMappingRulesProps {
  params: {
    id: string;
  };
  searchParams?: FilterParameters;
}

export default async function ScanReportsMappingRules({
  params: { id },
  searchParams,
}: ScanReportsMappingRulesProps) {
  const defaultPageSize = 30;
  const defaultParams = {
    id: id,
    p: 1,
    page_size: defaultPageSize,
  };
  const combinedParams = { ...defaultParams, ...searchParams };
  const query = objToQuery(combinedParams);
  const mappingRulesList = await getMappingRulesList(query);
  const rulesButton = <RulesButton scanreportId={id} query={query} />;

  return (
    <div>
      <DataTable
        columns={columns}
        data={mappingRulesList.results}
        count={mappingRulesList.count}
        clickableRow={false}
        defaultPageSize={defaultPageSize}
        Filter={rulesButton}
      />
    </div>
  );
}
