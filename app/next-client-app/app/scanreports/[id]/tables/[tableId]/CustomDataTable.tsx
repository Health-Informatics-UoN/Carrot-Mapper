"use client";

import { DataTable } from "@/components/data-table";
import { DataTableFilter } from "@/components/data-table/DataTableFilter";
import { addConceptsToResults } from "@/lib/concept-utils";
import { columns } from "./columns";
import { useEffect, useState } from "react";

interface ScanReportsValueProps {
  scanReportsResults: ScanReportField[];
  scanReportsConcepts: ScanReportConcept[];
  conceptsFilter: Concept[];
  permissions: PermissionsResponse;
  scanReportsCount: number;
  defaultPageSize: 10 | 20 | 30 | 40 | 50;
}

export function CustomDataTable({
  scanReportsResults,
  scanReportsConcepts,
  conceptsFilter,
  permissions,
  scanReportsCount,
  defaultPageSize,
}: ScanReportsValueProps) {
  const filter = <DataTableFilter filter="value" filterText="value" />;

  // Set the needed Concepts and Concepts filter in state, so we can mutate them individually.
  const [neededConcepts, setNeededConcepts] = useState(scanReportsConcepts);
  const [neededConceptFilter, setNeededConceptFilter] =
    useState(conceptsFilter);

  // Necessary for pagination
  useEffect(() => {
    setNeededConcepts(scanReportsConcepts);
  }, [scanReportsConcepts]);

  useEffect(() => {
    setNeededConceptFilter(conceptsFilter);
  }, [conceptsFilter]);

  const deleteConcept = (id: number) => {
    // filter it out.
    const updatedConcepts = neededConcepts.filter(
      (concept) => concept.id !== id
    );
    setNeededConcepts(updatedConcepts);
  };

  const addConcept = (newConcept: ScanReportConcept, newConFilter: Concept) => {
    // merge it.

    const updatedConcepts = [...neededConcepts, newConcept];
    setNeededConcepts(updatedConcepts);

    const updatedConceptFilters = [...neededConceptFilter, newConFilter];
    setNeededConceptFilter(updatedConceptFilters);
  };

  const scanReportsResult = addConceptsToResults(
    scanReportsResults,
    neededConcepts,
    neededConceptFilter,
    permissions
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
