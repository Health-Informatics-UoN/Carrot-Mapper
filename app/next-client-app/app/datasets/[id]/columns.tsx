"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pencil2Icon,
  DotsHorizontalIcon,
  EyeNoneIcon,
  EyeOpenIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { ScanReportStatus } from "@/components/scanreports/ScanReportStatus";
import { format } from "date-fns/format";
import { HandleArchive } from "@/components/scanreports/HandleArchive";

export const columns: ColumnDef<ScanReportList>[] = [
  {
    id: "id",
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="id" sortName="id" />
    ),
    enableHiding: true,
  },
  {
    id: "Name",
    accessorKey: "dataset",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" sortName="dataset" />
    ),
    cell: ({ row }) => {
      const id = row.original.id;
      return (
        <Link href={`/scanreports/${id}`} prefetch={false}>
          <button>{row.original.dataset}</button>
        </Link>
      );
    },
    enableHiding: true,
  },
  {
    id: "Dataset",
    accessorKey: "parent_dataset",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Dataset"
        sortName="parent_dataset"
      />
    ),
    enableHiding: true,
  },
  {
    id: "Data Partner",
    accessorKey: "data_partner",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Data Partner" />
    ),
    enableHiding: true,
    enableSorting: false,
  },
  {
    id: "Uploaded",
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Uploaded"
        sortName="created_at"
      />
    ),
    enableHiding: false,
    enableSorting: true,
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      return format(date, "MMM dd, yyyy h:mm a");
    },
  },
  {
    id: "Status",
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => {
      return <ScanReportStatus row={row} />;
    },
  },
  {
    id: "Rules",
    accessorKey: "rules",
    header: "",
    enableHiding: false,
    cell: ({ row }) => {
      const { id } = row.original;
      return (
        <Link href={`/scanreports/${id}/mapping_rules/`} prefetch={false}>
          <Button variant={"outline"}>
            Rules
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      );
    },
  },
  {
    id: "Actions",
    accessorKey: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => {
      const { id, hidden, dataset } = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <DotsHorizontalIcon className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() =>
                HandleArchive({
                  id: id,
                  hidden: hidden,
                  ObjName: dataset,
                  type: "scanreports",
                })
              }
            >
              {hidden ? "Unarchive" : "Archive"}
              {hidden ? (
                <EyeOpenIcon className="ml-auto" />
              ) : (
                <EyeNoneIcon className="ml-auto" />
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Link
              href={`/scanreports/${id}/details/`}
              style={{ textDecoration: "none", color: "black" }}
              prefetch={false}
            >
              <DropdownMenuItem>
                Details <Pencil2Icon className="ml-auto" />
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
