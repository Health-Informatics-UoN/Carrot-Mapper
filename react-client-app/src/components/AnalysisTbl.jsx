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



function AnalysisTbl({ data, values, filters }) {
    return (
        <div>
            <Table variant="striped" colorScheme="greyBasic">
                <Thead>
                    <Tr>
                        <Th>Rule Id</Th>
                        <Th>
                            <span style={{ color: "#475da7" }}>Ancestors</span> / 
                            <span style={{ color: "#3db28c" }}> Descendants</span>
                        </Th>
                        <Th>Min/Max Separation</Th>
                        <Th>Source</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {(data).length > 0 ?
                        data.map((item, index) =>
                            <Tr key={index}>
                                <Td>{item.rule_id} - {item.rule_name}</Td>
                                <Td>

                                    {item.anc_desc.map((element) =>
                                        <div>
                                            {element.ancestors.map(ancestor =>

                                                <div style={{ color: "#475da7" }}> {ancestor.a_id} - {ancestor.a_name} (A)</div>

                                            )}
                                            {element.descendants.map(descendant =>

                                                <div style={{ color: "#3db28c" }} > {descendant.d_id} - {descendant.d_name} (D)</div>
                                            )}
                                        </div>
                                    )}
                                </Td>
                                <Td>
                                    {item.anc_desc.map((element) =>
                                        <div>
                                            {element.ancestors.map(ancestor =>

                                                <div style={{ color: "#475da7" }}> {ancestor.level}</div>

                                            )}
                                            {element.descendants.map(descendant =>

                                                <div style={{ color: "#3db28c" }} > {descendant.level}</div>
                                            )}
                                        </div>
                                    )}
                                </Td>
                                <Td>
                                    {item.anc_desc.map((element) =>
                                        <div>
                                            {element.ancestors.map(ancestor =>
                                                <div style={{ alignSelf: 'flex-start' }}>
                                                    {ancestor.source.map(source_id => {
                                                        if (source_id.concept__content_type == 15)
                                                            return <Link style={{ color: "#0000FF", }} href={"/fields/?search=" + source_id.source_field__scan_report_table__id}> {source_id.source_field__name} </Link>
                                                        return <Link style={{ color: "#0000FF", }} href={"/values/?search=" + source_id.source_field__id}> {source_id.source_field__name} </Link>
                                                    })}
                                                </div>

                                            )}
                                            {element.descendants.map(descendant =>
                                                <div style={{ alignSelf: 'flex-start' }}>
                                                    {descendant.source.map(source_id => {
                                                        if (source_id.concept__content_type == 15)
                                                            return <Link style={{ color: "#0000FF", }} href={"/fields/?search=" + source_id.source_field__scan_report_table__id}> {source_id.source_field__name} </Link>
                                                        return <Link style={{ color: "#0000FF", }} href={"/values/?search=" + source_id.source_field__id}> {source_id.source_field__name} </Link>
                                                    })}
                                                </div>

                                            )}
                                        </div>
                                    )}
                                </Td>
                            </Tr>

                        ) :
                        <Flex padding="30px">
                            <Flex marginLeft="10px">No ancestors or descendants of these mappings appear in any other Scan Reports</Flex>
                        </Flex>

                    }
                </Tbody>

            </Table>
        </div>)
}

export default AnalysisTbl;
