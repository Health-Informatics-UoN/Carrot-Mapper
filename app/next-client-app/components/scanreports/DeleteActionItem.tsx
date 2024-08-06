"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import DeleteDialog from "@/components/scanreports/DeleteDialog";
import { TrashIcon } from "lucide-react";

interface DeleteActionItemProps {
  id: number;
}
// This "client" item is created to prevent the Delete dialog closed when the Dropdown menu closed after an menu item being clicked
export function DeleteActionItem({ id }: DeleteActionItemProps) {
  return (
    <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
      <DeleteDialog id={id} redirect>
        <Button
          variant="ghost"
          className="text-red-400 dark:text-red-400 px-0 py-0 h-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <TrashIcon className="mr-2 size-4" />
          Delete Scan Report
        </Button>
      </DeleteDialog>
    </DropdownMenuItem>
  );
}
