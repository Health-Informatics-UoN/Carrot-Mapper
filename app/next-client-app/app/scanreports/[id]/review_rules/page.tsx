import { columns } from "@/app/scanreports/[id]/mapping_rules/columns";
import { getSummaryRules } from "@/api/mapping-rules";
import { DataTable } from "@/components/data-table";
import { FilterParameters } from "@/types/filter";
import { objToQuery } from "@/lib/client-utils";
import { RulesButton } from "../mapping_rules/rules-buttons";

interface SummaryProps {
  params: {
    id: string;
  };
  searchParams?: FilterParameters;
}

export default async function SummaryViewDialog({
  params: { id },
  searchParams,
}: SummaryProps) {
  const defaultPageSize = 20;
  const defaultParams = {
    id: id,
    p: 1,
    page_size: defaultPageSize,
  };
  const combinedParams = { ...defaultParams, ...searchParams };
  const query = objToQuery(combinedParams);

  const summaryRules = await getSummaryRules(query);
  const rulesButton = <RulesButton scanreportId={id} query={query} />;
  // TODO: Make the loading state, if possible
  // TODO: When users use pagination here, the dialog modal will appear and they will have to do pagiantion there instead!?
  return (
    <DataTable
      columns={columns}
      data={summaryRules.results}
      count={summaryRules.count}
      clickableRow={false}
      defaultPageSize={defaultPageSize}
      Filter={rulesButton}
    />
  );
}
