import { columns } from "@/app/scanreports/[id]/mapping_rules/columns";
import { getSummaryRules } from "@/api/mapping-rules";
import { Loading } from "@/components/ui/loading-indicator";
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
  const defaultPageSize = 2; // To test the pagination. Need to be changed to 10|20|30 here, then remove 2 in other places
  const defaultParams = {
    id: id,
    p: 1,
    page_size: defaultPageSize,
  };
  const combinedParams = { ...defaultParams, ...searchParams };
  const query = objToQuery(combinedParams);
  // TODO: set loading state
  // const [loading, setLoading] = useState(true);
  const summaryRules = await getSummaryRules(query);

  return (
    <Modal>
      <DataTable
        columns={columns}
        data={summaryRules.results}
        count={summaryRules.count}
        clickableRow={false}
        defaultPageSize={defaultPageSize}
      />
    </Modal>
    // <Dialog open={dialogOpened} onOpenChange={setDialogOpened}>
    //   <DialogContent
    //     className={`w-full max-w-screen-2xl overflow-auto max-h-screen-2xl`}
    //   >
    //     <DialogHeader>
    //       <DialogTitle>Summary of Mapping Rules list 2123123</DialogTitle>
    //     </DialogHeader>
    //     <DialogDescription className="justify-center items-center text-center">
    //       {" "}
    //       The table below shows the list of mapping rules which have the Term
    //       Map and have the Desination Field name without "_source_concept_id"
    //     </DialogDescription>
    //     {loading ? (
    //       <div className="flex justify-center">
    //         <Loading text="Loading ..." />
    //       </div>
    //     ) : (
    //       <div>
    //         <DataTable
    //           columns={columns}
    //           data={summaryData || []}
    //           count={count || 0}
    //           clickableRow={false}
    //           defaultPageSize={20}
    //         />
    //       </div>
    //     )}
    //   </DialogContent>
    // </Dialog>
  );
}
