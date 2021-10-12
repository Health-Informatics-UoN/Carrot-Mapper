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
} from "@chakra-ui/react"

import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { useGet, chunkIds } from '../api/values'
import Plot from 'react-plotly.js';

const Home = () => {
    const statusesRef = useRef(JSON.parse(window.status).map((status) => status.id).map(item => ({ id: item, expanded: false, data: [] })));
    const scanreportsRef = useRef(null);
    const [statuses, setStatuses] = useState(statusesRef.current);
    const [loading, setLoading] = useState(true);
    const [countStats, setCountStats] = useState(null);
    const [scanreportDonutData, setScanreportDonutData] = useState(null);

    useEffect(async () => {
        useGet(`/countstats`).then(res => {
            console.log(res)
            setCountStats(res)
        })

        let scanreports = await useGet(`/scanreports/`)
        scanreports = scanreports.sort((b, a) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0))

        const dataPartnerObject = {}
        scanreports.map(scanreport => {
            dataPartnerObject[scanreport.data_partner] = true
        })
        const dataPartnerIds = chunkIds(Object.keys(dataPartnerObject))
        const dataPartnerPromises = []
        for (let i = 0; i < dataPartnerIds.length; i++) {
            dataPartnerPromises.push(useGet(`/datapartners/?id__in=${dataPartnerIds[i].join()}`))
        }
        let dataPartners = await Promise.all(dataPartnerPromises)
        dataPartners = [].concat.apply([], dataPartners)
        dataPartners.forEach(element => {
            scanreports = scanreports.map(scanreport => scanreport.data_partner == element.id ? { ...scanreport, data_partner: element } : scanreport)
        })
        scanreportsRef.current = scanreports
        setDonutData(scanreportsRef.current)
        statusesRef.current = statusesRef.current.map(status => ({ ...status, data: scanreports.filter(report => report.status == status.id) }))
        setStatuses(statusesRef.current)
        setLoading(false)
    }, []);


    const expandStatus = (id, expand) => {
        statusesRef.current = statusesRef.current.map(status => status.id == id ? ({ ...status, expanded: expand }) : status)
        setStatuses(statusesRef.current)
    }

    const setDonutData = (scanreport_data) => {
        let data = {
            values: [],
            labels: [],
            type: 'pie',
            hole: .3,
            title: "Data Partners"
        }
        data.labels = [...new Set(scanreport_data.map(data => data.data_partner.name))].sort((a, b) => a.localeCompare(b))

        data.labels.map(label => {
            const values = scanreport_data.filter(report => report.data_partner.name == label)
            data.values.push(values.length)
        })
        setScanreportDonutData([data])
    }

    const mapStatus = (status) => {
        return JSON.parse(window.status).find((item) => item.id == status).label;
    };

    if (loading == true) {
        return (
            <Flex padding="30px">
                <Spinner />
                <Flex marginLeft="10px">Loading Dashboard</Flex>
            </Flex>
        )
    }

    return (
        <VStack >
            <HStack>
                <Table w="auto" variant="striped" colorScheme="greyBasic" >
                    <TableCaption placement="top">Scan Report Stats</TableCaption>
                    <Thead>
                        <Tr>
                            <Th>Scanreports</Th>
                            <Th>Tables</Th>
                            <Th>Fields</Th>
                            <Th>Values</Th>
                        </Tr>
                    </Thead>

                    <Tbody>
                        <Tr >
                            <Td>{countStats.scanreport_count}</Td>
                            <Td>{countStats.scanreporttable_count}</Td>
                            <Td>{countStats.scanreportfield_count}</Td>
                            <Td>{countStats.scanreportvalue_count}</Td>
                        </Tr>
                    </Tbody>

                </Table>

                {scanreportDonutData &&
                    <Plot
                        data={scanreportDonutData}
                        layout={{/* width: 320, height: 240, */ title: 'Data Partners' }}
                    />
                }
            </HStack>


            <Table variant="striped" colorScheme="greyBasic" >
                <TableCaption placement="top">Scan Report Stats Grouped by status</TableCaption>
                <Thead>
                    <Tr>
                        <Th>Status</Th>
                        <Th>Scanreports</Th>
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
                                            <TableCaption placement="top">Scan reports with status {item.id}</TableCaption>
                                            <Thead>
                                                <Tr>
                                                    <Th>ID</Th>
                                                    <Th>Datapartner</Th>
                                                    <Th>Dataset</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {item.data.map((value, i) =>
                                                    <Tr key={i}>
                                                        <Td><Link style={{ color: "#0000FF", }} href={"/tables/?search=" + value.id}>{value.id}</Link></Td>
                                                        <Td><Link style={{ color: "#0000FF", }} href={"/tables/?search=" + value.id}>{value.dataset}</Link></Td>
                                                        <Td><Link style={{ color: "#0000FF", }} href={"/tables/?search=" + value.id}>{value.data_partner.name}</Link></Td>
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