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
    Spinner,
    Link,
    
} from "@chakra-ui/react"


import { getScanReportTableRows } from '../api/values'




const TablesTbl = () => {
    const value = parseInt(new URLSearchParams(window.location.search).get("search"))
    const [values, setValues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(undefined);
    const [loadingMessage, setLoadingMessage] = useState("");

    useEffect(() => {
        getScanReportTableRows(value).then(table=>{
            
            setValues(table)
            setLoading(false)
        })
        
    }, []);

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
            <Table variant="striped" colorScheme="greyBasic">
                <TableCaption></TableCaption>
                <Thead>
                    <Tr>
                        <Th>Name</Th>
                        <Th>Person ID</Th>
                        <Th>Event Date</Th>
                        <Th>Run NLP on Table</Th>
                        <Th>Edit</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {values.length > 0 ?
                        // Create new row for every value object
                        values.map((item, index) =>
                            <Tr key={index}>
                                <Td><Link style={{ color: "#0000FF", }} href={window.u + "fields/?search=" + item.id}>{item.name}</Link></Td>
                                <Td>{item.person_id} </Td>
                                <Td>{item.date_event}</Td>
                                <Td><Link style={{ color: "#0000FF", }} href={"/nlp/table/run?search="+item.id}>Run NLP on Table</Link></Td>
                                <Td><Link style={{ color: "#0000FF", }} href={window.u + "tables/"+406+"/update/"}>Edit Table</Link></Td>  
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