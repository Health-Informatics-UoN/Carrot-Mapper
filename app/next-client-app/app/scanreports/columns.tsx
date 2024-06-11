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
  TrashIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { ScanReportStatus } from "@/components/scanreports/ScanReportStatus";
import { format } from "date-fns/format";
import { HandleArchive } from "@/components/HandleArchive";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { DialogDescription } from "@radix-ui/react-dialog";
import { deleteScanReport } from "@/api/scanreports";
import { toast } from "sonner";

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
      const [isDeleteDialogOpen, setDeleteDialogOpen] =
        useState<boolean>(false);

      const DeleteDialog = () => {
        const handleDelete = async () => {
          const response = await deleteScanReport(id);
          if (response) {
            toast.error(
              `Failed to delete Scan Report! ${response.errorMessage}`,
            );
          } else {
            toast.success("Scan Report successfully deleted");
          }
          setDeleteDialogOpen(false);
        };

        return (
          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={() => setDeleteDialogOpen(false)}
          >
            <DialogContent>
              <DialogHeader className="text-start">
                <DialogTitle>Delete Scan Report</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this Scan Report? This will:
                </DialogDescription>
                <ul className="text-gray-800 list-disc pl-4 pt-2">
                  <li>Delete the Scan Report</li>
                  <li>Delete the Scan Report file, and data dictionary</li>
                  <li>
                    Delete the rules, and will not allow them to be reused
                  </li>
                  <li>
                    If any rules have been reused in any other Scan Reports,
                    they will not be deleted
                  </li>
                </ul>
              </DialogHeader>
              <DialogFooter className="flex-col space-y-2 sm:space-y-0 sm:space-x-2">
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
                <DialogClose asChild>
                  <Button className="bg-black text-white">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      };

      return (
        <>
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
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)}>
                Delete <TrashIcon className="ml-auto" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DeleteDialog />
        </>
      );
    },
  },
];
