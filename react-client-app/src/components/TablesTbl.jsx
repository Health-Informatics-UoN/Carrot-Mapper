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

import { getScanReportTableRows, usePost } from '../api/values'
import { downloadXLSXFile } from '../api/download'




const TablesTbl = () => {
    // get the value to use to query the fields endpoint from the page url
    const value = parseInt(new URLSearchParams(window.location.search).get("search"))
    const [values, setValues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(undefined);
    const [loadingMessage, setLoadingMessage] = useState("");

    useEffect(() => {
        // get table on initial render
        getScanReportTableRows(value).then(table => {
            setValues(table)
            setLoading(false)
        })
    }, []);

    const download_scan_report = () => {
        downloadXLSXFile()

    };

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
            <Flex my="10px">
                <HStack>
                    <Link href={"/scanreports/" + value + "/details"}>
                        <Button variant="blue" my="10px">Scan Report Details</Button>
                    </Link>
                    <Link href={"/scanreports/" + value + "/mapping_rules/"}>
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
                        <Th>Edit</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {values.length > 0 ?
                        values.map((item, index) =>
                            <Tr key={index}>
                                <Td maxW={"200px"}><Link style={{ color: "#0000FF", }} href={"/fields/?search=" + item.id}>{item.name}</Link></Td>
                                <Td maxW={"200px"}>{item.person_id ? item.person_id.name : null} </Td>
                                <Td maxW={"200px"}>{item.date_event ? item.date_event.name : null}</Td>
                                <Td maxW={"200px"}><Link style={{ color: "#0000FF", }} href={"/tables/" + item.id + "/update/"}>Edit Table</Link></Td>
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