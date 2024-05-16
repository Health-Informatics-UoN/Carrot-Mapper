"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import AddConcept from "./add-concept";
import { ConceptTags } from "./concept-tags";
import { Pencil } from "lucide-react";

export const columns: ColumnDef<ScanReportResult>[] = [
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
      const { concepts } = row.original as ScanReportField;
      return <ConceptTags concepts={concepts ?? []} />;
    },
  },
  {
    id: "Add Concept",
    header: "",
    cell: ({ row }) => {
      const { scan_report_table, id } = row.original as ScanReportField;
      return <AddConcept id={id} tableId={scan_report_table.toString()} />;
    },
  },
  {
    id: "edit",
    header: "",
    cell: ({ row }) => {
      const { id } = row.original;
      return (
        <Link href={`fields/${id}/update`}>
          <Button variant={"secondary"}>
            Edit Field
            <Pencil className="ml-2 size-4" />
          </Button>
        </Link>
      );
    },
  },
];
