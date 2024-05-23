import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/error";
import { Form, Formik } from "formik";
import { toast } from "sonner";
import { getDataPartners, getDataSet } from "@/api/datasets";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DatasetFromProps {
  datasetId: string;
}

export default async function DatasetForm({ datasetId }: DatasetFromProps) {
  const datasetName = await getDataSet(datasetId);
  const dataPartners = await getDataPartners();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <span>Change Data Partner</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {dataPartners.map((partner) => (
          <DropdownMenuItem key={partner.id}>{partner.name}</DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
