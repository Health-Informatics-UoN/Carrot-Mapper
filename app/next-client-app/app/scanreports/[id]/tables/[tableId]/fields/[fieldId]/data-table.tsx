"use client";

import { DataTable } from "@/components/data-table";
import { DataTableFilter } from "@/components/data-table/DataTableFilter";
import { addConceptsToResults } from "@/lib/concept-utils";
import { columns } from "./columns";
import { useEffect, useState } from "react";

interface ScanReportsValueProps {
  scanReportsResults: ScanReportValue[];
  scanReportsConcepts: ScanReportConcept[];
  conceptsFilter: Concept[];
  permissions: PermissionsResponse;
  scanReportsCount: number;
}
// TODO: rename this
export function DataTableTest({
  scanReportsResults,
  scanReportsConcepts,
  conceptsFilter,
  permissions,
  scanReportsCount,
}: ScanReportsValueProps) {
  // Set the Concepts in state, so we can mutate them individually.
  // TODO: rename these
  const [concepts, setConcepts] = useState(scanReportsConcepts);
  const [conceptFilter, setConceptFilter] = useState(conceptsFilter);

  // necessary for pagination
  useEffect(() => {
    setConcepts(scanReportsConcepts);
  }, [scanReportsConcepts]);

  useEffect(() => {
    setConceptFilter(conceptsFilter);
  }, [conceptsFilter]);

  const deleteConcept = (id: number) => {
    // filter it out.
    const updatedConcepts = concepts.filter((concept) => concept.id !== id);
    setConcepts(updatedConcepts);
  };

  const addConcept = (newConcept: ScanReportConcept, newC: Concept) => {
    // merge it.

    const updatedConcepts = [...concepts, newConcept];
    setConcepts(updatedConcepts);

    const updatedConcepts2 = [...conceptFilter, newC];
    setConceptFilter(updatedConcepts2);
  };

  // TODO: pass from the page props.
  const defaultPageSize = 30;
  const filter = <DataTableFilter filter="value" filterText="value" />;

  const scanReportsResult = addConceptsToResults(
    scanReportsResults,
    concepts,
    conceptsFilter,
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
