import {
  getScanReportPermissions,
  getJobs,
  getScanReportTables,
} from "@/api/scanreports";
import { objToQuery } from "@/lib/client-utils";
import { FilterParameters } from "@/types/filter";
import ScanReportsTableClient from "@/components/jobs/ScanReportsTableClient";

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
  // Get data about jobs then inject it to the SR table data
  const jobs = await getJobs(id);
  const scanReportsResult = scanReportsTables.results.map((table) => {
    table.permissions = permissions.permissions;
    if (jobs) {
      table.jobs = jobs;
    }

    return table;
  });

  return (
    <div>
      <div>
        {/* <DataTable
          columns={columns}
          data={scanReportsResult}
          count={scanReportsTables.count}
          Filter={filter}
          linkPrefix="tables/"
        /> */}
        <ScanReportsTableClient
          scanReportId={id}
          initialScanReportsResult={scanReportsResult}
        />
      </div>
    </div>
  );
}
