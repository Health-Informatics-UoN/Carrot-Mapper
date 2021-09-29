import React, { useState, useEffect, useRef } from 'react'
import { Flex, Spinner, Table, Thead, Tbody, Tr, Th, Td, Spacer, TableCaption, Link, Button, HStack, Select, Text } from "@chakra-ui/react"
import { useGet, usePatch, api, chunkIds } from '../api/values'
import PageHeading from './PageHeading'
import ConceptTag from './ConceptTag'
import moment from 'moment';
import { ArrowRightIcon, ArrowLeftIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons'

const ScanReportTbl = (props) => {
    const active = useRef(true)
    const data = useRef(null);
    const activeReports = useRef(null);
    const archivedReports = useRef(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [displayedData, setDisplayedData] = useState(null);
    const [loadingMessage, setLoadingMessage] = useState("Loading Scan Reports")
    const [datapartnerFilter, setDataPartnerFilter] = useState("All");
    const [datasetFilter, setDatasetFilter] = useState("All");
    const [authorFilter, setAuthorFilter] = useState("All");
    const [title, setTitle] = useState("Scan Reports Active");
    const [expanded, setExpanded] = useState(false);
    useEffect(async () => {
        // run on initial page load
        props.setTitle(null)
        setCurrentUser(window.currentUser)
        window.location.search == '?filter=archived' ? active.current = false : active.current = true
        // get scan reports and sort by id
        let scanreports = await useGet(`/scanreports/`)
        scanreports = scanreports.sort((b, a) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0))
        // for each scan report use the data partner and author ids to get name to display
        const dataPartnerObject = {}
        const authorObject = {}
        scanreports.map(scanreport => {
            dataPartnerObject[scanreport.data_partner] = true
            authorObject[scanreport.author] = true
            const created_at = {}
            created_at.created_at = scanreport.created_at
            created_at.displayString = moment(scanreport.created_at.toString()).format('MMM. DD, YYYY, h:mm a')
            scanreport.created_at = created_at
        })
        const dataPartnerIds = chunkIds(Object.keys(dataPartnerObject))
        const authorIds = chunkIds(Object.keys(authorObject))
        const dataPartnerPromises = []
        const authorPromises = []
        for (let i = 0; i < dataPartnerIds.length; i++) {
            dataPartnerPromises.push(useGet(`/datapartners/?id__in=${dataPartnerIds[i].join()}`))
        }
        for (let i = 0; i < authorIds.length; i++) {
            authorPromises.push(useGet(`/usersfilter/?id__in=${authorIds[i].join()}`))
        }
        const promises = await Promise.all([Promise.all(dataPartnerPromises), Promise.all(authorPromises)])
        const dataPartners = [].concat.apply([], promises[0])
        const authors = [].concat.apply([], promises[1])

        dataPartners.forEach(element => {
            scanreports = scanreports.map(scanreport => scanreport.data_partner == element.id ? { ...scanreport, data_partner: element } : scanreport)
        })
        authors.forEach(element => {
            scanreports = scanreports.map(scanreport => scanreport.author == element.id ? { ...scanreport, author: element } : scanreport)
        })
        // split data into active reports and archived report
        data.current = scanreports
        activeReports.current = scanreports.filter(scanreport => scanreport.hidden == false)
        archivedReports.current = scanreports.filter(scanreport => scanreport.hidden == true)
        active.current ? setDisplayedData(activeReports.current) : setDisplayedData(archivedReports.current);
        active.current ? setTitle("Scan Reports Active") : setTitle("Scan Reports Archived");
        setLoadingMessage(null)
    }, []);

    // archive or unarchive a scanreport by sending patch request to change 'hidden' variable
    const activateOrArchiveReport = (id, theIndicator) => {
        setDisplayedData(currentData => currentData.map(scanreport => scanreport.id == id ? { ...scanreport, loading: true } : scanreport))
        data.current = data.current.map(scanreport => scanreport.id == id ? { ...scanreport, hidden: theIndicator } : scanreport)
        const patchData = { hidden: theIndicator }
        usePatch(`scanreports/${id}/`, patchData).then(res => {
            activeReports.current = data.current.filter(scanreport => scanreport.hidden == false)
            archivedReports.current = data.current.filter(scanreport => scanreport.hidden == true)
            active.current ? setDisplayedData(activeReports.current) : setDisplayedData(archivedReports.current)
        })
    }
    // show active scan reports and change url when 'Active Reports' button is pressed
    const goToActive = () => {
        if (active.current == false) {
            active.current = true
            setDisplayedData(activeReports.current)
            window.history.pushState({}, '', '/scanreports/')
            setTitle("Scan Reports Active")
        }
    }
    // show archived scan reports and change url when 'Archived Reports' button is pressed
    const goToArchived = () => {
        if (active.current == true) {
            active.current = false
            setDisplayedData(archivedReports.current)
            window.history.pushState({}, '', '/scanreports/?filter=archived')
            setTitle("Scan Reports Archived");
        }

    }
    // apply currently set filters to data before displaying
    const applyFilters = (variable) => {
        let newData = variable.map(scanreport => scanreport)
        if (authorFilter != "All") {
            newData = newData.filter(scanreport => scanreport.author.username == authorFilter)
        }
        if (datapartnerFilter != "All") {
            newData = newData.filter(scanreport => scanreport.data_partner.name == datapartnerFilter)
        }
        if (datasetFilter != "All") {
            newData = newData.filter(scanreport => scanreport.dataset == datasetFilter)
        }
        return newData
    }

    const removeFilter = (a, b) => {
        if (a.includes("Added By")) {
            setAuthorFilter("All")
        }
        if (a.includes("Dataset")) {
            setDatasetFilter("All")
        }
        if (a.includes("Data Partner")) {
            setDataPartnerFilter("All")
        }
    }
    // when the back button is pressed, display correct data depending on url
    window.onpopstate = function (event) {
        window.location.search == '?filter=archived' ? active.current = false : active.current = true
        active.current ? setDisplayedData(activeReports.current) : setDisplayedData(archivedReports.current);
        active.current ? setTitle("Scan Reports Active") : setTitle("Scan Reports Archived");
    };
    if (loadingMessage) {
        //Render Loading State
        return (
            <div>
                <Flex padding="30px">
                    <Spinner />
                    <Flex marginLeft="10px">{loadingMessage}</Flex>
                </Flex>
            </div>
        )
    }
    return (
        <div>
            <Flex>
                <PageHeading text={title} />
                <Spacer />
                <Button variant="blue" mr="10px" onClick={goToActive}>Active Reports</Button>
                <Button variant="blue" onClick={goToArchived}>Archived Reports</Button>
            </Flex>
            <Link href="/scanreports/create/"><Button variant="blue" my="10px">New Scan Report</Button></Link>
            <HStack>
                <Text style={{ fontWeight: "bold" }}>Applied Filters: </Text>
                {[{ title: "Data Partner -", filter: datapartnerFilter }, { title: "Dataset -", filter: datasetFilter }, { title: "Added By -", filter: authorFilter }].map(filter => {
                    if (filter.filter == "All") {
                        return null
                    }
                    else {
                        return (
                            <ConceptTag key={filter.title} conceptName={filter.filter} conceptId={filter.title} conceptIdentifier={filter.title} itemId={filter.title} handleDelete={removeFilter} />
                        )
                    }
                })}
            </HStack>
            <Table w="100%" variant={expanded ? "" : "striped"} colorScheme="greyBasic">
                <TableCaption></TableCaption>
                <Thead>
                    <Tr className={expanded ? "largeTbl" : ""}>
                        <Th style={{ fontSize: "16px" }}>ID</Th>
                        <Th>
                            <Select minW="130px" style={{ fontWeight: "bold" }} variant="unstyled" value="Data Partner" readOnly onChange={(option) => setDataPartnerFilter(option.target.value)}>
                                <option style={{ fontWeight: "bold" }} disabled>Data Partner</option>
                                <>
                                    {[...[...new Set(displayedData.map(data => data.data_partner.name))]].sort((a, b) => a.localeCompare(b))
                                        .map((item, index) =>
                                            <option key={index} value={item}>{item}</option>
                                        )}
                                </>
                            </Select>
                        </Th>
                        <Th><Select minW="90px" style={{ fontWeight: "bold" }} variant="unstyled" value="Dataset" readOnly onChange={(option) => setDatasetFilter(option.target.value)}>
                            <option style={{ fontWeight: "bold" }} disabled>Dataset</option>
                            {[...[...new Set(displayedData.map(data => data.dataset))]].sort((a, b) => a.localeCompare(b))
                                .map((item, index) =>
                                    <option key={index} value={item}>{item}</option>
                                )}
                        </Select></Th>
                        <Th >
                            <Select minW="110px" style={{ fontWeight: "bold" }} variant="unstyled" value="Added by" readOnly onChange={(option) => setAuthorFilter(option.target.value)}>
                                <option style={{ fontWeight: "bold" }} disabled>Added by</option>
                                {[...[...new Set(displayedData.map(data => data.author.username))]].sort((a, b) => a.localeCompare(b))
                                    .map((item, index) =>
                                        <option key={index} value={item}>{item}</option>
                                    )}
                            </Select>
                        </Th>
                        <Th style={{ fontSize: "16px", textTransform: "none" }}>Date</Th>
                        <Th></Th>
                        <Th p="0" style={{ fontSize: "16px", textTransform: "none" }} >
                            <HStack>
                                <Text mr="10px">Archive</Text>
                                {!expanded && <ArrowRightIcon  style={{ marginLeft: "auto" }} _hover={{ color: "blue.500", }} onClick={() => setExpanded(true)} />}
                            </HStack>
                        </Th>
                        {expanded &&
                            <>
                                <Th style={{ fontSize: "16px", textTransform: "none" }}>Number Fields</Th>
                                <Th p="0" style={{ fontSize: "16px", textTransform: "none" }} >
                                    <HStack>
                                        <Text>Number of tables</Text>
                                        {expanded && <ArrowLeftIcon ml="auto" _hover={{ color: "blue.500", }} onClick={() => setExpanded(false)} />}
                                    </HStack>
                                </Th>
                            </>
                        }
                    </Tr>
                </Thead>
                <Tbody>
                    {applyFilters(displayedData).length > 0 &&
                        // Create new row for every value object
                        applyFilters(displayedData).map((item, index) =>
                            <Tr className={expanded ? "largeTbl" : ""} key={index}>
                                <Td><Link style={{ color: "#0000FF", }} href={"/tables/?search=" + item.id}>{item.id}</Link></Td>
                                <Td><Link style={{ color: "#0000FF", }} href={"/tables/?search=" + item.id}>{item.data_partner.name}</Link></Td>
                                <Td><Link style={{ color: "#0000FF", }} href={"/tables/?search=" + item.id}>{item.dataset}</Link></Td>
                                <Td>{item.author.username}</Td>
                                <Td minW="230px">{item.created_at.displayString}</Td>
                                <Td>
                                    <HStack>
                                        <Link href={"/scanreports/" + item.id + "/mapping_rules/"}><Button variant="blue">Rules</Button></Link>
                                        <Link href={"/scanreports/" + item.id + "/assertions/"}><Button variant="green">Assertions</Button></Link>
                                    </HStack>
                                </Td>
                                <Td>
                                    {currentUser &&
                                        <>
                                            {currentUser == item.author.username &&
                                                <>
                                                    {item.hidden ?
                                                        <>
                                                            {item.loading ?
                                                                <Spinner />
                                                                :
                                                                <ViewOffIcon _hover={{ color: "blue" }} onClick={() => activateOrArchiveReport(item.id, false)} />
                                                            }
                                                        </>
                                                        :
                                                        <>
                                                            {item.loading ?
                                                                <Spinner />
                                                                :
                                                                <ViewIcon _hover={{ color: "blue" }} onClick={() => activateOrArchiveReport(item.id, true)} />
                                                            }
                                                        </>
                                                    }
                                                </>
                                            }
                                        </>
                                    }
                                </Td>
                                {expanded &&
                                    <>
                                        <Td>4343</Td>
                                        <Td>54454</Td>
                                    </>
                                }
                            </Tr>

                        )
                    }
                </Tbody>
            </Table>
            {applyFilters(displayedData).length == 0 &&
                <Flex marginLeft="10px">No Scan Reports available</Flex>
            }
        </div>
    );
}

export default ScanReportTbl;