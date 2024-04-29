"use client";

import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { archiveDataSets } from "@/api/datasets";
import { EyeNoneIcon, EyeOpenIcon, Pencil2Icon } from "@radix-ui/react-icons";

export const columns: ColumnDef<DataSetResult>[] = [
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
    id: "Data Partner",
    accessorKey: "data_partner",
    accessorFn: (row) => row.data_partner.name,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Data Partner"
        sortName="data_partner"
      />
    ),
    enableHiding: true,
    enableSorting: true,
  },
  {
    accessorKey: "visibility",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Visibility"
        sortName="visibility"
      />
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
  {
    id: "actions",
    cell: ({ row }) => {
      const { id, hidden } = row.original;

      const handleArchive = async () => {
        try {
          await archiveDataSets(id, !hidden);
        } catch (error) {
          console.error(error);
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleArchive}>
              {hidden ? "Unarchive" : "Archive"}
              {hidden ? (
                <EyeOpenIcon className="ml-auto" />
              ) : (
                <EyeNoneIcon className="ml-auto" />
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Details <Pencil2Icon className="ml-auto" />
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem>Copy Name</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    header: "Actions",
  },
];
