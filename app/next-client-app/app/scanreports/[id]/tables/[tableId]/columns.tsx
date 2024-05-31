"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { Pencil } from "lucide-react";
import { ConceptTags } from "@/components/concepts/concept-tags";
import AddConcept from "@/components/concepts/add-concept";

export const columns: ColumnDef<ScanReportField>[] = [
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
      return <ConceptTags concepts={concepts ?? []} />;
    },
  },
  {
    id: "Add Concept",
    header: "",
    cell: ({ row }) => {
      const { scan_report_table, id } = row.original;
      return (
        <AddConcept
          rowId={id}
          parentId={scan_report_table.toString()}
          location="SR-Fields"
        />
      );
    },
  },
  {
    id: "edit",
    header: "",
    cell: ({ row }) => {
      const { id, permissions } = row.original;
      return permissions?.includes("CanEdit") ? (
        <Link href={`fields/${id}/update`}>
          <Button variant={"secondary"}>
            Edit Field
            <Pencil className="ml-2 size-4" />
          </Button>
        </Link>
      ) : (
        <Button variant={"secondary"} disabled>
          Edit Field
          <Pencil className="ml-2 size-4" />
        </Button>
      );
    },
  },
];
