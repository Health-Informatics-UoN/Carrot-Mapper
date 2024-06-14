"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, Formik } from "formik";
import { toast } from "sonner";
import { FormDataFilter } from "../form-components/FormikUtils";
import { Tooltips } from "../Tooltips";
import { FormikSelect } from "../form-components/FormikSelect";
import { FormikSelectDataset } from "../form-components/FormikSelectDataset";
import { FormikSelectEditors } from "../form-components/FormikSelectEditors";

interface FormData {
  name: string;
  visibility: string;
  dataPartner: number;
  editors: number[];
  admins: number[];
  projects: number[];
}

type FormValues = {
  dataPartner: number;
  dataset: number;
};

export function NewSRForm({ dataPartners }: { dataPartners: DataPartner[] }) {
  const partnerOptions = FormDataFilter<DataPartner>(dataPartners);

  const handleSubmit = async (data: FormData) => {
    // const response = await updateDatasetDetails(
    //   data.name,
    //   data.visibility,
    //   data.dataPartner,
    //   data.admins || [],
    //   data.editors || [],
    //   data.projects || []
    // );
    // if (response) {
    //   toast.error(`Update Dataset failed. Error: ${response.errorMessage}`);
    // } else {
    //   toast.success("Update Dataset successful!");
    // }
  };

  return (
    <Formik
      initialValues={{
        dataPartner: 0,
        dataset: 0,
        editors: 0,
        visibility: "PUBLIC",
        name: "",
      }}
      onSubmit={(data) => {
        // handleSubmit(data);
      }}
    >
      {({ values, handleChange, handleSubmit }) => (
        <Form className="w-full" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3 text-lg">
            <div className="flex flex-col gap-2">
              <h3 className="flex">
                Data Partner{" "}
                {/* <Tooltips
                  content="The data partner that owns the dataset."
                  id={dataset.id}
                  name="data-partner"
                /> */}
              </h3>
              <FormikSelect
                options={partnerOptions}
                name="dataPartner"
                placeholder="Choose a Data Partner"
                isMulti={false}
                isDisabled={false}
              />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="flex">
                {" "}
                Dataset
                {/* <Tooltips
                  content="The dataset that belongs to the above data partner"
                  id={dataset.id}
                  name="dataset"
                /> */}
              </h3>
              <FormikSelectDataset
                name="dataset"
                placeholder="Choose a Dataset"
                isMulti={false}
                isDisabled={values.dataPartner === 0}
              />
            </div>
            <div className="flex items-center space-x-3">
              <h3 className="flex">
                Visibility
                {/* <Tooltips
                  content="If a Dataset is PUBLIC, then all users with access to any project associated to the Dataset can see them."
                  id={dataset.id}
                  name="visibility"
                /> */}
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
                defaultChecked
              />
              <Label className="text-lg">
                {values.visibility === "PUBLIC" ? "PUBLIC" : "RESTRICTED"}
              </Label>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="flex">
                {" "}
                Editors
                {/* <Tooltips
                  content="Members of the projects where the dataset belongs to. Can only be chosen after dataset is set"
                  id={dataset.id}
                  name="editors"
                /> */}
              </h3>
              <FormikSelectEditors
                name="editors"
                placeholder="Choose Editors"
                isMulti={true}
                isDisabled={values.dataset === 0}
              />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="flex">
                {" "}
                Scan Report Name
                {/* <Tooltips
                  content="Name of the new scan report"
                  id={dataset.id}
                  name="name"
                /> */}
              </h3>
              <Input
                onChange={handleChange}
                name="name"
                className="text-lg text-carrot"
                required
              />
            </div>
            <div>
              <Button
                type="submit"
                className="px-4 py-2 bg-carrot text-white rounded text-lg"
                // disabled={!canUpdate}
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
