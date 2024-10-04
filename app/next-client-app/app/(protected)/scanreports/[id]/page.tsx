import { columns } from "./columns";
import {
  getScanReportPermissions,
  getScanReportTables,
} from "@/api/scanreports";
import { DataTable } from "@/components/data-table";
import { objToQuery } from "@/lib/client-utils";
import { FilterParameters } from "@/types/filter";
import { DataTableFilter } from "@/components/data-table/DataTableFilter";
import { DataTableUpdate } from "../../../../components/concepts/DataTable";
import { columns2 } from "./columns2";

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

  const scanReportsTables = await getScanReportTables(id, query);
  const permissions = await getScanReportPermissions(id);
  const scanReportsResult = scanReportsTables.results.map((table) => {
    table.permissions = permissions.permissions;
    return table;
  });
  const filter = <DataTableFilter filter="name" />;

  return (
    <div>
      <div>
        {/* <DataTableUpdate
          count={scanReportsTables.count}
          scanReportsData={scanReportsTables.results}
          columns={columns}
          filterCol="name"
          filterText="name "
          linkPrefix="tables/"
          permissions={permissions}
        /> */}
        <DataTable
          columns={columns2}
          data={scanReportsResult}
          count={scanReportsTables.count}
          Filter={filter}
          linkPrefix="tables/"
        />
      </div>
    </div>
  );
}
