"use client";

import {
  getDataPartners,
  getDataUsers,
  getProjects,
  updateDatasetDetails,
} from "@/api/datasets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SelectPartners } from "./SelectPartners";
import { SelectUsers } from "./SelectUsers";
import { SelectProjects } from "./SelectProjects";
import { Form, Formik } from "formik";
import { toast } from "sonner";

export function DatasetDetailsForm({ dataset }: { dataset: DataSetSRList }) {
  const [selectedPartner, setPartner] = useState<DataPartner>();
  const [selectedEditors, setEditors] = useState<Users[]>();
  const [selectedAdmins, setAdmins] = useState<Users[]>();
  const [selectedProjects, setProjects] = useState<Projects[]>();

  const [name, setName] = useState(dataset.name);
  const [visibility, setVisibility] = useState(dataset.visibility);
  const [dataPartners, setDataPartners] = useState<DataPartner[]>([]);
  const [users, setDataUsers] = useState<Users[]>([]);
  const [projects, setAllProjects] = useState<Projects[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Need a fix to show the dataset's project
        // const initialProject = await getDatasetProject(query);
        const partners = await getDataPartners();
        const users = await getDataUsers();
        const projects = await getProjects();
        setDataPartners(partners);
        setAllProjects(projects);
        setDataUsers(users);
        const initialPartner = partners.find(
          (partner) => dataset.data_partner === partner.id
        );
        const initialEditors = users.filter((user) =>
          dataset.editors.includes(user.id)
        );
        const initialAdmins = users.filter((user) =>
          dataset.admins.includes(user.id)
        );
        setPartner(initialPartner);
        setEditors(initialEditors);
        setAdmins(initialAdmins);
        // setProjects(initialProject);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  const handleChangeName = useDebouncedCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      let name = "";
      if (event.target.value === "") {
        name = dataset.name;
      } else {
        name = event.target.value;
      }
      setName(name);
    }
  );

  const handleChangeVisibility = useDebouncedCallback(
    async (checked: boolean) => {
      if (checked === false) {
        setVisibility("RESTRICTED");
      } else {
        setVisibility("PUBLIC");
      }
    }
  );

  const handleSelectEditors = (option: Users) => {
    const updatedOptions = selectedEditors ? [...selectedEditors] : [];
    const isSelected = updatedOptions.some(
      (item) => item.username === option.username
    );

    if (isSelected) {
      // Remove if it's already selected
      const index = updatedOptions.findIndex(
        (item) => item.username === option.username
      );
      updatedOptions.splice(index, 1);
    } else {
      updatedOptions.push(option);
    }

    setEditors(updatedOptions);
  };

  const handleSelectAdmins = (option: Users) => {
    const updatedOptions = selectedAdmins ? [...selectedAdmins] : [];
    const isSelected = updatedOptions.some(
      (item) => item.username === option.username
    );

    if (isSelected) {
      // Remove if it's already selected
      const index = updatedOptions.findIndex(
        (item) => item.username === option.username
      );
      updatedOptions.splice(index, 1);
    } else {
      updatedOptions.push(option);
    }

    setAdmins(updatedOptions);
  };

  const handleSelectProject = (option: Projects) => {
    const updatedOptions = selectedProjects ? [...selectedProjects] : [];
    const isSelected = updatedOptions.some((item) => item.name === option.name);

    if (isSelected) {
      const index = updatedOptions.findIndex(
        (item) => item.name === option.name
      );
      updatedOptions.splice(index, 1);
    } else {
      updatedOptions.push(option);
    }

    setProjects(updatedOptions);
  };

  const handleSelectPartner = (option: DataPartner) => {
    setPartner(option);
  };

  const handleSubmit = async () => {
    try {
      await updateDatasetDetails(
        dataset.id,
        name,
        visibility,
        selectedPartner?.id || 0,
        selectedAdmins?.map((admin) => admin.id) || [],
        selectedEditors?.map((editor) => editor.id) || []
        // selectedProjects?.map(project => project.id)
      );
      toast.success("Update Dataset successful!");
    } catch (error) {
      toast.error("Update Dataset failed");
    }
  };

  return (
    <Formik
      initialValues={{}}
      onSubmit={(data) => {
        handleSubmit();
      }}
    >
      {({ values, handleChange, handleSubmit }) => (
        <Form className="w-full" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center">
              <h3 className="mr-3"> Name:</h3>
              <Input
                placeholder={dataset.name}
                onChange={handleChangeName}
                className="max-w-xs mr-4"
              />
            </div>
            <div className="flex items-center space-x-2">
              <h3 className="mr-3"> Visibility:</h3>
              <Switch
                onCheckedChange={handleChangeVisibility}
                defaultChecked={dataset.visibility === "PUBLIC" ? true : false}
              />
              <Label>{visibility === "PUBLIC" ? "PUBLIC" : "RESTRICTED"}</Label>
            </div>
            <div className="max-sm:hidden">
              <SelectPartners
                title="Data Partner"
                options={dataPartners}
                selectedOption={selectedPartner}
                handleSelect={handleSelectPartner}
              />
            </div>
            <div className="max-sm:hidden">
              <SelectUsers
                title="Editors"
                options={users}
                selectedOptions={selectedEditors}
                handleSelect={handleSelectEditors}
              />
            </div>
            <div className="max-sm:hidden">
              <SelectUsers
                title="Admins"
                options={users}
                selectedOptions={selectedAdmins}
                handleSelect={handleSelectAdmins}
              />
            </div>
            <div className="max-sm:hidden">
              <SelectProjects
                title="Projects"
                options={projects}
                selectedOptions={selectedProjects}
                handleSelect={handleSelectProject}
              />
            </div>
            <div>
              <Button
                type="submit"
                className="px-4 py-2 bg-carrot text-white rounded"
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
