import React from 'react'
import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableCaption,
    VStack,
    Flex,
    Link,
    Select,
} from "@chakra-ui/react"
import { ArrowForwardIcon } from '@chakra-ui/icons'
import ConceptTag from './ConceptTag'


function AnalysisTbl({data,values,filters}) {
    return (

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
                
                        <Th>Term Map</Th>
                        <Th>Ancestors</Th>
                        <Th>Descendants</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    <Tr>
                        <Td>Data</Td>
                    </Tr>
                </Tbody>
            </Table>
    )
}

export default AnalysisTbl
