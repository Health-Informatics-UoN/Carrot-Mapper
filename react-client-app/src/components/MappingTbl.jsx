import React, { useState, useEffect, useRef } from 'react'
import {
    SimpleGrid,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableCaption,
    Tag,
    TagLabel,
    HStack,
    VStack,
    Flex,
    Spinner,
    Link,
    Text,
    Button
} from "@chakra-ui/react"

import { ArrowForwardIcon } from '@chakra-ui/icons'
import { useGet, chunkIds } from '../api/values'
import FilterTag from './FilterTag'



const MappingTbl = () => {
    const scan_report_id = window.location.href.split("scanreports/")[1].split("/")[0]
    const [values, setValues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(undefined);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [mapDiagram, setMapDiagram] = useState({ showing: false, image: null });
    const allData = useRef([]);
    const scanReport = useRef(null);
    const popping = useRef(false);
    const svg = useRef(null);
    const [selectedFilter, setFilter] = useState("All");
    const [secondaryFilter, setSecondaryFilter] = useState("All");
    const [secondaryFilters, setSecondaryFilters] = useState([]);
    const destinationFilters = [
        { name: "All" },
        { name: "person" },
        { name: "measurement" },
        { name: "condition_occurrence" },
        { name: "observation" },
        { name: "drug_exposure" }
    ]
    const [isDownloading, setDownloading] = useState(false);
    const [isDownloadingImg, setDownloadingImg] = useState(false);
    const downLoadingImgRef = useRef(false)

    useEffect(() => {
        // on initial load of the page, call setInitialData()
        setInitialData()
    }, []);


    useEffect(() => {
        // run when the selected filter is changed
        if (loading == false) {
            setLoading(true)
            // get the current page url
            const url = window.location.href
            // only change the url if the back button is not being pressed
            if (selectedFilter == "All") {
                if (popping.current == false) {
                    // change url 
                    window.history.pushState({}, '', url.split("mapping_rules/")[0] + "mapping_rules/")
                }
            }
            else {
                if (popping.current == false) {
                    // change url 
                    window.history.pushState({}, '', url.split("mapping_rules/")[0] + "mapping_rules/" + selectedFilter)
                }
            }
            // function to change filter data being displayed according to which filter is set
            switchFilter(1)
        }

    }, [selectedFilter]);

    useEffect(() => {
        // run when secondary filter is changed

        // get url of current page
        const url = window.location.href
        if (selectedFilter == "All") {
            // if primary filter is "All" then show all data
            setValues(allData.current)
        }
        else {
            // filter data by primary filter
            let filteredData = allData.current.filter(value => value.omop_table.table == selectedFilter)
            // filter data by secondary filter and change the url if needed 
            if (secondaryFilter != "All") {
                filteredData = filteredData.filter(value => value.scanreport_table.name == secondaryFilter)
                if (popping.current == false) {
                    window.history.pushState({}, '',
                        url.split("mapping_rules/")[0] + "mapping_rules/" + url.split("mapping_rules/")[1].split("/")[0] + "/" + secondaryFilter)
                }
            }
            else {
                if (popping.current == false) {
                    window.history.pushState({}, '',
                        url.split("mapping_rules/")[0] + "mapping_rules/" + url.split("mapping_rules/")[1].split("/")[0])
                }
            }
            setValues(filteredData)
        }
        // remove the current mapping diagram and get a new one
        if (svg.current) {
            if (svg.current.hasChildNodes()) {
                svg.current.removeChild(mapDiagram.image)
            }
        }
        setMapDiagram(mapDiagram => ({ ...mapDiagram, image: null }))
    }, [secondaryFilter]);

    useEffect(() => {
        // run when map diagram state has changed
        if (!mapDiagram.image) {
            // if no map diagram is loaded, request to get a new one
            window.getSVG().then(diagram => {
                setMapDiagram(mapDiagram => ({ ...mapDiagram, image: diagram.getElementsByTagName("svg")[0] }))
                if (svg.current) {
                    if (svg.current.hasChildNodes()) {
                        // remove all othwe diagrams if they exist
                        while (svg.current.firstChild) {
                            svg.current.removeChild(svg.current.lastChild);
                        }
                    }
                    svg.current.appendChild(diagram.getElementsByTagName("svg")[0])
                }
                if (downLoadingImgRef.current == true) {
                    downloadImage(diagram.getElementsByTagName("svg")[0])
                }
            })
        }
        else {
            if (svg.current) {
                if (svg.current.hasChildNodes()) {
                    // remove all othwe diagrams if they exist
                    while (svg.current.firstChild) {
                        svg.current.removeChild(svg.current.lastChild);
                    }
                }
                svg.current.appendChild(mapDiagram.image)
            }
        }

    }, [mapDiagram]);

    const transformMappingData = async (data) => {
        if (data.length == 0) {
            return []
        }
        const omopFields = {}
        const omopTables = {}
        const scanreportFields = {}
        const scanreportTables = {}
        data.map(item => {
            omopFields[item.destination_field.OmopField] = true
            omopTables[item.destination_table.OmopTable] = true

            scanreportFields[item.source_field.ScanReportField] = true
            scanreportTables[item.source_table.ScanReportTable] = true
        })

        const omopFieldsKeys = chunkIds(Object.keys(omopFields))
        const omopTablesKeys = chunkIds(Object.keys(omopTables))
        const scanreportFieldsKeys = chunkIds(Object.keys(scanreportFields))
        const scanreportTablesKeys = chunkIds(Object.keys(scanreportTables))


        const omopFieldsPromises = []
        const omopTablesPromises = []
        const scanreportFieldsPromises = []
        const scanreportTablesPromises = []

        for (let i = 0; i < omopFieldsKeys.length; i++) {
            omopFieldsPromises.push(useGet(`/omopfieldsfilter/?id__in=${omopFieldsKeys[i].join()}`))
        }
        for (let i = 0; i < omopTablesKeys.length; i++) {
            omopTablesPromises.push(useGet(`/omoptablesfilter/?id__in=${omopTablesKeys[i].join()}`))
        }
        for (let i = 0; i < scanreportFieldsKeys.length; i++) {
            scanreportFieldsPromises.push(useGet(`/scanreportfieldsfilter/?id__in=${scanreportFieldsKeys[i].join()}`))
        }
        for (let i = 0; i < scanreportTablesKeys.length; i++) {
            scanreportTablesPromises.push(useGet(`/scanreporttablesfilter/?id__in=${scanreportTablesKeys[i].join()}`))
        }
        const secondaryPromises = await Promise.all([Promise.all(omopFieldsPromises), Promise.all(omopTablesPromises), Promise.all(scanreportFieldsPromises), Promise.all(scanreportTablesPromises)])

        const omopFieldsLibrary = [].concat.apply([], secondaryPromises[0])
        const omopTablesLibrary = [].concat.apply([], secondaryPromises[1])
        const scanreportFieldsLibrary = [].concat.apply([], secondaryPromises[2])
        const scanreportTablesLibrary = [].concat.apply([], secondaryPromises[3])



        data.map(item => {
            item.omop_field = omopFieldsLibrary.find(value => value.id == item.destination_field.OmopField)
            item.omop_table = omopTablesLibrary.find(value => value.id == item.destination_table.OmopTable)
            item.scanreport_field = scanreportFieldsLibrary.find(value => value.id == item.source_field.ScanReportField)
            item.scanreport_table = scanreportTablesLibrary.find(value => value.id == item.source_table.ScanReportTable)
        })
        return data

    }

    window.onpopstate = function (event) {
        // run when the back button is pressed to change variable states accordingly
        popping.current = true
        let filter = window.location.href.split("mapping_rules/")
        if (filter.length !== 1 && filter[1] != "") {
            // set primary filter if there is one in the url
            filter = filter[1].split("/")
            setFilter(filter[0])
            if (filter[1]) {
                // set secondary filter if there is one in the url
                setSecondaryFilter(filter[1])
            }
            else {
                setSecondaryFilter("All")
            }
        }
        else {
            setFilter("All")
        }
    };
    const setInitialData = () => {
        // get all mapping rules for the page unfiltered
        transformMappingData(JSON.parse(window.mappings)).then(res => {
            allData.current = res
            switchFilter(3)
            // apply filters if any are set in the url
            let filter = window.location.href.split("mapping_rules/")
            if (filter.length !== 1 && filter[1] != "") {
                // set primary filter if there is one in the url
                filter = filter[1].split("/")
                setFilter(filter[0])
                if (filter[1]) {
                    // set secondary filter if there is one in the url
                    setSecondaryFilter(filter[1])
                }
            }
        })
    }
    // call refresh rules function from django then get new data
    const refreshRules = () => {
        setLoading(true)
        setLoadingMessage("Refreshing rules")
        window.refreshRules().then(res => {
            setLoadingMessage("Rules Refreshed. Getting Mapping Rules")
            window.location.reload(true)
        })
            .catch(error => {
                console.log(error)
            })
    }


    // change the data that is being displayed according to the currently set primary filter
    const switchFilter = (caller) => {
        let filteredData
        if (selectedFilter == "All") {
            filteredData = allData.current
            setSecondaryFilters([])
        }
        else {
            filteredData = allData.current.filter(value => value.omop_table.table == selectedFilter)
            let temp = filteredData.map(data => data.scanreport_table.name)
            temp = [...new Set(temp)]
            if (temp.length == 0) {
                setSecondaryFilters([])
            }
            else {
                setSecondaryFilters(["All", ...temp])
            }

        }
        if (secondaryFilter == "All") {
            setValues(filteredData)
            if (svg.current) {
                if (svg.current.hasChildNodes()) {
                    svg.current.removeChild(mapDiagram.image)
                }
            }

            setMapDiagram(mapDiagram => ({ ...mapDiagram, image: null }))
        }
        else {
            popping.current = true
            setSecondaryFilter("All")
        }
        setLoading(false)
        setLoadingMessage("")
    }

    const downloadImage = (img) => {
        setDownloadingImg(true)
        if (mapDiagram.image || img) {
            let svg
            if (img) { svg = img }
            else { svg = mapDiagram.image }
            // download the image then 
            window.downloadImage(svg).then(res => {
                setDownloadingImg(false)
                downLoadingImgRef.current = false
            })

        }
        else {
            downLoadingImgRef.current = true
        }
    }



    if (loading) {
        //Render Loading State
        return (
            <div>
                <Flex padding="30px">
                    <Spinner />
                    <Flex marginLeft="10px">{loadingMessage ? loadingMessage : "Loading Mapping rules"}</Flex>
                </Flex>
            </div>
        )
    }
    return (
        <div >
            <HStack my="10px">
                <Button variant="green" onClick={() => { refreshRules() }}>Refresh Rules</Button>
                <Button variant="blue" isLoading={isDownloading} loadingText="Downloading" spinnerPlacement="start" onClick={() => { window.downloadRules(setDownloading) }}>Download Mapping JSON</Button>
                <Button variant="yellow" onClick={() => { setMapDiagram(mapDiagram => ({ ...mapDiagram, showing: !mapDiagram.showing })) }}>{mapDiagram.showing ? "Hide " : "View "}Map Diagram</Button>
                <Button variant="red" isLoading={isDownloadingImg} loadingText="Downloading" spinnerPlacement="start" onClick={() => { downloadImage() }}>Download Map Diagram</Button>
            </HStack>
            <div>
                <VStack w='full'>
                    <Text fontWeight="bold">Filter on destination table</Text>
                    <SimpleGrid minChildWidth="170px" spacing="10px" w='full'>
                        {destinationFilters.map(filter => {
                            return <FilterTag key={filter.name} tagName={filter.name} handleClick={setFilter} selected={filter.name == selectedFilter} popping={popping} />
                        })}
                    </SimpleGrid>
                </VStack>
                {secondaryFilters.length > 0 &&
                    <VStack w='full'>
                        <Text fontWeight="bold">Filter on source table</Text>
                        <SimpleGrid minChildWidth="170px" spacing="10px" w='full'>
                            {secondaryFilters.map(filter => {
                                return <FilterTag key={filter} tagName={filter} handleClick={setSecondaryFilter} selected={filter == secondaryFilter} popping={popping} />
                            })}
                        </SimpleGrid>
                    </VStack>
                }
                {mapDiagram.showing &&
                    <>
                        <div style={{ marginTop: '10px', marginBottom: '10px' }} ref={svg} />
                        {values.length > 0 ?
                            <>
                                {mapDiagram.image == null &&
                                    <Flex padding="30px">
                                        <Spinner />
                                        <Flex marginLeft="10px">Loading Map Diagram</Flex>
                                    </Flex>
                                }
                            </>
                            :
                            <Flex padding="30px">
                                <Flex marginLeft="10px">No Diagram to load</Flex>
                            </Flex>
                        }
                    </>
                }

            </div>

            <Table variant="striped" colorScheme="greyBasic">
                <TableCaption></TableCaption>
                <Thead>
                    <Tr>
                        <Th>Rule ID</Th>
                        <Th>Destination Table</Th>
                        <Th>Destination Field</Th>
                        <Th>Source Table</Th>
                        <Th>Source Field</Th>
                        <Th>Term Map</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {values.length > 0 ?
                        // Create new row for every value object
                        values.map((item, index) =>
                            <Tr key={index}>
                                <Td maxW={[50, 100, 200]} >{item.rule_id} </Td>
                                <Td maxW={[50, 100, 200]} >{item.omop_table.table} </Td>
                                <Td maxW={[50, 100, 200]} >{item.omop_field.field}</Td>
                                <Td maxW={[50, 100, 200]} ><Link style={{ color: "#0000FF", }} href={window.u + "fields/?search=" + item.scanreport_table.id}>{item.scanreport_table.name}</Link></Td>
                                <Td maxW={[50, 100, 200]} ><Link style={{ color: "#0000FF", }} href={window.u + "values/?search=" + item.scanreport_field.id}>{item.scanreport_field.name}</Link></Td>
                                <Td maxW={[50, 100, 200]} >
                                    {item.term_mapping != null &&
                                        <>
                                            {typeof item.term_mapping == "object" ?
                                                <VStack>
                                                    <div><span style={{ color: "#dd5064", }}>"{Object.keys(item.term_mapping)[0]}"</span><ArrowForwardIcon /><span style={{ color: "#1d8459", }}>{item.term_mapping[Object.keys(item.term_mapping)[0]]}</span></div>
                                                </VStack>
                                                :
                                                JSON.stringify(item.term_mapping)
                                            }

                                        </>


                                    }
                                </Td>
                            </Tr>

                        )
                        :
                        <Flex padding="30px">
                            <Flex marginLeft="10px">Nothing</Flex>
                        </Flex>
                    }
                </Tbody>
            </Table>
        </div>
    );
}

export default MappingTbl;