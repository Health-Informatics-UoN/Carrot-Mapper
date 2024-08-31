import { columns } from "./columns";
import {
  getScanReportPermissions,
  getScanReportTables,
} from "@/api/scanreports";
import { DataTable } from "@/components/data-table";
import { objToQuery } from "@/lib/client-utils";
import { FilterParameters } from "@/types/filter";
import { DataTableFilter } from "@/components/data-table/DataTableFilter";

interface ScanReportsTableProps {
  params: {
    id: string;
  };
  searchParams?: FilterParameters;
}

export default async function ScanReportsTable({
  params: { id },
  searchParams,
}: ScanReportsTableProps) {
  const defaultParams = {};

  const combinedParams = { ...defaultParams, ...searchParams };
  const query = objToQuery(combinedParams);
  const filter = <DataTableFilter filter="name" />;

  const scanReportsTables = await getScanReportTables(id, query);
  const permissions = await getScanReportPermissions(id);
  const scanReportsResult = scanReportsTables.results.map((table) => {
    table.permissions = permissions.permissions;
    return table;
  });

  return (
    <div>
      <div>
        <DataTable
          columns={columns}
          data={scanReportsResult}
          count={scanReportsTables.count}
          Filter={filter}
          linkPrefix="tables/"
        />
      </div>
    </div>
  );
}
