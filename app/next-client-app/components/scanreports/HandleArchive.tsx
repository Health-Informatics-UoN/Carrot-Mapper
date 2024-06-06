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
  if (type === "datasets") {
    response = await archiveDataSets(id, !hidden);
  } else if (type === "scanreports") {
    response = await updateScanReport(id, "hidden", !hidden);
  }

  if (typeof response === "string" && response.includes("Error:")) {
    toast.error(`${message} ${ObjName} failed. ${response}`);
  } else {
    toast.success(`${message} ${ObjName} succeeded.`);
  }
};
