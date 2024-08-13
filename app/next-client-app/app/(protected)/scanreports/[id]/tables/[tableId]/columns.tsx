"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { ConceptTags } from "@/components/concepts/concept-tags";
import AddConcept from "@/components/concepts/add-concept";
import { EditButton } from "@/components/scanreports/EditButton";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname } from "next/navigation";

export const columns = (
  addSR: (concept: ScanReportConcept, c: Concept) => void,
  deleteSR: (id: number) => void
): ColumnDef<ScanReportField>[] => [
  {
    id: "Name",
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Field" sortName="name" />
    ),
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: "description",
    accessorKey: "description_column",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Description"
        sortName="description_column"
      />
    ),
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: "Data Type",
    accessorKey: "type_column",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Data Type"
        sortName="type_column"
      />
    ),
    enableHiding: true,
    enableSorting: true,
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
      const { scan_report_table, id, permissions } = row.original;
      const canEdit =
        permissions.includes("CanEdit") || permissions.includes("CanAdmin");
      return (
        <AddConcept
          rowId={id}
          parentId={scan_report_table.toString()}
          location="SR-Fields"
          disabled={canEdit ? false : true}
          addSR={addSR}
        />
      );
    },
  },
  {
    id: "edit",
    header: "",
    cell: ({ row }) => {
      const { id, permissions } = row.original;
      const path = usePathname();

      return (
        <EditButton
          prePath={path}
          fieldID={id}
          type="field"
          permissions={permissions}
        />
      );
    },
  },
];
