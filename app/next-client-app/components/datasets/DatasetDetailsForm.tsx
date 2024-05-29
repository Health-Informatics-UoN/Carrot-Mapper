"use client";

import {
  getDataPartners,
  getDataUsers,
  getDatasetProject,
  getProjects,
} from "@/api/datasets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { statusOptions } from "@/constants/scanReportStatus";
import { navigateWithSearchParam, objToQuery } from "@/lib/client-utils";
import { FilterOption } from "@/types/filter";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { PartnersFacetsFilter } from "./PartnersFacetsFilter";
import { UsersFacetsFilter } from "./UsersFacetsFilter";
import { ProjectFacetsFilter } from "./ProjectFacetsFilter";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function DatasetDetailsForm({ dataset }: { dataset: DataSetSRList }) {
  // const queryParams = {
  //   datasets: dataset.id,
  // };

  // const query = objToQuery(queryParams);
  const router = useRouter();
  const searchParam = useSearchParams();

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
  // // Runs on load to populate the selectedOptions from params
  // useEffect(() => {
  //   const statusParam = searchParam.get("status__in");
  //   if (statusParam) {
  //     const statusValues = statusParam.split(",");
  //     const filteredOptions = dataPartners.filter((option) =>
  //       statusValues.includes(option.name)
  //     );
  //     setOptions(filteredOptions);
  //   }
  // }, []);

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
    // handleFacetsFilter(updatedOptions);
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
    // handleFacetsFilter(updatedOptions);
  };

  const handleSelectProject = (option: Projects) => {
    const updatedOptions = selectedProjects ? [...selectedProjects] : [];
    const isSelected = updatedOptions.some((item) => item.name === option.name);

    if (isSelected) {
      // Remove if it's already selected
      const index = updatedOptions.findIndex(
        (item) => item.name === option.name
      );
      updatedOptions.splice(index, 1);
    } else {
      updatedOptions.push(option);
    }

    setProjects(updatedOptions);
    // handleFacetsFilter(updatedOptions);
  };

  const handleSelectPartner = (option: DataPartner) => {
    setPartner(option);
    // handleFacetsFilter(updatedOptions);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log(name);
    console.log(visibility);
    console.log(selectedPartner);
    console.log(selectedEditors);
    console.log(selectedAdmins);
    console.log(selectedProjects);
  };

  // const handleFacetsFilter = (options?: DataPartner[]) => {
  //   navigateWithSearchParam(
  //     "status__in",
  //     options?.map((option) => option.name) || "",
  //     router,
  //     searchParam
  //   );
  // };

  return (
    <form className="w-full" onSubmit={handleSubmit}>
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
        <PartnersFacetsFilter
          title="Change Data Partner"
          options={dataPartners}
          selectedOption={selectedPartner}
          handleSelect={handleSelectPartner}
        />
      </div>
      <div className="max-sm:hidden">
        <UsersFacetsFilter
          title="Change/Add Users as Editors"
          options={users}
          selectedOptions={selectedEditors}
          handleSelect={handleSelectEditors}
        />
      </div>
      <div className="max-sm:hidden">
        <UsersFacetsFilter
          title="Change/Add Users as Admins"
          options={users}
          selectedOptions={selectedAdmins}
          handleSelect={handleSelectAdmins}
        />
      </div>
      <div className="max-sm:hidden">
        <ProjectFacetsFilter
          title="Change/Add Project"
          options={projects}
          selectedOptions={selectedProjects}
          handleSelect={handleSelectProject}
        />
      </div>
      <Button
        type="submit"
        className="mt-4 px-4 py-2 bg-carrot text-white rounded"
      >
        Submit
      </Button>
    </form>
  );
}
