"use client";
import { DataTable } from "@/components/data-table";
import { objToQuery } from "@/lib/client-utils";
import { DataTableFilter } from "@/components/data-table/DataTableFilter";
import { getConceptFilters, getScanReportConcepts } from "@/api/concepts";
import { addConceptsToResults } from "@/lib/concept-utils";
import { columns } from "./columns";
import { FilterParameters } from "@/types/filter";
import { useEffect, useState } from "react";

interface ScanReportsValueProps {
  scanReportsResults: ScanReportValue[];
  scanReportsConcepts: ScanReportConcept[];
  conceptsFilter: Concept[];
  permissions: PermissionsResponse;
  scanReportsCount: number;
}

export async function DataTableTest({
  scanReportsResults,
  scanReportsConcepts,
  conceptsFilter,
  permissions,
  scanReportsCount,
}: ScanReportsValueProps) {
  const [loading, setLoading] = useState(false);

  const defaultPageSize = 30;
  const filter = <DataTableFilter filter="value" filterText="value" />;

  const scanReportsResult = addConceptsToResults(
    scanReportsResults,
    scanReportsConcepts,
    conceptsFilter,
    permissions
  );

  // const updateRowConcepts = (rowId: number, concepts: Concept[]) => {
  //   setScanReportsResult((prevState) => {
  //     return prevState.map((item) => {
  //       if (item.id === rowId) {
  //         return {
  //           ...item,
  //           concepts,
  //         };
  //       }
  //       return item;
  //     });
  //   });
  // };
  return (
    <div>
      <DataTable
        columns={columns(loading, setLoading)}
        data={scanReportsResult}
        count={scanReportsCount}
        Filter={filter}
        clickableRow={false}
        defaultPageSize={defaultPageSize}
      />
    </div>
  );
}
