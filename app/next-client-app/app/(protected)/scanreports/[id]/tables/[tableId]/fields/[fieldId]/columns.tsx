"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { ConceptTags } from "@/components/concepts/concept-tags";
import AddConcept from "@/components/concepts/add-concept";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const columns = (
  addSR: (concept: ScanReportConcept, c: Concept) => void,
  deleteSR: (id: number) => void,
  tableId: string,
): ColumnDef<ScanReportValue>[] => [
  {
    id: "Value",
    accessorKey: "value",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Value" sortName="value" />
    ),
    enableHiding: true,
    enableSorting: false,
  },
  {
    id: "Value Description",
    accessorKey: "value_description",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Value Description"
        sortName="value_description"
      />
    ),
    enableHiding: true,
    enableSorting: false,
  },
  {
    id: "Frequency",
    accessorKey: "frequency",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Frequency"
        sortName="frequency"
      />
    ),
    enableHiding: true,
    enableSorting: false,
  },
  {
    id: "Concepts",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Concepts" />
    ),
    enableHiding: true,
    enableSorting: false,
    cell: ({ row }) => {
      const { concepts } = row.original;
      return (
        // Just in case the concepts tags need more time to load some data
        // --> showing skeleton having same width with the concept tag area
        <Suspense fallback={<Skeleton className="h-5 w-[250px]" />}>
          <ConceptTags concepts={concepts ?? []} deleteSR={deleteSR} />
        </Suspense>
      );
    },
  },
  {
    id: "Add Concept",
    header: "",
    cell: ({ row }) => {
      const { id, permissions } = row.original;
      const canEdit =
        permissions.includes("CanEdit") || permissions.includes("CanAdmin");
      return (
        <AddConcept
          rowId={id}
          tableId={tableId}
          contentType="scanreportvalue"
          disabled={canEdit ? false : true}
          addSR={addSR}
        />
      );
    },
  },
];
