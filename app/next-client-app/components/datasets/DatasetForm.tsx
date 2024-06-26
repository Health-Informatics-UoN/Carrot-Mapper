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

interface FormData {
  name: string;
  visibility: string;
  dataPartner: number;
  editors: number[];
  admins: number[];
  projects: number[];
}

export function DatasetForm({
  dataset,
  dataPartners,
  projects,
  users,
  permissions,
}: {
  dataset: DataSetSRList;
  dataPartners: DataPartner[];
  users: User[];
  projects: Project[];
  permissions: Permission[];
}) {
  const canUpdate = permissions.includes("CanAdmin");
  // Making options suitable for React Select
  const userOptions = FormDataFilter<User>(users);
  const partnerOptions = FormDataFilter<DataPartner>(dataPartners);
  const projectOptions = FormDataFilter<Project>(projects);
  // Fin the intial data partner which is required when adding Dataset
  const initialPartner = dataPartners.find(
    (partner) => dataset.data_partner === partner.id
  )!;
  // Find and make initial data suitable for React select
  const initialPartnerFilter = FormDataFilter<DataPartner>(initialPartner);
  const initialEditorsFilter = FindAndFormat<User>(users, dataset.editors);
  const initialAdminsFilter = FindAndFormat<User>(users, dataset.admins);
  const initialProjectFilter = FindAndFormat<Project>(
    projects,
    dataset.projects
  );

  const handleSubmit = async (data: FormData) => {
    const submittingData = {
      name: data.name,
      visibility: data.visibility,
      data_partner: data.dataPartner,
      admins: data.admins || [],
      editors: data.editors || [],
      projects: data.projects || [],
    };
    const response = await updateDatasetDetails(dataset.id, submittingData);
    if (response) {
      toast.error(`Update Dataset failed. Error: ${response.errorMessage}`);
    } else {
      toast.success("Update Dataset successful!");
    }
  };

  return (
    <Formik
      initialValues={{
        name: dataset.name,
        visibility: dataset.visibility,
        editors: initialEditorsFilter.map((editor) => editor.value),
        dataPartner: initialPartnerFilter[0].value,
        admins: initialAdminsFilter.map((admin) => admin.value),
        projects: initialProjectFilter.map((project) => project.value),
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
                placeholder={dataset.name}
                onChange={handleChange}
                name="name"
                disabled={!canUpdate}
                className="text-lg text-carrot"
              />
            </div>
            <div className="flex items-center space-x-3">
              <h3 className="flex">
                Visibility
                <Tooltips content="If a Dataset is PUBLIC, then all users with access to any project associated to the Dataset can see them." />
              </h3>
              <Switch
                onCheckedChange={(checked) =>
                  handleChange({
                    target: {
                      name: "visibility",
                      value: checked ? "PUBLIC" : "RESTRICTED",
                    },
                  })
                }
                defaultChecked={dataset.visibility === "PUBLIC" ? true : false}
                disabled={!canUpdate}
              />
              <Label className="text-lg">
                {values.visibility === "PUBLIC" ? "PUBLIC" : "RESTRICTED"}
              </Label>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="flex">
                Data Partner{" "}
                <Tooltips content="The data partner that owns the dataset." />
              </h3>
              <FormikSelect
                options={partnerOptions}
                name="dataPartner"
                placeholder="Choose an Data Partner"
                isMulti={false}
                isDisabled={!canUpdate}
              />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="flex">
                {" "}
                Editors
                <Tooltips content="Dataset editors also have Scan Report editor permissions." />
              </h3>
              <FormikSelect
                options={userOptions}
                name="editors"
                placeholder="Choose an editor"
                isMulti={true}
                isDisabled={!canUpdate}
              />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="flex">
                {" "}
                Admins
                <Tooltips content="All Dataset admins also have Dataset editor permissions. Dataset admins also have Scan Report editor permissions." />
              </h3>
              <FormikSelect
                options={userOptions}
                name="admins"
                placeholder="Choose an admin"
                isMulti={true}
                isDisabled={!canUpdate}
              />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="flex">
                {" "}
                Project
                <Tooltips content="The project that the dataset belongs to." />
              </h3>
              <FormikSelect
                options={projectOptions}
                name="projects"
                placeholder="Choose a project"
                isMulti={true}
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
