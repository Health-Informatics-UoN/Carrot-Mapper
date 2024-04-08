"use client";

import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<ScanReport>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    enableHiding: false,
  },
  {
    accessorKey: "data_partner",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Data Partner" />
    ),
    enableHiding: false,
  },
  {
    accessorKey: "dataset_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Dataset" />
    ),
    enableHiding: false,
  },
  {
    accessorKey: "dataset",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    enableHiding: false,
  },
  {
    accessorKey: "author_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Author" />
    ),
    enableHiding: false,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    enableHiding: false,
    enableSorting: true,
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      const options: any = {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      };
      const formattedDate = date.toLocaleDateString("en-US", options);
      return formattedDate;
    },
  },
];
