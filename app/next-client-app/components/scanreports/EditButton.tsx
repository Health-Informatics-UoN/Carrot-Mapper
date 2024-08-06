import Link from "next/link";
import { Button } from "../ui/button";
import { Pencil } from "lucide-react";

export function EditButton({
  scanreportId,
  tableId,
  fieldID,
  type,
  permissions,
  prePath,
}: {
  scanreportId?: number;
  tableId?: number;
  fieldID?: number;
  prePath?: string;
  type: string;
  permissions: Permission[];
}) {
  const canEdit =
    permissions.includes("CanEdit") || permissions.includes("CanAdmin");
  return (
    <Link
      href={
        canEdit
          ? type === "table" || type === "table-row"
            ? `/scanreports/${scanreportId}/tables/${tableId}/update`
            : type === "field"
            ? `${prePath}/fields/${fieldID}/update`
            : ""
          : ""
      }
      className={canEdit ? "cursor-pointer" : "cursor-not-allowed"}
    >
      <Button
        variant={
          type === "table" || type === "field"
            ? "secondary"
            : type === "table-row"
            ? "outline"
            : "default"
        }
        disabled={canEdit ? false : true}
      >
        {type === "table" || type === "table-row"
          ? "Edit Table"
          : type === "field"
          ? "Edit Field"
          : ""}
        <Pencil className="ml-2 size-4" />
      </Button>
    </Link>
  );
}
