import {
  getDataUsers,
  getDatasetList,
  getDatasetPermissions,
} from "@/api/datasets";
import { ScanReportDetailsForm } from "@/components/scanreports/ScanReportDetailsForm";
import { getScanReport, getScanReportPermissions } from "@/api/scanreports";
import { Forbidden } from "@/components/core/Forbidden";
import { notFound } from "next/navigation";
import { FormDataFilter } from "@/components/form-components/FormikUtils";

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
    const initialParentDataset = scanreport.parent_dataset;
    const initialDatasetFilter =
      FormDataFilter<DatasetStrict>(initialParentDataset);
    return (
      <div>
        <ScanReportDetailsForm
          scanreport={scanreport}
          initialDataset={initialDatasetFilter}
          users={users}
          isAuthor={isAuthor}
          disableDatasetChange={true}
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
        disableDatasetChange={false}
      />
    </div>
  );
}
