"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  FieldInputProps,
  Form,
  Formik,
  useField,
  useFormikContext,
} from "formik";
import { toast } from "sonner";
import { FindAndFormat, FormDataFilter } from "../form-components/FormikUtils";
import { Tooltips } from "../Tooltips";
import { FormikSelect } from "../form-components/FormikSelect";
import { useEffect } from "react";
import { getDataSetList, getDataUsers, getProjects } from "@/api/datasets";

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

async function fetchDataset(dataPartner: string) {
  const datasets = await getDataSetList(dataPartner);
  return datasets.map((dataset) => ({
    value: dataset.id,
    label: dataset.name,
  }));
}

async function fetchProjectMembers(dataset: string) {
  const projects = await getProjects(dataset);
  const users = await getDataUsers();
  const membersIds = new Set<number>();

  projects.forEach((project) => {
    project.members.forEach((memberId) => {
      membersIds.add(memberId);
    });
  });
  const membersArray = Array.from(membersIds);
  return FindAndFormat<Users>(users, membersArray);
}

const DatasetField = (props: FieldInputProps<any>) => {
  const {
    values: { dataPartner },
    setFieldValue,
  } = useFormikContext<FormValues>();
  const [field, meta] = useField(props);

  useEffect(() => {
    const fetchData = async () => {
      if (dataPartner !== 0) {
        const dataset = await fetchDataset(dataPartner.toString());
        setFieldValue(props.name, dataset);
      }
    };
    fetchData();
  }, [dataPartner, setFieldValue, props.name]);

  return (
    <>
      <FormikSelect
        {...field}
        name={props.name}
        options={field.value}
        placeholder="Choose a dataset"
        isMulti={false}
        isDisabled={dataPartner === 0}
      />
      {meta.touched && meta.error ? <div>{meta.error}</div> : null}
    </>
  );
};

const EditorsField = (props: FieldInputProps<any>) => {
  const {
    values: { dataset },
    setFieldValue,
  } = useFormikContext<FormValues>();
  const [field, meta] = useField(props);

  useEffect(() => {
    const fetchData = async () => {
      if (dataset !== 0) {
        const projectMembers = await fetchProjectMembers(dataset.toString());
        setFieldValue(props.name, projectMembers);
      } else {
        setFieldValue(props.name, []); // Reset the editors field when dataset is 0
      }
    };
    fetchData();
  }, [dataset, setFieldValue, props.name]);

  return (
    <>
      <FormikSelect
        {...field}
        name={props.name}
        options={field.value}
        placeholder="Choose editors"
        isMulti={true}
        isDisabled={dataset === 0}
      />
      {meta.touched && meta.error ? <div>{meta.error}</div> : null}
    </>
  );
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
                placeholder="Choose an Data Partner"
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
              <DatasetField
                name="dataset"
                value={dataPartners}
                onChange={handleChange}
                onBlur={(e: { target: { value: any } }) => {
                  const value = e.target.value;
                  if (!value) {
                    alert("Dataset field cannot be empty");
                  }
                }}
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
              {/* <EditorsField
                name="editors"
                value={dataPartners}
                onChange={handleChange}
                onBlur={(e: { target: { value: any } }) => {
                  const value = e.target.value;
                  if (!value) {
                    alert("Editors field cannot be empty");
                  }
                }}
              /> */}
            </div>
            <div className="flex items-center space-x-3">
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
