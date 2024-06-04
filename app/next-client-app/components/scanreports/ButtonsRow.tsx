import Link from "next/link";
import { Button } from "../ui/button";
import { BookText, ChevronRight, Pencil } from "lucide-react";
import { EditButton } from "./EditButton";

export function ButtonsRow({
  scanreportId,
  tableId,
  permissions,
}: {
  scanreportId: number;
  tableId: number;
  permissions: Permission[];
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
      <div>
        <EditButton
          scanreportId={scanreportId}
          tableId={tableId}
          type="table-row"
          permissions={permissions}
        />
      </div>
    </div>
  );
}
