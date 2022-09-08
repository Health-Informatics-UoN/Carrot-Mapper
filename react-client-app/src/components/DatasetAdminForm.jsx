import React, { useState, useEffect, useRef } from "react";
import {
  Select,
  Box,
  Text,
  Button,
  Flex,
  Spinner,
  Container,
  Input,
  Tooltip,
  CloseButton,
  ScaleFade,
  useDisclosure,
  Switch,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Link,
} from "@chakra-ui/react";
import PageHeading from "./PageHeading";
import ToastAlert from "./ToastAlert";
import ConceptTag from "./ConceptTag";
import CCBreadcrumbBar from "./CCBreadcrumbBar";
import { useGet, usePatch, useDelete } from "../api/values";
import { arraysEqual } from "../utils/arrayFuncs";
import Error404 from "../views/Error404";

const DatasetAdminForm = ({ setTitle }) => {
  let pathArray = window.location.pathname.split("/");
  let datasetId = pathArray[pathArray.length - 3];
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAdmin, setIsAdmin] = useState(window.isAdmin);
  // Set up component state
  const [alert, setAlert] = useState({
    hidden: true,
    title: "",
    description: "",
    status: "error",
  });
  const [dataset, setDataset] = useState({});
  const [dataPartners, setDataPartners] = useState();
  const [selectedDataPartner, setSelectedDataPartner] = useState();
  const [isPublic, setIsPublic] = useState();
  const [loadingMessage, setLoadingMessage] = useState("Loading page");
  const [formErrors, setFormErrors] = useState({});
  const [uploadLoading, setUploadLoading] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [editors, setEditors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectsList, setProjectsList] = useState(undefined);
  const [usersList, setUsersList] = useState(undefined);
  const [error, setError] = useState(undefined);
  const [projectDifference, setProjectDifference] = useState(0);

  function getUsersFromIds(userIds, userObjects) {
    /**
     * Get an array user objects with ids in an array of ids.
     *
     * userIds: Array[Number]
     * userObjects: Array[Object]
     */
    const idIterator = userIds.values();
    let users = [];
    for (let id of idIterator) {
      for (let obj of userObjects) {
        if (id === obj.id) {
          users.push(obj);
        }
      }
    }
    return users;
  }

  // Set up page
  useEffect(
    async () => {
      setTitle(null);
      try {
        const datasetQuery = await useGet(`/datasets/${datasetId}/`);
        const queries = [
          useGet("/datapartners/"),
          useGet("/usersfilter/?is_active=true"),
          useGet(`/projects/?dataset=${datasetId}`),
          useGet(`/projects`),
          useGet(`/countprojects/${datasetId}`),
        ];
        // Get dataset, data partners and users
        const [
          dataPartnerQuery,
          usersQuery,
          projectsQuery,
          allProjectsQuery,
          projectCount,
        ] = await Promise.all(queries);
        const validUsers = [
          ...new Set(projectsQuery.map((project) => project.members).flat()),
        ];
        // Set up state from the results of the queries
        setDataset(datasetQuery);
        setIsPublic(datasetQuery.visibility === "PUBLIC");
        setDataPartners([...dataPartnerQuery]);
        setProjectsList(allProjectsQuery);
        setProjects(projectsQuery);
        setProjectDifference(projectCount.project_count - projectsQuery.length);
        setSelectedDataPartner(
          dataPartnerQuery.find(
            (element) => element.id === datasetQuery.data_partner,
          ),
        );
        setLoadingMessage(null);
        setUsersList(usersQuery.filter((user) => validUsers.includes(user.id)));
        setViewers((prevViewers) => [
          ...prevViewers,
          ...getUsersFromIds(datasetQuery.viewers, usersQuery),
        ]);
        setAdmins((prevAdmins) => [
          ...prevAdmins,
          ...getUsersFromIds(datasetQuery.admins, usersQuery),
        ]);
        setEditors((prevEditors) => [
          ...prevEditors,
          ...getUsersFromIds(datasetQuery.editors, usersQuery),
        ]);
        setLoadingMessage(null); // stop loading when finished
      } catch (error) {
        setError(true);
        setLoadingMessage(null);
      }
    },
    [], // Required to stop this effect sending infinite requests
  );

  useEffect(async () => {
    setFormErrors({ ...formErrors, name: undefined });
  }, [dataset.name]);

  useEffect(async () => {
    setFormErrors({ ...formErrors, data_partner: undefined });
  }, [selectedDataPartner]);

  useEffect(async () => {
    setFormErrors({ ...formErrors, viewers: undefined });
  }, [viewers]);

  useEffect(async () => {
    setFormErrors({ ...formErrors, editors: undefined });
  }, [editors]);

  useEffect(async () => {
    setFormErrors({ ...formErrors, admins: undefined });
  }, [admins]);

  // Update dataset name
  function handleNameInput(newValue) {
    setDataset({ ...dataset, name: newValue });
  }

  // Update dataset visibility
  function handleVisibilitySwitch(newValue) {
    setIsPublic(newValue);
    setDataset({ ...dataset, visibility: newValue ? "PUBLIC" : "RESTRICTED" });
  }

  // Update dataset data partner
  function handleDataPartnerSelect(newValue) {
    const dataPartner = JSON.parse(newValue);
    setSelectedDataPartner(dataPartner);
    setDataset({ ...dataset, data_partner: dataPartner.id });
  }

  // Remove user chip from viewers
  const removeViewer = (id) => {
    setViewers((pj) => pj.filter((user) => user.id != id));
  };
  // Remove user chip from editors
  const removeEditor = (id) => {
    setEditors((pj) => pj.filter((user) => user.id != id));
  };

  // Remove user chip from admins
  const removeAdmin = (id) => {
    setAdmins((pj) => pj.filter((user) => user.id != id));
  };

  // Remove user chip from projects
  const removeProject = (name) => {
    setProjects((pj) => pj.filter((project) => project.name != name));
  };

  const mapDatasetToProjects = async (newProjects, discardedProjects) => {
    const projectsQuery = await useGet("/projects/?datasets=true");
    const promises = [];
    const full_projects = await useGet(
      `/projects/?name__in=${newProjects
        .map((project) => project.name)
        .join()}`,
    );
    full_projects.map((project) => {
      const data = {
        id: project.id,
        datasets: [
          datasetId,
          ...projectsQuery
            .find((item) => item.name == project.name)
            .datasets.filter((item) => item != datasetId),
        ],
      };
      promises.push(usePatch(`/projects/update/${project.id}/`, data));
    });
    if (discardedProjects.length > 0) {
      const full_discarded_projects = await useGet(
        `/projects/?name__in=${discardedProjects
          .map((project) => project.name)
          .join()}`,
      );
      full_discarded_projects.map((project) => {
        const data = {
          id: project.id,
          datasets: projectsQuery
            .find((item) => item.name == project.name)
            .datasets.filter((item) => item != datasetId),
        };
        promises.push(usePatch(`/projects/update/${project.id}/`, data));
      });
    }
    await Promise.all(promises);
    return;
  };

  // Send updated dataset to the DB
  async function upload() {
    /**
     * Send a `PATCH` request updating the dataset and
     * refresh the page with the new data
     */

    const patchData = {
      name: dataset.name,
      data_partner: selectedDataPartner.id,
      visibility: isPublic ? "PUBLIC" : "RESTRICTED",
    };
    // Add viewers if they've been altered
    const newViewers = viewers.map((x) => x.id);
    if (!arraysEqual(newViewers, dataset.viewers)) {
      patchData.viewers = newViewers;
    }
    // Add editors if they've been altered
    const newEditors = editors.map((x) => x.id);
    if (!arraysEqual(newEditors, dataset.editors)) {
      patchData.editors = newEditors;
    }
    // Add admins if they've been altered
    const newAdmins = admins.map((x) => x.id);
    if (!arraysEqual(newAdmins, dataset.admins)) {
      patchData.admins = newAdmins;
    }

    try {
      setUploadLoading(true);
      const response = await usePatch(
        `/datasets/update/${datasetId}/`,
        patchData,
      );
      const currentProjects = await useGet(`/projects/?dataset=${datasetId}`);
      if (
        !arraysEqual(
          currentProjects.map((item) => item.name),
          projects.map((item) => item.name),
        )
      ) {
        const discardedProjects = currentProjects.filter(
          (item) =>
            !projects.map((project) => project.name).includes(item.name),
        );
        await mapDatasetToProjects(projects, discardedProjects);
      }

      setUploadLoading(false);
      setDataset(response);
      setAlert({
        hidden: false,
        status: "success",
        title: "Success",
        description: "Dataset updated",
      });
      onOpen();
      window.location.reload(true);
    } catch (error) {
      const error_response = await error.json();
      setUploadLoading(false);
      if (error_response) {
        setFormErrors(error_response);
      }
      setAlert({
        hidden: false,
        status: "error",
        title: "Could not update dataset",
        description: error.statusText ? error.statusText : "",
      });
      onOpen();
    }
  }

  const warnUpload = () => {
    if (
      confirm(
        `This Dataset is in ${projectDifference} further Projects that you cannot see. Do you want to continue with this edit?`,
      ) == true
    ) {
      upload();
    }
  };

  if (error) {
    //Render Error State
    return <Error404 setTitle={setTitle} />;
  }

  if (loadingMessage) {
    //Render Loading State
    return (
      <div>
        <Flex padding="30px">
          <Spinner />
          <Flex marginLeft="10px">
            {loadingMessage ? loadingMessage : "Loading page"}
          </Flex>
        </Flex>
      </div>
    );
  }

  return (
    <Container maxW="container.xl">
      <CCBreadcrumbBar>
        <Link href={"/"}>Home</Link>
        <Link href={"/datasets/"}>Datasets</Link>
        <Link href={`/datasets/${datasetId}/`}>{dataset.name}</Link>
        <Link href={`/datasets/${datasetId}/details/`}>Details</Link>
      </CCBreadcrumbBar>
      {isOpen && (
        <ScaleFade initialScale={0.9} in={isOpen}>
          <ToastAlert
            hide={onClose}
            title={alert.title}
            status={alert.status}
            description={alert.description}
          />
        </ScaleFade>
      )}

      <PageHeading text={`Details Page - Dataset #${dataset.id}`} />

      <FormControl
        mt={4}
        isInvalid={formErrors.name && formErrors.name.length > 0}
      >
        <FormLabel htmlFor="dataset-name" style={{ fontWeight: "bold" }}>
          Name:
        </FormLabel>
        <Input
          id="dataset-name"
          value={dataset.name}
          readOnly={!isAdmin}
          onChange={(e) => handleNameInput(e.target.value)}
        />
        {formErrors.name && formErrors.name.length > 0 && (
          <FormErrorMessage>{formErrors.name[0]}</FormErrorMessage>
        )}
      </FormControl>

      <FormControl mt={4}>
        <FormLabel htmlFor="dataset-visibility" style={{ fontWeight: "bold" }}>
          Visibility:
        </FormLabel>
        <Flex alignItems={"center"}>
          <Switch
            id="dataset-visibility"
            isChecked={isPublic}
            isReadOnly={!isAdmin}
            onChange={(e) => handleVisibilitySwitch(!isPublic)}
          />
          <Text fontWeight={"bold"} ml={2}>
            {dataset.visibility}
          </Text>
        </Flex>
      </FormControl>
      {!isPublic && (
        <FormControl
          isInvalid={formErrors.viewers && formErrors.viewers.length > 0}
        >
          <Box mt={4}>
            <div
              style={{ display: "flex", flexWrap: "wrap", marginTop: "10px" }}
            >
              <div style={{ fontWeight: "bold", marginRight: "10px" }}>
                Viewers:{" "}
              </div>
              {viewers.map((viewer, index) => {
                return (
                  <div key={index} style={{ marginTop: "0px" }}>
                    <ConceptTag
                      conceptName={viewer.username}
                      conceptId={""}
                      conceptIdentifier={viewer.id}
                      itemId={viewer.id}
                      handleDelete={removeViewer}
                      readOnly={!isAdmin}
                    />
                  </div>
                );
              })}
            </div>
            {isAdmin && (
              <>
                {usersList == undefined ? (
                  <Select
                    isDisabled={true}
                    icon={<Spinner />}
                    placeholder="Loading Viewers"
                  />
                ) : (
                  <Select
                    isDisabled={!isAdmin}
                    bg="white"
                    mt={4}
                    value="Add Viewer"
                    readOnly
                    onChange={(option) =>
                      setViewers((pj) => [
                        ...pj.filter(
                          (user) =>
                            user.id != JSON.parse(option.target.value).id,
                        ),
                        JSON.parse(option.target.value),
                      ])
                    }
                  >
                    <option disabled>Add Viewer</option>
                    <>
                      {usersList.map((item, index) => (
                        <option key={index} value={JSON.stringify(item)}>
                          {item.username}
                        </option>
                      ))}
                    </>
                  </Select>
                )}
              </>
            )}
            {formErrors.viewers && formErrors.viewers.length > 0 && (
              <FormErrorMessage>{formErrors.viewers[0]}</FormErrorMessage>
            )}
          </Box>
        </FormControl>
      )}
      {isAdmin ? (
        <FormControl mt={4}>
          <FormLabel
            htmlFor="dataset-datapartner"
            style={{ fontWeight: "bold" }}
          >
            Data Partner:
          </FormLabel>
          <Select
            id="dataset-datapartner"
            value={JSON.stringify(selectedDataPartner)}
            onChange={(option) => handleDataPartnerSelect(option.target.value)}
          >
            {dataPartners.map((item, index) => (
              <option key={index} value={JSON.stringify(item)}>
                {item.name}
              </option>
            ))}
          </Select>
        </FormControl>
      ) : (
        <>
          <Text fontWeight={"bold"} mt={4}>
            Data Partner:{" "}
          </Text>
          <Input value={selectedDataPartner.name} readOnly={true} />
        </>
      )}
      <FormControl
        isInvalid={formErrors.editors && formErrors.editors.length > 0}
      >
        <Box mt={4}>
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: "10px" }}>
            <div style={{ fontWeight: "bold", marginRight: "10px" }}>
              Editors:{" "}
            </div>
            {editors.map((viewer, index) => {
              return (
                <div key={index} style={{ marginTop: "0px" }}>
                  <ConceptTag
                    conceptName={viewer.username}
                    conceptId={""}
                    conceptIdentifier={viewer.id}
                    itemId={viewer.id}
                    handleDelete={removeEditor}
                    readOnly={!isAdmin}
                  />
                </div>
              );
            })}
          </div>
          {isAdmin && (
            <>
              {usersList == undefined ? (
                <Select
                  isDisabled={true}
                  icon={<Spinner />}
                  placeholder="Loading Viewers"
                />
              ) : (
                <Select
                  bg="white"
                  mt={4}
                  value="Add Editor"
                  readOnly
                  onChange={(option) =>
                    setEditors((pj) => [
                      ...pj.filter(
                        (user) => user.id != JSON.parse(option.target.value).id,
                      ),
                      JSON.parse(option.target.value),
                    ])
                  }
                >
                  <option disabled>Add Editor</option>
                  <>
                    {usersList.map((item, index) => (
                      <option key={index} value={JSON.stringify(item)}>
                        {item.username}
                      </option>
                    ))}
                  </>
                </Select>
              )}
              {formErrors.editors && formErrors.editors.length > 0 && (
                <FormErrorMessage>{formErrors.editors[0]}</FormErrorMessage>
              )}
            </>
          )}
        </Box>
      </FormControl>
      <FormControl
        isInvalid={formErrors.admins && formErrors.admins.length > 0}
      >
        <Box mt={4}>
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: "10px" }}>
            <div style={{ fontWeight: "bold", marginRight: "10px" }}>
              Admins:{" "}
            </div>
            {admins.map((viewer, index) => {
              return (
                <div key={index} style={{ marginTop: "0px" }}>
                  <ConceptTag
                    conceptName={viewer.username}
                    conceptId={""}
                    conceptIdentifier={viewer.id}
                    itemId={viewer.id}
                    handleDelete={removeAdmin}
                    readOnly={!isAdmin}
                  />
                </div>
              );
            })}
          </div>
          {isAdmin && (
            <>
              {usersList == undefined ? (
                <Select
                  isDisabled={true}
                  icon={<Spinner />}
                  placeholder="Loading Viewers"
                />
              ) : (
                <Select
                  bg="white"
                  mt={4}
                  value="Add Admin"
                  readOnly
                  onChange={(option) =>
                    setAdmins((pj) => [
                      ...pj.filter(
                        (user) => user.id != JSON.parse(option.target.value).id,
                      ),
                      JSON.parse(option.target.value),
                    ])
                  }
                >
                  <option disabled>Add Admin</option>
                  <>
                    {usersList.map((item, index) => (
                      <option key={index} value={JSON.stringify(item)}>
                        {item.username}
                      </option>
                    ))}
                  </>
                </Select>
              )}
              {formErrors.admins && formErrors.admins.length > 0 && (
                <FormErrorMessage>{formErrors.admins[0]}</FormErrorMessage>
              )}
            </>
          )}
        </Box>
      </FormControl>
      <FormControl
        isInvalid={formErrors.admins && formErrors.admins.length > 0}
      >
        <Box mt={4}>
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: "10px" }}>
            <div style={{ fontWeight: "bold", marginRight: "10px" }}>
              Projects:{" "}
            </div>
            {projects.map((project, index) => {
              return (
                <div key={index} style={{ marginTop: "0px" }}>
                  <ConceptTag
                    conceptName={project.name}
                    conceptId={""}
                    conceptIdentifier={project.name}
                    itemId={project.name}
                    handleDelete={removeProject}
                    readOnly={!isAdmin}
                  />
                </div>
              );
            })}
          </div>
          {isAdmin && (
            <>
              {projectsList == undefined ? (
                <Select
                  isDisabled={true}
                  icon={<Spinner />}
                  placeholder="Loading Viewers"
                />
              ) : (
                <Select
                  bg="white"
                  mt={4}
                  value="Add Project"
                  readOnly
                  onChange={(option) =>
                    setProjects((pj) => [
                      ...pj.filter(
                        (project) =>
                          project.name != JSON.parse(option.target.value).name,
                      ),
                      JSON.parse(option.target.value),
                    ])
                  }
                >
                  <option disabled>Add Project</option>
                  <>
                    {projectsList.map((item, index) => (
                      <option key={index} value={JSON.stringify(item)}>
                        {item.name}
                      </option>
                    ))}
                  </>
                </Select>
              )}
              {formErrors.admins && formErrors.admins.length > 0 && (
                <FormErrorMessage>{formErrors.admins[0]}</FormErrorMessage>
              )}
            </>
          )}
        </Box>
      </FormControl>
      {isAdmin && (
        <Button
          isLoading={uploadLoading}
          loadingText="Uploading"
          mt="10px"
          onClick={projectDifference === 0 ? upload : warnUpload}
        >
          Submit
        </Button>
      )}
    </Container>
  );
};

export default DatasetAdminForm;
