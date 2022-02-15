import React, { useState, useEffect, useRef } from 'react'
import PageHeading from './PageHeading'
import { Select, Box, Text, Button, Flex, Spinner, Container, Input, Tooltip, CloseButton, ScaleFade, useDisclosure } from "@chakra-ui/react"
import { useGet, usePost } from '../api/values'
import ToastAlert from './ToastAlert'

const UploadScanReport = ({ setTitle }) => {

    const { isOpen, onOpen, onClose } = useDisclosure()
    const [alert, setAlert] = useState({ hidden: true, title: '', description: '', status: 'error' });
    const [dataPartners, setDataPartners] = useState([{ name: "------" }]);
    const [selectedDataPartner, setselectedDataPartner] = useState("------");

    const [datasets, setDatasets] = useState([{ name: "------" }]);
    const [loadingDataset, setLoadingDataset] = useState(false);
    const [addingDataset, setAddingDataset] = useState(false);
    const [addDatasetMessage, setAddDatasetMessage] = useState(null);

    const [selectedDataset, setselectedDataset] = useState("------");

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
    }, []);

    useEffect(async () => {
        // change the dataset list
        setLoadingDataset(true)
        const dataPartnerId = selectedDataPartner == "------" ? undefined : dataPartners.find(dp => dp.name == selectedDataPartner && dp.id != undefined).id
        if (dataPartnerId != undefined) {
            const datasets_query = await useGet(`/datasetsfilter/?data_partner=${dataPartnerId}`)
            // if currently selected dataset is in the list of new datasets then leave selected datasets the same, otherwise, make dataset equal to null 
            setDatasets([{ name: "------" }, ...datasets_query])
            if (!datasets_query.find(ds => ds.name == selectedDataset)) {
                setselectedDataset("------")
            }
        }
        else {
            setDatasets([{ name: "------" }])
            setselectedDataset("------")
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
        // first check that the name given is unique for the given dp
        const data_partner = dataPartners.find(dp => dp.name == selectedDataPartner && dp.id != undefined)
        const datasets_query = await useGet(`/datasetsfilter/?data_partner=${data_partner.id}`)
        if (datasets_query.find(ds => ds.name == newDatasetName) != undefined) {
            setAlert({
                hidden: false,
                status: 'error',
                title: 'Could not add dataset',
                description: 'Dataset name must be unique for the datapartner'
            })
            setAddingDataset(false)
            setAddDatasetMessage(null)
            onOpen()
            return
        }
        // if the name is unique, then try to add the datapartner
        try {
            const data = {
                data_partner: data_partner.id,
                name: newDatasetName
            }
            const newDataset = await usePost(`/datasets/`, data)
            setAddingDataset(false)
            setAddDatasetMessage(null)
            // add newly created dataset to dataset list
            setDatasets(
                ds => [{ name: "------" }, newDataset, ...ds.filter(ds2 => ds2.id != undefined)]
            )
            // could as a default behaviour set the selected dataset to the newly created dataset but
            // does not do that currently
            // could also arrange the datasets by name but not currently implemented

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
            setAddingDataset(false)
            setAddDatasetMessage(null)
            onOpen()
        }
    }
    const upload = () => {
        setLoadingMessage("Uploading scanreport")
        const uploadObject =
        {
            data_partner: dataPartners.find(dp => dp.name == selectedDataPartner),
            dataset: datasets.find(ds => ds.name == selectedDataset),
            scan_report_name: scanReportName.current.value,
            scan_report: whiteRabbitScanReport,
            data_dictionary: dataDictionary
        }
        console.log(uploadObject)

        //redirect
        window.location.href = `${window.u}scanreports/`
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
                <Select value={selectedDataPartner} onChange={(option) => setselectedDataPartner(option.target.value)
                } >
                    {dataPartners.map((item, index) =>
                        <option key={index} value={item.name}>{item.name}</option>
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
                            <Select value={selectedDataset} onChange={(option) => setselectedDataset(option.target.value)
                            } >
                                {datasets.map((item, index) =>
                                    <option key={index} value={item.name}>{item.name}</option>
                                )}
                            </Select>
                            {selectedDataPartner != "------" && !addingDataset &&
                                <Tooltip label="Add new Dataset">
                                    <Button onClick={() => setAddingDataset(true)}>Add new</Button>
                                </Tooltip>
                            }
                        </Box>
                        {selectedDataPartner != "------" && addingDataset &&
                            <Box px={4} display="grid" pb={8} bg={"gray.200"} rounded="xl">
                                {addDatasetMessage ?
                                    <>
                                        <CloseButton size='sm' ml={"auto"} mt={4} isDisabled={addDatasetMessage == "Adding Dataset"}
                                            onClick={() => setAddingDataset(false)} />

                                        <Flex alignItems={"center"} justifySelf="center" h="full">
                                            {addDatasetMessage == "Adding Dataset" &&
                                                <Spinner />}
                                            <Text>{addDatasetMessage}</Text>
                                        </Flex>
                                    </>
                                    :
                                    <>
                                        <CloseButton size='sm' ml={"auto"} mt={4}
                                            onClick={() => setAddingDataset(false)} />
                                        <Text>Adding Dataset...</Text>
                                        <Box display={{ md: 'flex' }}>
                                            <Input placeholder='Dataset Name' bg={"white"} ref={createDatasetRef} />
                                            <Button w={{ base: 'full', md: "inherit" }}
                                                onClick={createDataset}>Add new</Button>
                                        </Box>
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