"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, Formik } from "formik";
import { toast } from "sonner";
import { FormDataFilter } from "../form-components/FormikUtils";
import { Tooltips } from "../Tooltips";
import { FormikSelect } from "../form-components/FormikSelect";
import { FormikSelectDataset } from "../form-components/FormikSelectDataset";
import { FormikSelectEditors } from "../form-components/FormikSelectEditors";
import { UploadSR } from "../form-components/UploadSR";
import { UploadDataDict } from "../form-components/UploadDataDict";
import { createScanReport } from "@/api/scanreports";

interface FormData {
  name: string;
  visibility: string;
  editors: number[];
  dataset: number;
  scan_report_file: File;
  Data_dict: File;
}

export function NewSRForm({ dataPartners }: { dataPartners: DataPartner[] }) {
  const partnerOptions = FormDataFilter<DataPartner>(dataPartners);

  const handleSubmit = async (data: FormData) => {
    const formData = new FormData();
    formData.append("dataset", data.name);
    formData.append("visibility", data.visibility);
    formData.append("parent_dataset", data.dataset.toString());
    data.editors.forEach((editor) => {
      formData.append("editors", editor.toString());
    });
    formData.append("scan_report_file", data.scan_report_file);
    formData.append("data_dictionary_file", data.Data_dict);

    const response = await createScanReport(formData);

    if (response) {
      toast.error(`Upload Scan Report failed. Error: ${response.errorMessage}`);
    } else {
      toast.success("New Scan Report is being uploaded");
    }
  };

  return (
    <Formik
      initialValues={{
        dataPartner: 0,
        dataset: 0,
        editors: [],
        visibility: "PUBLIC",
        name: "",
        scan_report_file: new File([], ""),
        Data_dict: new File([], ""),
      }}
      onSubmit={(data) => {
        handleSubmit(data);
      }}
    >
      {({ values, handleChange, handleSubmit, setFieldValue }) => (
        <Form
          className="w-full"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
        >
          <div className="flex flex-col gap-3 text-lg">
            <div className="flex flex-col gap-2">
              <h3 className="flex">
                Data Partner{" "}
                <Tooltips content="The data partner that owns the dataset." />
              </h3>
              <FormikSelect
                options={partnerOptions}
                name="dataPartner"
                placeholder="Choose a Data Partner"
                isMulti={false}
                isDisabled={false}
                required={true}
              />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="flex">
                {" "}
                Dataset
                <Tooltips content="The unarchived dataset that added to a project and belongs to the above data partner" />
              </h3>
              <FormikSelectDataset
                name="dataset"
                placeholder="Choose a Dataset"
                isMulti={false}
                isDisabled={values.dataPartner === 0}
                required={true}
              />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="flex">
                {" "}
                Editors
                <Tooltips content="Members of the projects where the dataset above belongs to. Can only be chosen after the dataset is selected." />
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
                <Tooltips content="Name of the new scan report" />
              </h3>
              <Input
                onChange={handleChange}
                name="name"
                className="text-lg text-carrot"
                required
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
                defaultChecked
              />
              <Label className="text-lg">
                {values.visibility === "PUBLIC" ? "PUBLIC" : "RESTRICTED"}
              </Label>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="flex">
                {" "}
                WhiteRabbit Scan Report
                <Tooltips content="Scan report that was generated from White Rabbit application" />
              </h3>
              <UploadSR setFieldValue={setFieldValue} />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="flex">
                {" "}
                Data Dictionary
                <Tooltips content="Data dictionary...?" />
              </h3>
              <UploadDataDict setFieldValue={setFieldValue} />
            </div>
            <div className="mb-5">
              <Button
                type="submit"
                className="px-4 py-2 bg-carrot text-white rounded text-lg"
                // disabled={!canUpdate}
              >
                Upload Scan Report <FileUp className="ml-2" />
              </Button>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
}
