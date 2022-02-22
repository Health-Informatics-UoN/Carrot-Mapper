import React, { useState, useEffect, useRef } from 'react'
import PageHeading from './PageHeading'
import { Select, Box, Text, Button, Flex, Spinner, Container, Input, Tooltip, CloseButton, ScaleFade, useDisclosure, Switch } from "@chakra-ui/react"
import { useGet, usePost } from '../api/values'
import ToastAlert from './ToastAlert'
import ConceptTag from './ConceptTag'

const UploadScanReport = ({ setTitle }) => {

    const { isOpen, onOpen, onClose } = useDisclosure()
    const [alert, setAlert] = useState({ hidden: true, title: '', description: '', status: 'error' });
    const [dataPartners, setDataPartners] = useState([{ name: "------" }]);
    const [selectedDataPartner, setselectedDataPartner] = useState({ name: "------" });

    const [datasets, setDatasets] = useState([{ name: "------" }]);
    const [loadingDataset, setLoadingDataset] = useState(false);
    const [addingDataset, setAddingDataset] = useState(false);
    const [projectVisibleToPublic, setProjectVisibleToPublic] = useState(true);
    const [projects, setProjects] = useState([]);
    const [projectList, setProjectList] = useState(undefined);

    const [users, setUsers] = useState([]);
    const [usersList, setUsersList] = useState(undefined);

    const [addDatasetMessage, setAddDatasetMessage] = useState(null);

    const [selectedDataset, setselectedDataset] = useState({ name: "------" });

    const scanReportName = useRef();
    const createDatasetRef = useRef();
    const [whiteRabbitScanReport, setWhiteRabbitScanReport] = useState(null);
    const [dataDictionary, setDataDictionary] = useState(null);
    const [loadingMessage, setLoadingMessage] = useState("Loading page")
    useEffect(async () => {
        setTitle(null)
        const dataPartnerQuery = await useGet("/datapartners/")
        setDataPartners([{ name: "------" }, ...dataPartnerQuery])
        setLoadingMessage(null)
        const projectsQuery = await useGet("/projects/")
        console.log(projectsQuery)
        setProjectList(projectsQuery)
        const usersQuery = await useGet("/users/")
        setUsersList(usersQuery)
    }, []);

    useEffect(async () => {
        // change the dataset list
        setLoadingDataset(true)
        const dataPartnerId = selectedDataPartner.id
        if (dataPartnerId != undefined) {
            const datasets_query = await useGet(`/datasetsfilter/?data_partner=${dataPartnerId}`)
            // if currently selected dataset is in the list of new datasets then leave selected datasets the same, otherwise, make dataset equal to null 
            setDatasets([{ name: "------" }, ...datasets_query.sort((a, b) => a.name.localeCompare(b.name))])
            if (!datasets_query.find(ds => ds.id == selectedDataset.id)) {
                setselectedDataset({ name: "------" })
            }
        }
        else {
            setDatasets([{ name: "------" }])
            setselectedDataset({ name: "------" })
        }
        setLoadingDataset(false)


    }, [selectedDataPartner]);

    function readScanReport() {
        let file = document.getElementById('scanreport').files[0]
        setWhiteRabbitScanReport(file)

    }
    function readDataDictionary() {
        let file = document.getElementById('datadictionary').files[0]
        setDataDictionary(file)
    }
    async function createDataset() {
        const newDatasetName = createDatasetRef.current.value
        if (newDatasetName == "") { return }
        // creates new dataset under selected datapartner 
        setAddDatasetMessage("Adding Dataset")
        const data_partner = selectedDataPartner
        try {
            const data = {
                data_partner: data_partner.id,
                name: newDatasetName,
                visibility: projectVisibleToPublic ? "PUBLIC" : "RESTRICTED"
            }
            if (!projectVisibleToPublic) {
                data.viewers = users.map(item => item.id)
            }
            const newDataset = await usePost(`/datasets/create/`, data)
            await mapDatasetToProjects(newDataset, projects)
            setLoadingDataset(true)
            // revalidate
            const datasets_query = await useGet(`/datasetsfilter/?data_partner=${data_partner.id}`)
            // if currently selected dataset is in the list of new datasets then leave selected datasets the same, otherwise, make dataset equal to null 
            setDatasets([{ name: "------" }, ...datasets_query.sort((a, b) => a.name.localeCompare(b.name))])
            // could as a default behaviour set the selected dataset to the newly created dataset using code below
            // if(datasets_query.find(ds => ds.id == newDataset.id)){
            //     setselectedDataset(newDataset)
            // }
            // else

            if (!datasets_query.find(ds => ds.id == selectedDataset.id)) {
                setselectedDataset({ name: "------" })
            }
            setLoadingDataset(false)
            closeAddingInterface()

            // Could add newly created dataset to dataset list manually like this rather than revalidating
            // setDatasets(
            //     ds => [{ name: "------" }, ...[newDataset, ...ds.filter(ds2 => ds2.id != undefined)].sort((a, b) => a.name.localeCompare(b.name))]
            // )



            setAlert({
                hidden: false,
                status: 'success',
                title: 'Success',
                description: 'New Dataset added'
            })
            onOpen()
        }
        catch (err) {
            setAlert({
                hidden: false,
                status: 'error',
                title: 'Could not add dataset',
                description: err.statusText ? err.statusText : ""
            })
            closeAddingInterface()
            onOpen()
        }
    }
    const upload = async () => {
        setLoadingMessage("Uploading scanreport")
        let formData = new FormData()
        await formData.append('parent_dataset', selectedDataset.id)
        await formData.append('dataset', "samATest")
        await formData.append('scan_report_file', whiteRabbitScanReport)
        await formData.append('data_dictionary_file', dataDictionary)

        for (var key of formData.entries()) {
            console.log(key[0] + ', ' + key[1]);
        }
        //await window.uploadScanReport(formData)

        //redirect if the upload was successful, otherwise show the error message
       // window.location.href = `${window.u}scanreports/`
    }
    const removeProject = (name) => {
        setProjects(pj => pj.filter(proj => proj.name != name))
    }
    const removeUser = (id) => {
        setUsers(pj => pj.filter(user => user.id != id))
    }
    async function mapDatasetToProjects(dataset, projects) {
        console.log("This is where the dataset would get added to the projects")
        return
    }

    const closeAddingInterface = () => {
        setAddingDataset(false)
        setAddDatasetMessage(null)
        setProjects([])
        setUsers([])
        setProjectVisibleToPublic(true)
    }

    if (loadingMessage) {
        //Render Loading State
        return (
            <div>
                <Flex padding="30px">
                    <Spinner />
                    <Flex marginLeft="10px">{loadingMessage ? loadingMessage : "Loading page"}</Flex>
                </Flex>
            </div>
        )
    }
    return (
        <Container maxW='container.xl'>
            {isOpen &&
                <ScaleFade initialScale={0.9} in={isOpen}>
                    <ToastAlert hide={onClose} title={alert.title} status={alert.status} description={alert.description} />
                </ScaleFade>
            }
            <PageHeading text={"New Scan Report"} />

            <Box mt={4}>
                <Text w="200px">Data Partner</Text>
                <Select value={JSON.stringify(selectedDataPartner)} onChange={(option) => setselectedDataPartner(JSON.parse(option.target.value))
                } >
                    {dataPartners.map((item, index) =>
                        <option key={index} value={JSON.stringify(item)}>{item.name}</option>
                    )}
                </Select>
            </Box>

            <Box mt={4}>
                <Text w="200px">Dataset</Text>
                {loadingDataset ?
                    <Select isDisabled={true} icon={<Spinner />} placeholder='Loading Datasets' />
                    :
                    <Box>
                        <Box display={{ md: 'flex' }}>
                            <Select value={JSON.stringify(selectedDataset)} onChange={(option) => setselectedDataset(JSON.parse(option.target.value))
                            } >
                                {datasets.map((item, index) =>
                                    <option key={index} value={JSON.stringify(item)}>{item.name}</option>
                                )}
                            </Select>
                            {selectedDataPartner.id != undefined && !addingDataset &&
                                <Tooltip label="Add new Dataset">
                                    <Button onClick={() => setAddingDataset(true)}>Add new</Button>
                                </Tooltip>
                            }
                        </Box>
                        {selectedDataPartner.id != undefined && addingDataset &&
                            <Box px={4} display="grid" pb={8} bg={"gray.200"} rounded="xl">
                                {addDatasetMessage ?
                                    <>
                                        <CloseButton size='sm' ml={"auto"} mt={4} isDisabled={addDatasetMessage == "Adding Dataset"}
                                            onClick={closeAddingInterface} />

                                        <Flex alignItems={"center"} justifySelf="center" h="full">
                                            {addDatasetMessage == "Adding Dataset" &&
                                                <Spinner />}
                                            <Text>{addDatasetMessage}</Text>
                                        </Flex>
                                    </>
                                    :
                                    <>
                                        <CloseButton size='sm' ml={"auto"} mt={4}
                                            onClick={closeAddingInterface} />
                                        <Box display={{ md: 'flex' }}>
                                            <Input placeholder='Dataset Name' bg={"white"} ref={createDatasetRef} />

                                        </Box>
                                        <Box mt="10px">
                                            <Text fontWeight={"bold"}>Visible to public?</Text>
                                            <Flex alignItems={"center"}>
                                                <Switch isChecked={projectVisibleToPublic} onChange={(e) => setProjectVisibleToPublic(restriction => !restriction)} />
                                                <Text fontWeight={"bold"} ml={2}>{projectVisibleToPublic ? "Public" : "Restricted"}</Text>
                                            </Flex>
                                            {!projectVisibleToPublic &&
                                                <>
                                                    <Box>
                                                        <div style={{ display: "flex", flexWrap: "wrap", marginTop: "10px" }}>
                                                            <div style={{ fontWeight: "bold", marginRight: "10px" }} >Viewers: </div>
                                                            {users.map((user, index) => {
                                                                return (
                                                                    <div key={index} style={{ marginTop: "0px" }}>
                                                                        <ConceptTag conceptName={user.username} conceptId={""} conceptIdentifier={user.id} itemId={user.id} handleDelete={removeUser} />
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                        {usersList == undefined ?
                                                            <Select isDisabled={true} icon={<Spinner />} placeholder='Loading Viewers' />
                                                            :
                                                            <Select bg="white" mt={4} style={{ fontWeight: "bold" }} value="Add Viewer" readOnly onChange={(option) => setUsers(pj => [...pj.filter(user => user.id != JSON.parse(option.target.value).id), JSON.parse(option.target.value)])}>
                                                                <option style={{ fontWeight: "bold" }} disabled>Add Viewer</option>
                                                                <>
                                                                    {usersList.map((item, index) =>
                                                                        <option key={index} value={JSON.stringify(item)}>{item.username}</option>
                                                                    )}
                                                                </>
                                                            </Select>
                                                        }
                                                    </Box>
                                                </>
                                            }
                                        </Box>
                                        <Box>
                                            <div style={{ display: "flex", flexWrap: "wrap", marginTop: "10px" }}>
                                                <div style={{ fontWeight: "bold", marginRight: "10px" }} >Projects: </div>
                                                {projects.map((project, index) => {
                                                    return (
                                                        <div key={index} style={{ marginTop: "0px" }}>
                                                            <ConceptTag conceptName={project.name} conceptId={""} conceptIdentifier={project.name} itemId={project.name} handleDelete={removeProject} />
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            {projectList == undefined ?
                                                <Select isDisabled={true} icon={<Spinner />} placeholder='Loading Projects' />
                                                :
                                                <Select bg="white" mt={4} style={{ fontWeight: "bold" }} value="Add Project" readOnly onChange={(option) => setProjects(pj => [...pj.filter(proj => proj.name != JSON.parse(option.target.value).name), JSON.parse(option.target.value)])}>
                                                    <option style={{ fontWeight: "bold" }} disabled>Add Project</option>
                                                    <>
                                                        {projectList.map((item, index) =>
                                                            <option key={index} value={JSON.stringify(item)}>{item.name}</option>
                                                        )}
                                                    </>
                                                </Select>
                                            }
                                        </Box>
                                        <Button w="full" mt={4}
                                            onClick={createDataset}>Add new Dataset</Button>
                                    </>
                                }
                            </Box>
                        }
                    </Box>
                }
            </Box>


            <Box mt={4}>
                <Text w="200px">Scan Report name</Text>
                <Input ref={scanReportName} />
            </Box>

            <Box mt={4} >
                <Text w="200px">WhiteRabbit ScanReport</Text>
                <input type="file" id="scanreport" onChange={readScanReport}
                    style={{ width: "100%", borderWidth: "1px", borderColor: "gray", borderRadius: "5px" }} />
            </Box>

            <Box mt={4}>
                <Text w="200px">Data Dictionary</Text>
                <input type="file" id="datadictionary" onChange={readDataDictionary}
                    style={{ width: "100%", borderWidth: "1px", borderColor: "gray", borderRadius: "5px" }} />
            </Box>



            <Button mt="10px" onClick={upload}>Submit</Button>
        </Container>
    );
}

export default UploadScanReport;