"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { format } from "date-fns/format";

export const columns: ColumnDef<Job>[] = [
  {
    id: "Stage",
    accessorKey: "stage.value",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stage" />
    ),
    // TODO: Rendered based on the constants here
    enableSorting: false,
    enableHiding: true,
  },
  {
    id: "Status",
    accessorKey: "status.value",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    // TODO: Rendered based on the constants here
    enableSorting: false,
    enableHiding: true,
  },
  {
    id: "Triggered At",
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Triggered At" />
    ),
    enableSorting: false,
    enableHiding: true,
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      return format(date, "MMM dd, yyyy h:mm a");
    },
  },
  {
    id: "Last Updated",
    accessorKey: "updated_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Updated" />
    ),
    enableSorting: false,
    enableHiding: true,
    cell: ({ row }) => {
      const date = new Date(row.original.updated_at);
      return format(date, "MMM dd, yyyy h:mm a");
    },
  },
  {
    id: "Details",
    accessorKey: "details",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Details" />
    ),
    enableSorting: false,
    enableHiding: true,
  },
];
