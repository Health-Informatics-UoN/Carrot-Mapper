import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  getDataUsers,
  getDatasetList,
  getDatasetPermissions,
} from "@/api/datasets";
import { ScanReportDetailsForm } from "@/components/scanreports/ScanReportDetailsForm";
import { getScanReport, getScanReportPermissions } from "@/api/scanreports";
import { Forbidden } from "@/components/core/Forbidden";

interface ScanReportDetailsProps {
  params: {
    id: string;
  };
}

export default async function ScanreportDetails({
  params: { id },
}: ScanReportDetailsProps) {
  const scanreport = await getScanReport(id);
  const datasetList = await getDatasetList();
  const users = await getDataUsers();
  const parent_dataset = datasetList.find(
    (dataset) => dataset.name === scanreport.parent_dataset
  );
  const permissionsDS = await getDatasetPermissions(
    parent_dataset?.id.toString() || ""
  );
  const permissionsSR = await getScanReportPermissions(id);
  const isAuthor = permissionsSR.permissions.includes("IsAuthor");

  if (permissionsDS.permissions.length === 0) {
    return (
      <div>
        <Forbidden />
      </div>
    );
  }

  return (
    <div>
      <ScanReportDetailsForm
        scanreport={scanreport}
        datasetList={datasetList}
        users={users}
        permissions={permissionsDS.permissions}
        isAuthor={isAuthor}
      />
    </div>
  );
}
