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
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { Button } from "@/components/ui/button";
import { updateScanReport } from "@/api/scanreports";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight } from "lucide-react";

export const columns: ColumnDef<ScanReportResult>[] = [
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
    id: "Status",
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => {
      const statusMapping = {
        BLOCKED: { text: "Blocked", color: "text-red-900" },
        COMPLET: { text: "Mapping Complete", color: "text-green-600" },
        INPRO25: { text: "Mapping 25%", color: "text-orange-300" },
        INPRO50: { text: "Mapping 50%", color: "text-orange-400" },
        INPRO75: { text: "Mapping 75%", color: "text-orange-500" },
        UPCOMPL: { text: "Upload Complete", color: "text-blue-800" },
        UPFAILE: { text: "Upload Failed", color: "text-red-500" },
        UPINPRO: { text: "Upload in Progress", color: "text-orange-600" },
      };

      const { id, status } = row.original;
      const statusInfo = statusMapping[status as keyof typeof statusMapping];
      const textColorClassName = statusInfo?.color ?? "text-black";

      const handleChangeStatus = async (value: string) => {
        try {
          await updateScanReport(id, "status", value);
        } catch (error) {
          console.error(error);
        }
      };

      return (
        <Select value={status} onValueChange={handleChangeStatus}>
          <SelectTrigger className={`${textColorClassName} w-[180px]`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusMapping).map(([value, { text, color }]) => (
              <SelectItem key={value} value={value}>
                {text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
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
      const { id, hidden } = row.original;

      const handleArchive = async () => {
        try {
          await updateScanReport(id, "hidden", !hidden);
        } catch (error) {
          console.error(error);
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <DotsHorizontalIcon className="size-4" aria-hidden="true" />
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
            <Link
              href={`/scanreports/${id}/details/`}
              style={{ textDecoration: "none", color: "black" }}
              prefetch={false}
            >
              <DropdownMenuItem>
                Details <Pencil2Icon className="ml-auto" />
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <Link
              href={`/scanreports/${id}/assertions/`}
              style={{ textDecoration: "none", color: "black" }}
              prefetch={false}
            >
              <DropdownMenuItem>
                Assertions <ExclamationTriangleIcon className="ml-auto" />
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
