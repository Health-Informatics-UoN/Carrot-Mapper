import { archiveDataSets } from "@/api/datasets";
import { updateScanReport } from "@/api/scanreports";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";

const handleError = (error: any, message: string) => {
  if (error instanceof ApiError) {
    try {
      const errorObj = JSON.parse(error.message);
      toast.error(`${message} Error: ${errorObj.detail}`);
    } catch {
      toast.error(`${message} Error: ${error.message}`);
    }
  } else {
    toast.error(
      `${message} Error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
  console.error(error);
};

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
  try {
    if (type === "datasets") {
      await archiveDataSets(id, !hidden);
    } else if (type === "scanreports") {
      await updateScanReport(id, "hidden", !hidden);
    }
    toast.success(`${message} ${ObjName} succeeded.`);
  } catch (error) {
    handleError(error, `${message} ${ObjName} Failed.`);
  }
};
