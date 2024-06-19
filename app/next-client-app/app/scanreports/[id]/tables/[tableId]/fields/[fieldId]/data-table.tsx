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

export function DataTableTest({
  scanReportsResults,
  scanReportsConcepts,
  conceptsFilter,
  permissions,
  scanReportsCount,
}: ScanReportsValueProps) {
  // const [loading, setLoading] = useState(false);
  const [concepts, setConcepts] = useState(scanReportsConcepts);

  const deleteConcept = (id: number) => {
    // filter it out.
    const updatedConcepts = concepts.filter((concept) => concept.id !== id);
    setConcepts(updatedConcepts);
  };

  const addConcept = (newConcept: ScanReportConcept) => {
    // merge it.
    const updatedConcepts = [...concepts, newConcept];
    setConcepts(updatedConcepts);
  };

  const defaultPageSize = 30;
  const filter = <DataTableFilter filter="value" filterText="value" />;

  const scanReportsResult = addConceptsToResults(
    scanReportsResults,
    concepts,
    conceptsFilter,
    permissions,
  );

  return (
    <div>
      <DataTable
        columns={columns(addConcept, deleteConcept)}
        data={scanReportsResult}
        count={scanReportsCount}
        Filter={filter}
        clickableRow={false}
        defaultPageSize={defaultPageSize}
      />
    </div>
  );
}
