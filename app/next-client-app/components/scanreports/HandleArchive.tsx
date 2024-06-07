import { archiveDataSets } from "@/api/datasets";
import { updateScanReport } from "@/api/scanreports";
import { toast } from "sonner";

export const HandleArchive = async ({
  id,
  hidden,
  ObjName,
  type,
}: {
  id: number;
  hidden: boolean;
  ObjName: string;
  type: string;
}) => {
  const message = hidden ? "Unarchive" : "Archive";
  let response;

  switch (type) {
    case "datasets":
      response = await archiveDataSets(id, !hidden);
      break;
    case "scanreports":
      response = await updateScanReport(id, "hidden", !hidden);
      break;
  }

  if (!response.success && response.error !== undefined) {
    toast.error(`${message} ${ObjName} failed. ${response.error}`);
  } else {
    toast.success(`${message} ${ObjName} succeeded.`);
  }
};
