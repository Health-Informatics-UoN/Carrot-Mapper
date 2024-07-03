"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, SquarePlus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, Formik } from "formik";
import { toast } from "sonner";
import { FormDataFilter } from "../form-components/FormikUtils";
import { Tooltips } from "../Tooltips";
import { FormikSelect } from "../form-components/FormikSelect";
import { createScanReport } from "@/api/scanreports";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { FormikSelectUsers } from "../form-components/FormikSelectUsers";
import { createDataset } from "@/api/datasets";

interface FormData {
  name: string;
  visibility: string;
  editors: number[];
  admins: number[];
  dataPartner: number;
  projects: number;
}

export function CreateDatasetForm({
  dataPartnerID,
  dataPartnerList,
  projectList,
}: {
  dataPartnerID?: number;
  dataPartnerList?: DataPartner[];
  projectList: Project[];
}) {
  const partnerOptions = FormDataFilter<DataPartner>(dataPartnerList || []);
  const projectOptions = FormDataFilter<Project>(projectList || []);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: FormData) => {
    const submittingData = {
      name: data.name,
      visibility: data.visibility,
      data_partner: data.dataPartner,
      admins: data.admins || [],
      editors: data.editors || [],
      projects: data.projects || [],
    };

    const response = await createDataset(submittingData);

    if (response) {
      setError(response.errorMessage);
      toast.error("Add New Dataset failed. Fix the error(s) first");
    } else {
      toast.success("New Dataset created!");
      setError(null);
    }
  };

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-3">
          <div>
            <AlertTitle className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Upload New Scan Report Failed. Error:
            </AlertTitle>
            <AlertDescription>
              <ul>
                {error.split(" * ").map((err, index) => (
                  <li key={index}>* {err}</li>
                ))}
              </ul>
            </AlertDescription>
          </div>
        </Alert>
      )}
      <Formik
        initialValues={{
          dataPartner: dataPartnerID ? dataPartnerID : 0,
          editors: [],
          admins: [],
          visibility: "PUBLIC",
          name: "",
          projects: 0,
        }}
        onSubmit={(data) => {
          toast.info("Creating Dataset ...");
          handleSubmit(data);
        }}
      >
        {({ values, handleChange, handleSubmit }) => (
          <Form className="w-full" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3 text-lg">
              {!dataPartnerID && (
                <>
                  <div className="flex flex-col gap-2">
                    <h3 className="flex">
                      Data Partner{" "}
                      <Tooltips
                        content="The Data Partner that owns the Dataset of the new Scan Report."
                        link="https://carrot4omop.ac.uk/Carrot-Mapper/projects-datasets-and-scanreports/#access-controls"
                      />
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
                </>
              )}
              <div className="flex flex-col gap-2">
                <h3 className="flex">
                  {" "}
                  Dataset Name
                  <Tooltips content="Name of the new Dataset" />
                </h3>
                <Input
                  onChange={handleChange}
                  name="name"
                  className="text-lg text-carrot"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="flex items-center">
                  {" "}
                  Project
                  <Tooltips content="" link="" />
                </h3>
                <FormikSelect
                  options={projectOptions}
                  name="projects"
                  placeholder="Select Project"
                  isMulti={true}
                  isDisabled={false}
                  required={true}
                />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="flex">
                  {" "}
                  Editors
                  <Tooltips
                    content="Dataset admins and editors also have Scan Report editor permissions."
                    link="https://carrot4omop.ac.uk/Carrot-Mapper/projects-datasets-and-scanreports/#scan-report-roles"
                  />
                </h3>
                <FormikSelectUsers
                  name="editors"
                  placeholder="Choose Editors"
                  isMulti={true}
                  isDisabled={values.projects === 0}
                />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="flex">
                  {" "}
                  Admins
                  <Tooltips
                    content="Dataset admins and editors also have Scan Report editor permissions."
                    link="https://carrot4omop.ac.uk/Carrot-Mapper/projects-datasets-and-scanreports/#scan-report-roles"
                  />
                </h3>
                <FormikSelectUsers
                  name="admins"
                  placeholder="Choose Admins"
                  isMulti={true}
                  isDisabled={values.projects === 0}
                />
              </div>
              <div className="flex items-center space-x-3">
                <h3 className="flex">
                  Visibility
                  <Tooltips
                    content="Setting the visibility of the new Dataset."
                    link="https://carrot4omop.ac.uk/Carrot-Mapper/projects-datasets-and-scanreports/#access-controls"
                  />
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
              <div className="mb-5">
                <Button
                  type="submit"
                  className="px-4 py-2 bg-carrot text-white rounded text-lg"
                  disabled={
                    values.dataPartner === 0 ||
                    values.name === "" ||
                    values.projects === 0
                  }
                >
                  Create Dataset
                  <SquarePlus className="ml-2" />
                </Button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
}
