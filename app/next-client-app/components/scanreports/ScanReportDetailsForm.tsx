"use client";

import { updateDatasetDetails } from "@/api/datasets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, Formik } from "formik";
import { toast } from "sonner";
import { FindAndFormat, FormDataFilter } from "../form-components/FormikUtils";
import { Tooltips } from "../Tooltips";
import { FormikSelect } from "../form-components/FormikSelect";
import { useState } from "react";

interface FormData {
  name: string;
  visibility: string;
  author: number;
  viewers: number[];
  editors: number[];
  parent_dataset: number;
}

export function ScanReportDetailsForm({
  datasetList,
  scanreport,
  users,
  permissions,
}: {
  datasetList: DataSetSRList[];
  scanreport: ScanReportList;
  users: User[];
  permissions: Permission[];
}) {
  // Permissions
  const canUpdate = permissions.includes("CanAdmin");
  // State control for viewers fields
  const [publicVisibility, setPublicVisibility] = useState<boolean>(
    scanreport.visibility === "PUBLIC" ? true : false
  );

  // Making options suitable for React Select
  const userOptions = FormDataFilter<User>(users);
  const parentDatasetOptions = FormDataFilter<DataSetSRList>(datasetList);
  // Find the intial parent dataset and author which is required when adding Dataset
  const initialParentDataset = datasetList.find(
    (dataset) => scanreport.parent_dataset === dataset.name
  )!;

  const initialAuthor = users.find((user) => scanreport.author === user.id)!;
  // Find and make initial data suitable for React select
  const initialDatasetFilter =
    FormDataFilter<DataSetSRList>(initialParentDataset);
  const initialAuthorFilter = FormDataFilter<User>(initialAuthor);
  const initialViewersFilter = FindAndFormat<User>(users, scanreport.viewers);
  const initialEditorsFilter = FindAndFormat<User>(users, scanreport.editors);

  const handleSubmit = async (data: FormData) => {
    const submittingData = {
      dataset: data.name,
      visibility: data.visibility,
      parent_dataset: data.parent_dataset,
      viewers: data.viewers || [],
      editors: data.editors || [],
      author: data.author,
    };
    // const response = await updateDatasetDetails(dataset.id, submittingData);
    // if (response) {
    //   toast.error(`Update Dataset failed. Error: ${response.errorMessage}`);
    // } else {
    //   toast.success("Update Dataset successful!");
    // }
  };

  return (
    <Formik
      initialValues={{
        name: scanreport.dataset,
        visibility: scanreport.visibility,
        author: initialAuthorFilter[0].value,
        viewers: initialViewersFilter.map((viewer) => viewer.value),
        editors: initialEditorsFilter.map((editor) => editor.value),
        parent_dataset: initialDatasetFilter[0].value,
      }}
      onSubmit={(data) => {
        handleSubmit(data);
      }}
    >
      {({ values, handleChange, handleSubmit }) => (
        <Form className="w-full" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3 text-lg">
            <div className="flex items-center space-x-3">
              <h3 className="flex">
                {" "}
                Name
                <Tooltips content="Name of the dataset." />
              </h3>
              <Input
                placeholder={scanreport.dataset}
                onChange={handleChange}
                name="name"
                disabled={!canUpdate}
                className="text-lg text-carrot"
              />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="flex">
                Author{" "}
                <Tooltips content="The data partner that owns the dataset." />
              </h3>
              <FormikSelect
                options={userOptions}
                name="author"
                placeholder="Choose an author"
                isMulti={false}
                isDisabled={!canUpdate}
              />
            </div>
            <div className="flex items-center space-x-3">
              <h3 className="flex">
                Visibility
                <Tooltips content="If a Dataset is PUBLIC, then all users with access to any project associated to the Dataset can see them." />
              </h3>
              <Switch
                onCheckedChange={(checked) => {
                  handleChange({
                    target: {
                      name: "visibility",
                      value: checked ? "PUBLIC" : "RESTRICTED",
                    },
                  });
                  setPublicVisibility(checked);
                }}
                defaultChecked={
                  scanreport.visibility === "PUBLIC" ? true : false
                }
                disabled={!canUpdate}
              />
              <Label className="text-lg">
                {values.visibility === "PUBLIC" ? "PUBLIC" : "RESTRICTED"}
              </Label>
            </div>
            {!publicVisibility && (
              <div className="flex flex-col gap-2">
                <h3 className="flex">
                  {" "}
                  Viewers
                  <Tooltips content="All Dataset admins and editors also have Dataset viewer permissions." />
                </h3>
                <FormikSelect
                  options={userOptions}
                  name="viewers"
                  placeholder="Choose viewers"
                  isMulti={true}
                  isDisabled={!canUpdate}
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <h3 className="flex">
                {" "}
                Editors
                <Tooltips content="Dataset editors also have Scan Report editor permissions." />
              </h3>
              <FormikSelect
                options={userOptions}
                name="editors"
                placeholder="Choose editors"
                isMulti={true}
                isDisabled={!canUpdate}
              />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="flex">
                {" "}
                Dataset
                <Tooltips content="The project that the dataset belongs to." />
              </h3>
              <FormikSelect
                options={parentDatasetOptions}
                name="parent_dataset"
                placeholder="Choose a parent dataset"
                isMulti={false}
                isDisabled={!canUpdate}
              />
            </div>
            <div>
              <Button
                type="submit"
                className="px-4 py-2 bg-carrot text-white rounded text-lg"
                disabled={!canUpdate}
              >
                Save <Save className="ml-2" />
              </Button>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
}
