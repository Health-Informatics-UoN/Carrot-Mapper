import React, { useState, useEffect, useRef } from 'react'
import { Flex, Spinner, Table, Thead, Tbody, Tr, Th, Td, Spacer, TableCaption, Link, Button, HStack } from "@chakra-ui/react"
import { useGet, usePatch, api, chunkIds } from '../api/values'
import PageHeading from './PageHeading'
import moment from 'moment';
const ScanReportTbl = (props) => {
    const active = useRef(true)
    const data = useRef(null);
    const activeReports = useRef(null);
    const archivedReports = useRef(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [displayedData, setDisplayedData] = useState(null);
    const [loadingMessage, setLoadingMessage] = useState("Loading Scan Reports")
    const [title, setTitle] = useState("Scan Reports Active");
    useEffect(async () => {
        props.setTitle(null)
        setCurrentUser(window.currentUser)
        window.location.search == '?filter=archived' ? active.current = false : active.current = true
        let scanreports = await useGet(`${api}/scanreports/`)
        scanreports = scanreports.sort((b, a) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0))
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
            dataPartnerPromises.push(useGet(`${api}/datapartners/?id__in=${dataPartnerIds[i].join()}`))
        }
        for (let i = 0; i < authorIds.length; i++) {
            authorPromises.push(useGet(`${api}/usersfilter/?id__in=${authorIds[i].join()}`))
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

        data.current = scanreports
        activeReports.current = scanreports.filter(scanreport => scanreport.hidden == false)
        archivedReports.current = scanreports.filter(scanreport => scanreport.hidden == true)
        active.current ? setDisplayedData(activeReports.current) : setDisplayedData(archivedReports.current);
        active.current ? setTitle("Scan Reports Active") : setTitle("Scan Reports Archived");
        setLoadingMessage(null)
    }, []);


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
    const goToActive = () => {
        if (active.current == false) {
            active.current = true
            setDisplayedData(activeReports.current)
            window.history.pushState({}, '', '/scanreports/')
        }

    }
    const goToArchived = () => {
        if (active.current == true) {
            active.current = false
            setDisplayedData(archivedReports.current)
            window.history.pushState({}, '', '/scanreports/?filter=archived')
        }

    }
    window.onpopstate = function (event) {
        window.location.search == '?filter=archived' ? active.current = false : active.current = true
        active.current ? setDisplayedData(activeReports.current) : setDisplayedData(archivedReports.current);

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
                <Button onClick={goToActive}>Active Reports</Button>
                <Button onClick={goToArchived}>Archived Reports</Button>
            </Flex>
            <Link href="/scanreports/create/"><Button my="10px">New Scan Report</Button></Link>
            <Table w="100%" variant="striped" colorScheme="greyBasic">
                <TableCaption></TableCaption>
                <Thead>
                    <Tr>
                        <Th>ID</Th>
                        <Th>Data Partner</Th>
                        <Th>Dataset</Th>
                        <Th>Added by</Th>
                        <Th>Date</Th>
                        <Th></Th>
                        <Th>Archive</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {displayedData.length > 0 ?
                        // Create new row for every value object
                        displayedData.map((item, index) =>
                            <Tr key={index}>
                                <Td><Link style={{ color: "#0000FF", }} href={"/tables/?search=" + item.id}>{item.id}</Link></Td>
                                <Td><Link style={{ color: "#0000FF", }} href={"/tables/?search=" + item.id}>{item.data_partner.name}</Link></Td>
                                <Td><Link style={{ color: "#0000FF", }} href={"/tables/?search=" + item.id}>{item.dataset}</Link></Td>
                                <Td>{item.author.username}</Td>
                                <Td>{item.created_at.displayString}</Td>
                                <Td>
                                    <HStack>
                                        <Link href={"/scanreports/" + item.id + "/mapping_rules/"}><Button>Rules</Button></Link>
                                        <Link href={"/scanreports/" + item.id + "/assertions/"}><Button>Assertions</Button></Link>
                                    </HStack>
                                </Td>
                                <Td>
                                    {currentUser &&
                                        <>
                                            {currentUser == item.author.username &&
                                                <>
                                                    {item.hidden ?
                                                        <Button isLoading={item.loading ? true : false} loadingText="Showing" spinnerPlacement="start" onClick={() => activateOrArchiveReport(item.id, false)}>Show</Button>
                                                        :
                                                        <Button isLoading={item.loading ? true : false} loadingText="Hiding" spinnerPlacement="start" onClick={() => activateOrArchiveReport(item.id, true)}>Hide</Button>
                                                    }
                                                </>
                                            }
                                        </>
                                    }
                                </Td>
                            </Tr>

                        )
                        :
                        <Flex padding="30px">
                            <Flex marginLeft="10px">No Scan Reports available</Flex>
                        </Flex>
                    }
                </Tbody>
            </Table>
        </div>
    );
}

export default ScanReportTbl;