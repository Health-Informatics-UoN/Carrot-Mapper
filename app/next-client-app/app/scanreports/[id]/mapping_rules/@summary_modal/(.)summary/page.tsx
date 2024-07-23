import { columns } from "@/app/scanreports/[id]/mapping_rules/columns";
import { getSummaryRules } from "@/api/mapping-rules";
import { DataTable } from "@/components/data-table";
import { Modal } from "@/components/Modal";
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
  const defaultPageSize = 20;
  const defaultParams = {
    id: id,
    p: 1,
    page_size: defaultPageSize,
  };
  const combinedParams = { ...defaultParams, ...searchParams };
  const query = objToQuery(combinedParams);
  // TODO: Test stability of the page when return from/close the modal.
  // TODO: Make the loading state, if possible
  const summaryRules = await getSummaryRules(query);

  return (
    <Modal>
      <div>
        {summaryRules && (
          <DataTable
            columns={columns}
            data={summaryRules.results}
            count={summaryRules.count}
            clickableRow={false}
            defaultPageSize={defaultPageSize}
          />
        )}
      </div>
    </Modal>
  );
}
