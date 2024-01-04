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
    Button,
    Spacer,
    Stack,
    Container
} from "@chakra-ui/react"

import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { useGet, chunkIds } from '../api/values'
import Plot from 'react-plotly.js';



const Home = () => {
    // get list of statuses from django app and use them to create a list of objects to be displayed in the status table
    const statusesRef = useRef(JSON.parse(window.status).map((status) => status.id).map(item => ({ id: item, expanded: false, data: [] })));
    const scanreportsRef = useRef(null);
    const [statuses, setStatuses] = useState(statusesRef.current);
    const [loading, setLoading] = useState(true);
    const [countStats, setCountStats] = useState(null);
    const [scanreportDonutData, setScanreportDonutData] = useState(null);
    const [mappingrulesDonutData, setmappingrulesDonutData] = useState(null);
    const [filter, setFilter] = useState(null);
    const [timeline, setTimeline] = useState({ day: "counting", week: "counting", month: "counting", three_months: "counting", year: "counting", });
    useEffect(async () => {
        // run every time filter is changed to (active,archived, or all reports)
        if (filter) {
            let filteredReports;
            let filteredStatuses;
            let generatedCountStats;
            // filter scanreports depending on what filter is applied
            if (filter == "All") {
                filteredReports = scanreportsRef.current
            }
            if (filter == "Active") {
                filteredReports = scanreportsRef.current.filter(scanreport => scanreport.hidden == false)
            }
            if (filter == "Archived") {
                filteredReports = scanreportsRef.current.filter(scanreport => scanreport.hidden == true)
            }
            // map scan reports to their statuses
            filteredStatuses = statusesRef.current.map(status => ({ ...status, data: filteredReports.filter(report => report.status == status.id) }))
            // get current timestamp and use it to get the timestamp of different times by subtracting a certain amount of time
            const ts = Math.round(new Date().getTime() / 1000);
            const ts_24_hours_ago = ts - (24 * 3600);
            const ts_week_ago = ts - (7 * 24 * 3600);
            const ts_month_ago = ts - (30 * 24 * 3600);
            const ts_3_month_ago = ts - (90 * 24 * 3600);
            const ts_year_ago = ts - (365 * 24 * 3600);
            // use timestamps to make lists of scan reports created after those timestamps
            const last_24_hours = filteredReports.filter(report => Math.round(new Date(report.created_at).getTime() / 1000) >= ts_24_hours_ago)
            const last_week = filteredReports.filter(report => Math.round(new Date(report.created_at).getTime() / 1000) >= ts_week_ago)
            const last_month = filteredReports.filter(report => Math.round(new Date(report.created_at).getTime() / 1000) >= ts_month_ago)
            const last_3_month = filteredReports.filter(report => Math.round(new Date(report.created_at).getTime() / 1000) >= ts_3_month_ago)
            const last_year = filteredReports.filter(report => Math.round(new Date(report.created_at).getTime() / 1000) >= ts_year_ago)
            // count each list to get the number of scanreports created within a certain time
            const timeline =
            {
                day: last_24_hours.length,
                week: last_week.length,
                month: last_month.length,
                three_months: last_3_month.length,
                year: last_year.length,
            }

            // generate count stats of filtered data by adding up the count stats of the scan reports in the filtered list
            generatedCountStats =
            {
                scanreport_count: "Disabled", //filteredReports.length,
                scanreporttable_count: "Disabled", //filteredReports.map(report => report.scanreporttable_count).reduce((a, b) => { return a + b; }, 0),
                scanreportfield_count: "Disabled", //filteredReports.map(report => report.scanreportfield_count).reduce((a, b) => { return a + b; }, 0),
                scanreportvalue_count: "Disabled", //filteredReports.map(report => report.scanreportvalue_count).reduce((a, b) => { return a + b; }, 0),
                scanreportmappingrule_count: "Disabled", //filteredReports.map(report => report.scanreportmappingrule_count).reduce((a, b) => { return a + b; }, 0),
            }
            // set the state of the data to be used in the donuts and tables
            setDonutData(filteredReports)
            // setMappingDonutData(filteredReports)
            setStatuses(filteredStatuses)
            setCountStats(generatedCountStats)
            setTimeline(timeline)
        }
    }, [filter])

    useEffect(async () => {
        // called on initial page load
        // get scan reports from endpoint
        let scanreports = await useGet(`/scanreports/`)
        if (scanreports.length > 0) {
            // sort scan reports
            scanreports = scanreports.sort((b, a) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0))
            // create a list of unique datapartners and make a batch query to get their data
            const datasetObject = {}
            scanreports.map(scanreport => {
                datasetObject[scanreport.parent_dataset] = true
            })
            const datasetIds = chunkIds(Object.keys(datasetObject))
            const datasetPromises = []
            for (let i = 0; i < datasetIds.length; i++) {
                datasetPromises.push(useGet(`/datasets/?id__in=${datasetIds[i].join()}`))
            }
            let datasets = await Promise.all(datasetPromises)
            datasets = [].concat.apply([], datasets)
            datasets.forEach((element) => {
                scanreports = scanreports.map((scanreport) => scanreport.parent_dataset == element.id ? { ...scanreport, parent_dataset: element } : scanreport)
            })
            const dataPartnerObject = {}
            datasets.map((dataset) => {
                dataPartnerObject[dataset.data_partner] = true
            })
            const dataPartnerIds = chunkIds(Object.keys(dataPartnerObject))
            const dataPartnerPromises = []
            for (let i = 0; i < dataPartnerIds.length; i++) {
                dataPartnerPromises.push(useGet(`/datapartners/?id__in=${dataPartnerIds[i].join()}`))
            }
            let dataPartners = await Promise.all(dataPartnerPromises)
            dataPartners = dataPartners[0]
            dataPartners.forEach((element) => {
                scanreports = scanreports.map((scanreport) => scanreport.parent_dataset.data_partner == element.id ? { ...scanreport, data_partner: element } : scanreport)
            })
        }
        // create a list of scan report id's and batch query their count stats
        const scanreportIds = chunkIds(scanreports.map(scanreport => scanreport.id))
        const countPromises = []
        for (let i = 0; i < scanreportIds.length; i++) {
            countPromises.push(useGet(`/countstatsscanreport/?scan_report=${scanreportIds[i].join()}`))
        }
        const countStats = [].concat.apply([], await Promise.all(countPromises))
        scanreports = scanreports.map(report => ({ ...report, ...countStats.find(item => item.scanreport == report.id) }))

        scanreportsRef.current = scanreports
        // set default filter to active
        setFilter("Active")

        setLoading(false)
    }, []);


    const expandStatus = (id, expand) => {
        // expand or minimize a status in the status table setting it's 'expanded' variable to true or false
        setStatuses(stat => stat.map(status => status.id == id ? ({ ...status, expanded: expand }) : status))
    }

    const setDonutData = (scanreport_data) => {
        // format data in an acceptable form for plotly to create donut chart
        let data = {
            values: [],
            labels: [],
            marker: {
                colors: null
            },
            type: 'pie',
            textinfo: "value",
            hole: .3,
            title: "Data Partners"
        }
        // create an ordered list of unique data partner names
        data.labels = [...new Set(scanreport_data.map(data => data.data_partner.name))].sort((a, b) => a.localeCompare(b))
        // for each data partner, count the number of scan reports and add it to values
        data.labels.map(label => {
            const values = scanreport_data.filter(report => report.data_partner.name == label)
            data.values.push(values.length)
        })
        data.marker.colors = data.labels.map(label => stringToColour(label))
        setScanreportDonutData([data])
    }

    const setMappingDonutData = (scanreport_data) => {
        // format data in an acceptable form for plotly to create donut chart
        let data = {
            values: [],
            labels: [],
            marker: {
                colors: null
            },
            textinfo: "value",
            type: 'pie',
            hole: .3,
            title: "Data Partners"
        }
        // create an ordered list of unique data partner names
        data.labels = [...new Set(scanreport_data.map(data => data.data_partner.name))].sort((a, b) => a.localeCompare(b))
        // for each data partner, add up the number of mapping rules for every related scan report and add the total to values
        data.labels.map(label => {
            const values = scanreport_data.filter(report => report.data_partner.name == label)
            const mapArray = values.map(value => value.scanreportmappingrule_count)
            const sum = mapArray.reduce((a, b) => { return a + b; }, 0)
            data.values.push(sum)
        })
        data.marker.colors = data.labels.map(label => stringToColour(label))
        setmappingrulesDonutData([data])
    }

    const mapStatus = (status) => {
        // get the list of statuses from django app and find the label of the status with a specific name
        return JSON.parse(window.status).find((item) => item.id == status).label;
    };

    const getGraphData = () => {
        const stat = JSON.parse(window.status)
        const data = []
        const dataPartners = [...new Set(scanreportsRef.current.map(data => data.data_partner.name))].sort((a, b) => a.localeCompare(b))
        dataPartners.map(item => {
            data.push(
                {
                    x: stat.map((status) => status.label),
                    y: stat.map((status) => statuses.find(sta => status.id == sta.id)
                        .data.filter(report => report.data_partner.name == item).length),
                    type: "bar",
                    name: item,
                    xaxis: 'x1',
                    barmode: 'stack',
                    marker: { color: stringToColour(item) }
                }
            )
        })
        const layout = {
            barmode: "stack",
            xaxis: {
                anchor: 'x1',
                title: 'Statuses'
            },
            title: 'Data Partners in Statuses'
        }
        return { data, layout }
    }
    // takes in a string and returns a hexadecimal colour generated with that string as seed
    var stringToColour = function (str) {
        // if it is a known string we can specify what colour we want it to return
        // otherwise we can just return the generated colour
        switch (str) {
            case "University of Liverpool":
                return '#30bb87'
            case "University of Edinburgh":
                return '#e07a5f'
            case "University of Dundee":
                return '#6079D3'
            case "University of Swansea":
                return '#fab765'
            case "University of Cambridge":
                return '#F7A399'
            case "University of Bristol":
                return '#04724d'
            case "University College London":
                return '#D67197'
            case "University of Nottingham":
                return '#005597'
            case "Public Health Agency (NI)":
                return '#CE4257'
            case "Public Health Scotland":
                return '#ffec75'
            case "Public Health England":
                return '#e8615a'
            case "Oxford University Hospitals":
                return '#720026'
            case "Office National Statistics":
                return '#FFBF69'
            case "NHS Digital":
                return '#f2cc8f'
            case "Imperial":
                return '#D4EFFC'
            case "NHS England":
                return '#7fadce'
            case "NHS GOSH":
                return '#62bcb1'
            default:
                var hash = 0;
                for (var i = 0; i < str.length; i++) {
                    hash = str.charCodeAt(i) + ((hash << 5) - hash);
                }
                var colour = '#';
                for (var i = 0; i < 3; i++) {
                    var value = (hash >> (i * 8)) & 0xFF;
                    colour += ('00' + value.toString(16)).substr(-2);
                }
                return colour;
        }
    }

    if (loading == true) {
        return (
            <Flex padding="30px">
                <Spinner />
                <Flex marginLeft="10px">Loading Dashboard</Flex>
            </Flex>
        )
    }

    return (
        <VStack w="100%">
            <VStack w="100%">
                <HStack>
                    <Button variant={filter == "All" ? "green" : "blue"} onClick={() => { setFilter("All") }}>All Reports</Button>
                    <Button variant={filter == "Active" ? "green" : "blue"} ml="10px" onClick={() => { setFilter("Active") }}>Active Reports</Button>
                    <Button variant={filter == "Archived" ? "green" : "blue"} ml="10px" onClick={() => { setFilter("Archived") }}>Archived Reports</Button>
                </HStack>
                <HStack>
                    <Table w="auto" variant="unstyled" colorScheme="greyBasic" border="1px solid black" >
                        <TableCaption placement="top">Scan Report Stats (All Time)</TableCaption>
                        <Tr>
                            <Th>Scan Reports</Th>
                            <Td>{countStats.scanreport_count}</Td>
                        </Tr>
                        <Tr>
                            <Th>Tables</Th>
                            <Td>{countStats.scanreporttable_count}</Td>
                        </Tr>
                        <Tr>
                            <Th>Fields</Th>
                            <Td>{countStats.scanreportfield_count}</Td>
                        </Tr>
                        <Tr>
                            <Th>Values</Th>
                            <Td>{countStats.scanreportvalue_count}</Td>
                        </Tr>
                        <Tr>
                            <Th>Mapping Rules</Th>
                            <Td>{countStats.scanreportmappingrule_count}</Td>
                        </Tr>
                    </Table>

                    <Table w="auto" variant="unstyled" colorScheme="greyBasic" border="1px solid black" >
                        <TableCaption placement="top">New Scan Reports Uploaded</TableCaption>
                        <Tr>
                            <Th>in the last 24h</Th>
                            <Td>{timeline.day}</Td>
                        </Tr>
                        <Tr>
                            <Th>in the 7 days</Th>
                            <Td>{timeline.week}</Td>
                        </Tr>
                        <Tr>
                            <Th>in the last 30 days</Th>
                            <Td>{timeline.month}</Td>
                        </Tr>
                        <Tr>
                            <Th>in the last 90 days</Th>
                            <Td>{timeline.three_months}</Td>
                        </Tr>
                        <Tr>
                            <Th>in the last 365 days</Th>
                            <Td>{timeline.year}</Td>
                        </Tr>

                    </Table>

                </HStack>
                <Stack direction={["column", "column", "column", "row"]} style={{ width: "100%" }}>
                    {scanreportDonutData &&
                        <Container w={["100%", "100%", "100%", "50%"]}>
                            <Plot
                                data={scanreportDonutData}
                                layout={{ autosize: true, title: 'Scan Reports by Data Partner' }}
                                textinfo="text"
                                useResizeHandler={true}
                                style={{ width: "100%", height: "auto" }}
                            />
                        </Container>
                    }

                    {/* {mappingrulesDonutData &&
                        <Container w={["100%", "100%", "100%", "50%"]}>
                            <Plot
                                data={mappingrulesDonutData}
                                layout={{ autosize: true, title: 'Mapping Rules by Data Partner' }}
                                useResizeHandler={true}
                                style={{ width: "100%", height: "auto" }}
                            />
                        </Container>
                    } */}
                </Stack>
            </VStack>

            <Plot
                data={getGraphData().data}
                layout={getGraphData().layout}
                useResizeHandler={true}
                style={{ width: "100%", height: "auto" }}
            />


            <Table variant="striped" colorScheme="greyBasic" >
                <TableCaption placement="top">Scan Reports by status</TableCaption>
                <Thead>
                    <Tr>
                        <Th>Status</Th>
                        <Th>Scan Reports</Th>
                        <Th></Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {statuses.map((item, index) =>
                        <>
                            <Tr key={index}>
                                <Td>{mapStatus(item.id)}</Td>
                                <Td>{item.data.length}</Td>
                                <Td>{item.expanded ? <ChevronUpIcon _hover={{ color: "blue.500", }} onClick={() => expandStatus(item.id, false)} /> : <ChevronDownIcon _hover={{ color: "blue.500", }} onClick={() => expandStatus(item.id, true)} />}</Td>
                            </Tr >
                            {item.expanded && (
                                <Tr key={item.id}>
                                    <Td colSpan="3" >
                                        <Table variant="striped" colorScheme="greyBasic" >
                                            <TableCaption placement="top">Scan Reports with status {mapStatus(item.id)}</TableCaption>
                                            <Thead>
                                                <Tr>
                                                    <Th>ID</Th>
                                                    <Th>Scan Report</Th>
                                                    <Th>Data Partner</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {item.data.map((value, i) =>
                                                    <Tr key={i}>
                                                        <Td><Link style={{ color: "#0000FF", }} href={`/scanreports/${value.id}/`}>{value.id}</Link></Td>
                                                        <Td><Link style={{ color: "#0000FF", }} href={`/scanreports/${value.id}/`}>{value.dataset}</Link></Td>
                                                        <Td><Link style={{ color: "#0000FF", }} href={`/scanreports/${value.id}/`}>{value.data_partner.name}</Link></Td>
                                                    </Tr>
                                                )}
                                            </Tbody>
                                        </Table>

                                    </Td>
                                </Tr>
                            )}
                        </>

                    )}


                </Tbody>
            </Table>

        </VStack>
    );
}

export default Home;