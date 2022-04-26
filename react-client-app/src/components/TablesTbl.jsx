import React, { useState, useEffect } from 'react'
import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableCaption,
    Flex,
    Spacer,
    Spinner,
    Link,
    Button,
    HStack

} from "@chakra-ui/react"
import CCBreadcrumbBar from './CCBreadcrumbBar'
import PageHeading from './PageHeading'
import { getScanReportTableRows, useGet, usePost } from '../api/values'
import { downloadXLSXFile } from '../api/download'




const TablesTbl = ({ setTitle }) => {
    // get the value to use to query the fields endpoint from the page url
    const pathArray = window.location.pathname.split("/")
    const scanReportId = pathArray[pathArray.length - 1]
    const [scanReportName, setScanReportName] = useState();
    const [scanReportTables, setScanReportTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(undefined);
    const [loadingMessage, setLoadingMessage] = useState("");

    useEffect(() => {
        setTitle(null)
        // Check user can see the scan report
        useGet(`/scanreports/${scanReportId}`).then(res => {
            setScanReportName(res.dataset)
            // If user can see scan report, get the tables
            getScanReportTableRows(scanReportId).then(table => {
                setScanReportTables(table)
                setLoading(false)
            })
        }
        ).catch(
            err => {
                // If user can't see scan report, show an error message
                setError("Could not access the resource you requested. "
                    + "Check that it exists and that you have permission to view it."
                )
                setLoading(false)
            }
        )
    }, []);

    const download_scan_report = () => {
        downloadXLSXFile(scanReportId, window.scan_report_name)

    };

    // This is broken now.
    const download_data_dictionary = async () => {
        const response = await usePost(window.location.href, { "download-dd": true }, false);
        var type = response.headers['content-type'];
        var blob = new Blob([response.data], { type: type });
        var filename = "";
        var disposition = response.headers['content-disposition'];
        if (disposition && disposition.indexOf('attachment') !== -1) {
            var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            var matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, '');
        }
        if (typeof window.navigator.msSaveBlob !== 'undefined') {
            // IE workaround for "HTML7007: One or more blob URLs were revoked by closing the blob for which they were created. These URLs will no longer resolve as the data backing the URL has been freed."
            window.navigator.msSaveBlob(blob, filename);
        }
        else {
            var URL = window.URL || window.webkitURL;
            var downloadUrl = URL.createObjectURL(blob);
            if (filename) {
                // use HTML5 a[download] attribute to specify filename
                var a = document.createElement("a");
                // safari doesn't support this yet
                if (typeof a.download === 'undefined') {
                    window.location.href = downloadUrl;
                }
                else {
                    a.href = downloadUrl;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                }
            }
            else {
                //window.location = downloadUrl;
            }
            setTimeout(function () { URL.revokeObjectURL(downloadUrl); }, 100); // cleanup

        }

    };

    if (error) {
        //Render Error State
        return (
            <Flex padding="30px">
                <Flex marginLeft="10px">{error}</Flex>
            </Flex>
        )
    }

    if (loading) {
        //Render Loading State
        return (
            <div>
                <Flex padding="30px">
                    <Spinner />
                    <Flex marginLeft="10px">{loadingMessage ? loadingMessage : "Loading Tables"}</Flex>
                </Flex>
            </div>
        )
    }
    return (
        <div >
            <CCBreadcrumbBar>
                <Link href={"/"}>Home</Link>
                <Link href={"/scanreports"}>Scan Reports</Link>
                <Link href={`/scanreports/${scanReportId}`}>{scanReportName}</Link>
            </CCBreadcrumbBar>
            <PageHeading text={"Tables"} />
            <Flex my="10px">
                <HStack>
                    <Link href={"/scanreports/" + scanReportId + "/details"}>
                        <Button variant="blue" my="10px">Scan Report Details</Button>
                    </Link>
                    <Link href={"/scanreports/" + scanReportId + "/mapping_rules/"}>
                        <Button variant="blue" my="10px">Go to Rules</Button>
                    </Link>
                </HStack>
                <Spacer />
                <HStack>
                    <Button variant="green" onClick={download_scan_report}>Download Scan Report File</Button>
                    <Button variant="blue" isDisabled={window.hide_button} onClick={download_data_dictionary}>Download Data Dictionary File</Button>
                </HStack>
            </Flex>

            <Table variant="striped" colorScheme="greyBasic">
                <TableCaption></TableCaption>
                <Thead>
                    <Tr>
                        <Th>Name</Th>
                        <Th>Person ID</Th>
                        <Th>Event Date</Th>
                        {window.canEdit && <Th>Edit</Th>}
                    </Tr>
                </Thead>
                <Tbody>
                    {scanReportTables.length > 0 ?
                        scanReportTables.map((item, index) =>
                            <Tr key={index}>
                                <Td maxW={"200px"}><Link style={{ color: "#0000FF", }} href={`/scanreports/${scanReportId}/tables/${item.id}`}>{item.name}</Link></Td>
                                <Td maxW={"200px"}>{item.person_id ? item.person_id.name : null} </Td>
                                <Td maxW={"200px"}>{item.date_event ? item.date_event.name : null}</Td>
                                {window.canEdit && <Td maxW={"200px"}><Link style={{ color: "#0000FF", }} href={"/tables/" + item.id + "/update/"}>Edit Table</Link></Td>}
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

export default TablesTbl;