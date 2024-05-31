import Link from "next/link";
import { Button } from "../ui/button";
import { BookText, ChevronRight, Pencil } from "lucide-react";

export function ButtonsRow({
  scanreportId,
  tableId,
  permissions,
}: {
  scanreportId: string;
  tableId: string;
  permissions: string[];
}) {
  return (
    <div className="flex justify-between mt-3 flex-col sm:flex-row">
      <div className="flex gap-2">
        <Link href={`/scanreports/${scanreportId}/details/`}>
          <Button>
            Scan Report Details
            <BookText className="ml-2 size-4" />
          </Button>
        </Link>
        <Link href={`/scanreports/${scanreportId}/mapping_rules/`}>
          <Button>
            Rules
            <ChevronRight className="ml-2 size-4" />
          </Button>
        </Link>
      </div>
      <div className="flex gap-2">
        {" "}
        {permissions.includes("CanEdit") || permissions.includes("CanAdmin") ? (
          <Link href={`/scanreports/${scanreportId}/tables/${tableId}/update`}>
            <Button variant="outline">
              Edit Table
              <Pencil className="ml-2 size-4" />
            </Button>
          </Link>
        ) : (
          <Button variant="outline" disabled>
            Edit Table
            <Pencil className="ml-2 size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
