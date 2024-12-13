"use client";

import { useState } from "react";

import { DataTable } from "@/components/data-table";
import { RefreshJobsButton } from "./RefreshButton";
import { columns } from "@/app/(protected)/scanreports/[id]/columns";
import { DataTableFilter } from "../data-table/DataTableFilter";

export default function ScanReportsTableClient({
  initialScanReportsResult,
  scanReportId,
}: {
  initialScanReportsResult: ScanReportTable[];
  scanReportId: string;
}) {
  const filter = <DataTableFilter filter="name" />;
  const [scanReportsResult, setScanReportsResult] = useState(
    initialScanReportsResult
  );

  const handleJobsRefresh = (updatedJobs: Job[]) => {
    // Update the jobs for each table row
    const updatedScanReportsResult = scanReportsResult.map((table) => ({
      ...table,
      jobs: updatedJobs,
    }));

    setScanReportsResult(updatedScanReportsResult);
  };

  return (
    <div>
      <DataTable
        columns={columns}
        data={scanReportsResult}
        count={scanReportsResult.length}
        Filter={filter}
        RefreshJobsButton={
          <RefreshJobsButton
            scanReportId={scanReportId}
            onJobsRefresh={handleJobsRefresh}
          />
        }
        linkPrefix="tables/"
      />
    </div>
  );
}
