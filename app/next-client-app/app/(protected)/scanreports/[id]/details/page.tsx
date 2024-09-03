import {
  getDataUsers,
  getDatasetList,
  getDatasetPermissions,
} from "@/api/datasets";
import { ScanReportDetailsForm } from "@/components/scanreports/ScanReportDetailsForm";
import { getScanReport, getScanReportPermissions } from "@/api/scanreports";
import { Forbidden } from "@/components/core/Forbidden";
import { notFound } from "next/navigation";

interface ScanReportDetailsProps {
  params: {
    id: string;
  };
}

export default async function ScanreportDetails({
  params: { id },
}: ScanReportDetailsProps) {
  const scanreport = await getScanReport(id);
  if (!scanreport) {
    return notFound();
  }
  const permissionsSR = await getScanReportPermissions(id);
  const isAuthor = permissionsSR.permissions.includes("IsAuthor");
  const datasetList = await getDatasetList();
  const users = await getDataUsers();
  const parent_dataset = datasetList.find(
    (dataset) => dataset.name === scanreport?.parent_dataset.name
  );
  if (!parent_dataset && isAuthor) {
    const initialParentDataset = [
      datasetList.find(
        (dataset) => scanreport.parent_dataset.name === dataset.name // parent's dataset is unique (set by the models.py) so can be used to find the initial parent dataset here
      )!,
    ];
    return (
      <div>
        <ScanReportDetailsForm
          scanreport={scanreport}
          datasetList={initialParentDataset}
          users={users}
          isAuthor={isAuthor}
          disabledDataset={true}
        />
      </div>
    );
  }

  const permissionsDS = await getDatasetPermissions(
    parent_dataset?.id.toString() || ""
  );

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
        disabledDataset={false}
      />
    </div>
  );
}
