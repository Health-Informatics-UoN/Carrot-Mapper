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
        <>{Object.entries(data).map((key,value)=>
            <Table variant="striped" colorScheme="greyBasic">
                
                <Thead>
                    <Tr>
                        <Th>Rule ID</Th>
 
                
                        
                        <Th>{key[0]}</Th>
                        <Th>{key[1]}</Th>
                    </Tr>
                </Thead>
                <Tbody>

                    <Tr>
                        <Td>
                            {value}
                        </Td>
                    </Tr>
                        
                </Tbody>
                
            </Table>)}</>
    )
}

export default AnalysisTbl
