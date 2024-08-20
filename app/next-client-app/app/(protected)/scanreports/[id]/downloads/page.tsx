import { FilterParameters } from "@/types/filter";
import { objToQuery } from "@/lib/client-utils";
import { DataTable } from "@/components/data-table";
import { list } from "@/api/files";
import { columns } from "./columns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface DownloadsProps {
  params: {
    id: string;
  };
  searchParams?: FilterParameters;
}

export default async function Downloads({
  params: { id },
  searchParams,
}: DownloadsProps) {
  const defaultPageSize = 20;
  const defaultParams = {
    p: 1,
    page_size: defaultPageSize,
  };
  const combinedParams = { ...defaultParams, ...searchParams };
  const query = objToQuery(combinedParams);
  const filesList = await list(Number(id), query);

  return (
    <div>
      <Alert className="max-w-sm">
        <AlertDescription className="flex">
          <InfoIcon className="h-4 w-4 mr-2" />
          <AlertTitle>
            Downloads might take a few minutes to be ready.
          </AlertTitle>
        </AlertDescription>
      </Alert>

      {filesList && (
        <DataTable
          columns={columns}
          data={filesList.results}
          count={filesList.count}
          clickableRow={false}
          defaultPageSize={defaultPageSize}
        />
      )}
    </div>
  );
}
