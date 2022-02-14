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
    Grid,
    GridItem
} from "@chakra-ui/react"
import { ArrowForwardIcon } from '@chakra-ui/icons'
import ConceptTag from './ConceptTag'


function AnalysisTbl({data,values,filters}) {
    return (
        <div>
            <Table variant="striped" colorScheme="greyBasic">
                <Thead>
                    <Tr>
                        <Th>Rule Id</Th>
                        <Th>Ancestors</Th>
                        <Th>Descendants</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {
                        data.map((item, index) =>
                            <Tr key={index}>
                                <Td>{item.rule_id} - {item.rule_name}</Td>
                                <Td>
                                    {item.ancestors.map(ancestor =>
                                        <div>{ancestor.a_id} - {ancestor.a_name}</div>
                                    )}
                                </Td>
                                <Td>
                                    {item.descendants.map(descendant =>
                                        <div>{descendant.d_id} - {descendant.d_name}</div>
                                    )}
                                </Td>
                            </Tr>

                        )
                    }
                </Tbody>

            </Table>
            {/* <Grid templateColumns='repeat(3, 1fr)'>
                {data.map((item, index) =>
                    <>
                        <GridItem w='100%' bg={index % 2 == 0 ? 'blue.500' : 'green.500'}>
                            {item.id}
                        </GridItem>
                        <GridItem w='100%' bg={index % 2 == 0 ? 'blue.500' : 'green.500'}>
                            {item.ancestors.map(ancestor =>
                                <div>{ancestor.concept_name}</div>
                            )}
                        </GridItem>
                        <GridItem w='100%' bg={index % 2 == 0 ? 'blue.500' : 'green.500'}>
                            {item.descendants.map(descendant =>
                                <div>{descendant.concept_name}</div>
                            )}
                        </GridItem>
                    </>

                )}

            </Grid> */}
        </div>)
}

export default AnalysisTbl;


// return (
        
//     <Table variant="striped" colorScheme="greyBasic">
        
//         <Thead>
//             <Tr>
//                 <Th>Rule ID</Th>
//                 <Th>Ancestors</Th>
//                 <Th>Descendants</Th>
//             </Tr>
//         </Thead>
//         <Tbody>
//         {data.descendants.map((item,index)=>
        
//             <Tr key={index}>
//                 <Td>{item.source_concept_id}</Td>
//                 <Td>
//                     {item.ancestor}
//                 </Td>
//                 <Td>
//                     {}
//                 </Td>
//             </Tr>
//         )}     
//         </Tbody>
        
//     </Table>
// )