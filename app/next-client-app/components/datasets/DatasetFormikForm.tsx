"use client";

import { updateDatasetDetails } from "@/api/datasets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, Formik } from "formik";
import { toast } from "sonner";
import { FormikSelect } from "./FormikSelect";
import {
  FormDataFilterPartners,
  FormDataFilterProjects,
  FormDataFilterUsers,
} from "./FormikUtils";

interface FormData {
  name: string;
  visibility: string;
  dataPartner: number;
  editors: number[];
  admins: number[];
  projects: number[];
}

export function DatasetFormikForm({
  dataset,
  dataPartners,
  projects,
  users,
  permissions,
}: {
  dataset: DataSetSRList;
  dataPartners: DataPartner[];
  users: Users[];
  projects: Projects[];
  permissions: Permission[];
}) {
  const canUpdate = permissions.includes("CanAdmin");
  const userOptions = FormDataFilterUsers(users);
  const partnerOptions = FormDataFilterPartners(dataPartners);
  const projectOptions = FormDataFilterProjects(projects);
  const initialPartner = dataPartners.find(
    (partner) => dataset.data_partner === partner.id
  );
  if (!initialPartner) {
    throw new Error("Initial partner not found");
  }
  const initialEditors = users.filter((user) =>
    dataset.editors.includes(user.id)
  );
  const initialAdmins = users.filter((user) =>
    dataset.admins.includes(user.id)
  );
  const initialProject = projects.find((project) =>
    project.datasets?.includes(dataset.id)
  );
  if (!initialProject) {
    throw new Error("Initial project not found");
  }
  const initialPartnersFilter = FormDataFilterPartners(initialPartner);
  const initialEditorsFilter = FormDataFilterUsers(initialEditors);
  const initialAdminsFilter = FormDataFilterUsers(initialAdmins);
  const initialProjectFilter = FormDataFilterProjects(initialProject);
  const handleSubmit = async (data: FormData) => {
    try {
      console.log(data.projects || []);
      await updateDatasetDetails(
        dataset.id,
        data.name,
        data.visibility,
        data.dataPartner,
        data.admins || [],
        data.editors || []
      );
      toast.success("Update Dataset successful!");
    } catch (error) {
      toast.error("Update Dataset failed");
    }
  };

  return (
    <Formik
      initialValues={{
        name: dataset.name,
        visibility: dataset.visibility,
        editors: initialEditorsFilter.map((editor) => editor.value),
        dataPartner: initialPartnersFilter[0].value,
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
              <h3> Name:</h3>
              <Input
                placeholder={dataset.name}
                onChange={handleChange}
                name="name"
                disabled={!canUpdate}
                className="text-lg text-carrot"
              />
            </div>
            <div className="flex items-center space-x-3">
              <h3> Visibility:</h3>
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
              <h3> Data Partner:</h3>
              <FormikSelect
                options={partnerOptions}
                name="dataPartner"
                placeholder="Choose an Data Partner"
                isMulti={false}
                isDisabled={!canUpdate}
              />
            </div>
            <div className="flex flex-col gap-2">
              <h3> Editors:</h3>
              <FormikSelect
                options={userOptions}
                name="editors"
                placeholder="Choose an editor"
                isMulti={true}
                isDisabled={!canUpdate}
              />
            </div>
            <div className="flex flex-col gap-2">
              <h3> Admins:</h3>
              <FormikSelect
                options={userOptions}
                name="admins"
                placeholder="Choose an admin"
                isMulti={true}
                isDisabled={!canUpdate}
              />
            </div>
            <div className="flex flex-col gap-2">
              <h3> Project:</h3>
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
                className="px-4 py-2 bg-carrot text-white rounded"
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
