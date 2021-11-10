import React, { useState, useEffect, useRef } from 'react'
import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableCaption,
    HStack,
    VStack,
    Flex,
    Spinner,
    Link,
    Select,
    Button
} from "@chakra-ui/react"

import { ArrowForwardIcon } from '@chakra-ui/icons'
import { useGet } from '../api/values'
import ConceptTag from './ConceptTag'



const MappingTbl = () => {
    const scan_report_id = window.location.href.split("scanreports/")[1].split("/")[0]
    const [values, setValues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(undefined);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [mapDiagram, setMapDiagram] = useState({ showing: false, image: null });
    const svg = useRef(null);
    const [destinationTableFilter, setDestinationTableFilter] = useState([]);
    const [sourceTableFilter, setSourceTableFilter] = useState([]);
    const [filters, setFilters] = useState([]);
    const [isDownloading, setDownloading] = useState(false);
    const [isDownloadingImg, setDownloadingImg] = useState(false);
    const downLoadingImgRef = useRef(false)

    useEffect(() => {
        // on initial load of the page,
        // get all mapping rules for the page unfiltered
        useGet(`/mappingruleslist/?id=${scan_report_id}`).then(res => { // not sure if this needs a / on the end or not as it's an undocumented endpoint
            setValues(res[0].sort((a, b) => (a.rule_id > b.rule_id) ? 1 : ((b.rule_id > a.rule_id) ? -1 : 0)))
            setLoading(false);
            setLoadingMessage("");
        })
            .catch(err => {
                setLoading(false);
                setLoadingMessage("");
                setError("An error has occured while fetching the rules")
            })
    }, []);

    useEffect(() => {
        // run when map diagram state has changed
        if (!mapDiagram.image) {
            // if no map diagram is loaded, request to get a new one
            window.getSVG().then(diagram => {
                setMapDiagram(mapDiagram => ({ ...mapDiagram, image: diagram.getElementsByTagName("svg")[0] }))
                if (svg.current) {
                    if (svg.current.hasChildNodes()) {
                        // remove all other diagrams if they exist
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
                    // remove all other diagrams if they exist
                    while (svg.current.firstChild) {
                        svg.current.removeChild(svg.current.lastChild);
                    }
                }
                svg.current.appendChild(mapDiagram.image)
            }
        }
    }, [mapDiagram]);


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
    // download map diagram
    const downloadImage = (img) => {
        setDownloadingImg(true)
        // if the image has been loaded then download it, otherwise, wait until image has been loaded
        // then call the function again
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
            // used to check if the image is waiting to be downloaded when the image is retrieved
            downLoadingImgRef.current = true
        }
    }
    // remove the map diagram from html
    const removeDiagram = () => {
        if (svg.current) {
            if (svg.current.hasChildNodes()) {
                svg.current.removeChild(mapDiagram.image)
            }
        }
        setMapDiagram(mapDiagram => ({ ...mapDiagram, image: null }))
    }

    // apply destination table and source table filters to data
    const applyFilters = (variable) => {
        let newData = variable.map((scanreport) => scanreport);
        if (destinationTableFilter.length > 0) {
            newData = newData.filter((rule) => destinationTableFilter.includes(rule.destination_table.name));
        }
        if (sourceTableFilter.length > 0) {
            newData = newData.filter((rule) => sourceTableFilter.includes(rule.source_table.name));
        }
        return newData;
    };

    // if filter does not already exist, create a new destination table filter
    // and get a new map diagram
    const setDestinationFilter = (value) => {
        if (filters.find(filter => filter.name == value) == null) {
            setFilters(current => [...current, { title: "Destination Table:", name: value }])
            setDestinationTableFilter(current => [...current, value])
            //removeDiagram()
        }
    };
    // if filter does not already exist, create a new source table filter
    // and get a new map diagram
    const setSourceFilter = (value) => {
        if (filters.find(filter => filter.name == value) == null) {
            setFilters(current => [...current, { title: "Source Table:", name: value }])
            setSourceTableFilter(current => [...current, value])
            //removeDiagram()
        }

    };
    // remove a filter. Called inside concept tag
    const removeFilter = (title, name) => {
        setFilters(current => current.filter(filter => filter.name != name || filter.title != title))
        //removeDiagram()
        if (title.includes("Destination Table")) {
            setDestinationTableFilter(current => current.filter(filter => filter != name))
        }
        if (title.includes("Source Table")) {
            setSourceTableFilter(current => current.filter(filter => filter != name))
        }
    };

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
            <div style={{ display: "flex", flexWrap: "wrap" }}>
                <div style={{ fontWeight: "bold", marginRight: "10px" }} >Filters: </div>
                {filters.map((filter, index) => {
                    return (
                        <div style={{ marginTop: "10px" }}>
                            <ConceptTag key={index} conceptName={filter.name} conceptId={filter.title} conceptIdentifier={filter.name} itemId={filter.title} handleDelete={removeFilter} />
                        </div>
                    )
                })}
            </div>
            <div>
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
            {error ?
                <div>{error}</div>
                :
                <Table variant="striped" colorScheme="greyBasic">
                    <TableCaption></TableCaption>
                    <Thead>
                        <Tr>
                            <Th>Rule ID</Th>
                            <Th>
                                <Select minW="130px" style={{ fontWeight: "bold" }} variant="unstyled" value="Destination Table" readOnly onChange={(option) => setDestinationFilter(option.target.value)}>
                                    <option style={{ fontWeight: "bold" }} disabled>Destination Table</option>
                                    <>
                                        {[...[...new Set(values.map(data => data.destination_table.name))]].sort((a, b) => a.localeCompare(b))
                                            .map((item, index) =>
                                                <option key={index} value={item}>{item}</option>
                                            )}
                                    </>
                                </Select>
                            </Th>
                            <Th>Destination Field</Th>
                            <Th>
                                <Select minW="130px" style={{ fontWeight: "bold" }} variant="unstyled" value="Source Table" readOnly onChange={(option) => setSourceFilter(option.target.value)}>
                                    <option style={{ fontWeight: "bold" }} disabled>Source Table</option>
                                    <>
                                        {[...[...new Set(values.map(data => data.source_table.name))]].sort((a, b) => a.localeCompare(b))
                                            .map((item, index) =>
                                                <option key={index} value={item}>{item}</option>
                                            )}
                                    </>
                                </Select>
                            </Th>
                            <Th>Source Field</Th>
                            <Th>Term Map</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {applyFilters(values).length > 0 ?
                            // Create new row for every value object
                            applyFilters(values).map((item, index) =>
                                <Tr key={index}>
                                    <Td maxW={[50, 100, 200]} >{item.rule_id} </Td>
                                    <Td maxW={[50, 100, 200]} >{item.destination_table.name} </Td>
                                    <Td maxW={[50, 100, 200]} >{item.destination_field.name}</Td>
                                    <Td maxW={[50, 100, 200]} ><Link style={{ color: "#0000FF", }} href={window.u + "fields/?search=" + item.source_table.id}>{item.source_table.name}</Link></Td>
                                    <Td maxW={[50, 100, 200]} ><Link style={{ color: "#0000FF", }} href={window.u + "values/?search=" + item.source_field.id}>{item.source_field.name}</Link></Td>
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
            }
        </div>
    );
}

export default MappingTbl;