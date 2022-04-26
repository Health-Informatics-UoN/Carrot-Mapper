import React, { useState, useEffect, useRef } from 'react'
import {
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableCaption,
    Text,
    HStack,
    VStack,
    Flex,
    Spinner,
    ScaleFade,
    Input,
    Link,
    useDisclosure,

} from "@chakra-ui/react"

import { Formik, Form, } from 'formik'
import { getScanReportTable, getScanReportFieldValues, useGet } from '../api/values'
import ConceptTag from './ConceptTag'
import ToastAlert from './ToastAlert'

const FieldsTbl = (props) => {
    // get the value to use to query the fields endpoint from the page url
    const pathArray = window.location.pathname.split("/")
    const scanReportId = pathArray[pathArray.length - 3]
    // const scanReportTableId = pathArray[pathArray.length - 1]
    const scanReportTableId = window.pk ? window.pk : parseInt(new URLSearchParams(window.location.search).get("search"))
    const [alert, setAlert] = useState({ hidden: true, title: '', description: '', status: 'error' });
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [values, setValues] = useState([]);
    const [error, setError] = useState(undefined);
    const [loading, setLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState("");
    const valuesRef = useRef([]);
    const scanReportTable = useRef([]);
    const [mappingButtonDisabled, setMappingButtonDisabled] = useState(true);

    useEffect(() => {
        // run on initial render
        // Check if user can see SR table
        useGet(`/scanreporttables/${scanReportTableId}`).then(
            res => {
                // get field table values for specified id
                getScanReportFieldValues(scanReportTableId, valuesRef).then(val => {
                    setValues(val)
                    setLoading(false)
                })
                // get scan report table data to use for checking person id and date event
                getScanReportTable(scanReportTableId).then(table => {
                    scanReportTable.current = table
                    setMappingButtonDisabled(false)
                })
            }
        ).catch(
            err => {
                // If user can't see SR table, show an error message
                setError("Could not access the resource you requested. "
                    + "Check that it exists and that you have permission to view it."
                )
                setLoading(false)
            }
        )
    }, []);

    // called to submit a concept to be added. Calls handle submit function from app.js
    const handleSubmit = (id, concept) => {
        props.handleSubmit(id, concept, valuesRef, setValues, setAlert, onOpen, scanReportTable.current, 15)
    }

    // called to delete a concept. Calls handle delete function from app.js
    const handleDelete = (id, conceptId) => {
        props.handleDelete(id, conceptId, valuesRef, setValues, setAlert, onOpen)
    }

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
            <Flex padding="30px">
                <Spinner />
                <Flex marginLeft="10px">Loading Field values {loadingMessage}</Flex>
            </Flex>
        )
    }
    if (values.length < 1) {
        //Render Empty List State
        return (
            <Flex padding="30px">
                <Flex marginLeft="10px">No Field values Found</Flex>
            </Flex>
        )
    }
    else {
        return (
            <div>
                {isOpen &&
                    <ScaleFade initialScale={0.9} in={isOpen}>
                        <ToastAlert hide={onClose} title={alert.title} status={alert.status} description={alert.description} />
                    </ScaleFade>
                }

                <Table variant="striped" colorScheme="greyBasic">
                    <TableCaption></TableCaption>
                    <Thead>
                        <Tr>
                            <Th>Field</Th>
                            <Th>Description</Th>
                            <Th>Data type</Th>
                            <Th>Concepts</Th>
                            <Th></Th>
                            {window.canEdit && <Th>Edit</Th>}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {
                            // Create new row for every value object
                            values.map((item, index) =>
                                <Tr key={item.id}>
                                    <Td><Link style={{ color: "#0000FF", }} href={`/scanreports/${scanReportId}/tables/${scanReportTableId}/fields/${item.id}`}>{item.name}</Link></Td>
                                    <Td maxW="250px"><Text maxW="100%" w="max-content">{item.description_column}</Text></Td>
                                    <Td>{item.type_column}</Td>

                                    <Td maxW="300px">
                                        {item.conceptsLoaded ?
                                            item.concepts.length > 0 &&
                                            <VStack alignItems='flex-start' >
                                                {item.concepts.map((concept) => (
                                                    <ConceptTag
                                                        key={concept.concept.concept_id}
                                                        conceptName={concept.concept.concept_name}
                                                        conceptId={concept.concept.concept_id.toString()}
                                                        conceptIdentifier={concept.id.toString()} itemId={item.id}
                                                        handleDelete={handleDelete}
                                                        creation_type={concept.creation_type ? concept.creation_type : undefined}
                                                        readOnly={!window.canEdit}
                                                    />
                                                ))}
                                            </VStack>
                                            :
                                            item.conceptsLoaded === false ?
                                                <Flex >
                                                    <Spinner />
                                                    <Flex marginLeft="10px">Loading Concepts</Flex>
                                                </Flex>
                                                :
                                                <Text>Failed to load concepts</Text>
                                        }
                                    </Td>
                                    <Td>

                                        <Formik initialValues={{ concept: '' }} onSubmit={(data, actions) => {
                                            handleSubmit(item.id, data.concept)
                                            actions.resetForm();
                                        }}>
                                            {({ values, handleChange, handleBlur, handleSubmit }) => (
                                                <Form onSubmit={handleSubmit}>
                                                    <HStack>
                                                        <Input
                                                            w={"105px"}
                                                            type='number'
                                                            name='concept'
                                                            value={values.concept}
                                                            onChange={handleChange}
                                                            onBlur={handleBlur}
                                                            isDisabled={!window.canEdit}
                                                        />
                                                        <div>
                                                            <Button type='submit' isDisabled={!window.canEdit} backgroundColor='#3C579E' color='white'>Add</Button>
                                                        </div>
                                                    </HStack>
                                                </Form>
                                            )}
                                        </Formik>
                                    </Td>
                                    {window.canEdit && <Td><Link style={{ color: "#0000FF", }} href={window.location.href + "/fields/" + item.id + "/update"}>Edit Field</Link></Td>}
                                </Tr>
                            )
                        }
                    </Tbody>
                </Table>
                <Link href={"/scanreports/" + scanReportTable.current.scan_report + "/mapping_rules/"}><Button isDisabled={mappingButtonDisabled} variant="blue" my="10px">Go to Rules</Button></Link>
            </div>
        )

    }

}


export default FieldsTbl
