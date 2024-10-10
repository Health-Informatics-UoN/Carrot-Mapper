"use client";

import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns/format";

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" sortName="id" />
    ),
    enableHiding: false,
    enableSorting: true,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" sortName="name" />
    ),
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: "Creation Date",
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Creation Date"
        sortName="created_at"
      />
    ),
    enableHiding: true,
    enableSorting: true,
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      return format(date, "MMM dd, yyyy h:mm a");
    },
  },
  {
    id: "Updated At",
    accessorKey: "updated_at",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Updated At"
        sortName="updated_at"
      />
    ),
    enableHiding: true,
    enableSorting: true,
    cell: ({ row }) => {
      const date = new Date(row.original.updated_at);
      return format(date, "MMM dd, yyyy h:mm a");
    },
  },
];
