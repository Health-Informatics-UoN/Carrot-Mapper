import { columns } from "@/app/scanreports/[id]/mapping_rules/columns";
import { getSummaryRules } from "@/api/mapping-rules";
import { Loading } from "@/components/ui/loading-indicator";
import { DataTable } from "@/components/data-table";
import { FilterParameters } from "@/types/filter";
import { objToQuery } from "@/lib/client-utils";

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
  const defaultPageSize = 30;
  const defaultParams = {
    id: id,
    p: 1,
    page_size: defaultPageSize,
  };
  const combinedParams = { ...defaultParams, ...searchParams };
  const query = objToQuery(combinedParams);
  // TODO: set loading state
  // TODO: modify width and height
  // const [loading, setLoading] = useState(true);
  const summaryRules = await getSummaryRules(query);

  return (
    <DataTable
      columns={columns}
      data={summaryRules.results}
      count={summaryRules.count}
      clickableRow={false}
      defaultPageSize={defaultPageSize}
    />
  );
}
