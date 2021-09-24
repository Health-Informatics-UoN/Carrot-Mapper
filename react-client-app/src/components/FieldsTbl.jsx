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
import {
    api, getScanReportConcepts, useDelete, useGet, m_allowed_tables,
    getScanReportTable, saveMappingRules, getScanReportFieldValues, mapConceptToOmopField, usePost
} from '../api/values'
import ConceptTag from './ConceptTag'
import ToastAlert from './ToastAlert'

const FieldsTbl = () => {
    const value = parseInt(new URLSearchParams(window.location.search).get("search"))
    const [alert, setAlert] = useState({ hidden: true, title: '', description: '', status: 'error' });
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [values, setValues] = useState([]);
    const [error, setError] = useState(undefined);
    const [loading, setLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState("");
    const valuesRef = useRef([]);
    const scanReportTable = useRef([]);

    useEffect(() => {
        // run on initial render
        // get field table values for specified id
        getScanReportFieldValues(value, valuesRef).then(val => {
            setValues(val)
            setLoading(false)
        })
        // get scan report table data to use for checking person id and date event
        getScanReportTable(value).then(table => {
            scanReportTable.current = table
        })
    }, []);

    const handleSubmit = (id, concept) => {
        const table = scanReportTable.current
        if (concept === '') {
            setAlert({
                hidden: false,
                status: 'error',
                title: 'Input field must not be empty',
                description: 'Unsuccessful'
            })
            onOpen()
        }
        else if (!table.person_id || !table.date_event) {
            // set the error message depending on which value is missing
            let message;
            if (!table.person_id && !table.date_event) { message = 'Please set the person_id and a date_event to ' }
            else if (!table.person_id) { message = 'Please set the person_id to ' }
            else { message = 'Please set the date_event to ' }
            setAlert({
                hidden: false,
                status: 'error',
                title: message + table.name + ' before you add a concept.',
                description: 'Unsuccessful'
            })
            onOpen()
        }
        else {
            const scanReportValue = values.find(f => f.id === id)
            valuesRef.current = valuesRef.current.map((value) => value.id == id ? { ...value, conceptsLoaded: false } : value)
            setValues(valuesRef.current)
            // check if concept exists
            useGet(`/omop/concepts/${concept}`)
                .then(async response => {
                    // if concept does not exist, display error
                    if (response.detail == 'Not found.') {
                        valuesRef.current = valuesRef.current.map((value) => value.id == id ? { ...value, conceptsLoaded: true } : value)
                        setValues(valuesRef.current)
                        setAlert({
                            hidden: false,
                            status: 'error',
                            title: "Concept id " + concept + " does not exist in our database.",
                            description: 'Response: ' + response.status + ' ' + response.statusText
                        })
                        onOpen()
                        return
                    }

                    // check if concept has valid destination field
                    const cachedOmopFunction = mapConceptToOmopField()
                    const domain = response.domain_id.toLowerCase()
                    const fields = await useGet(`/omopfields/`)
                    const destination_field = await cachedOmopFunction(fields, domain + "_source_concept_id")
                    if (destination_field == undefined) {
                        valuesRef.current = valuesRef.current.map((value) => value.id == id ? { ...value, conceptsLoaded: true } : value)
                        setValues(valuesRef.current)
                        setAlert({
                            hidden: false,
                            status: 'error',
                            title: "Could not find a destination field for this concept",
                            description: "Destination field null"
                        })
                        onOpen()
                        return

                    }
                    // check concepts omop table has been implemented
                    const omopTable = await useGet(`/omoptables/${destination_field.table}`)
                    if (!m_allowed_tables.includes(omopTable.table)) {
                        valuesRef.current = valuesRef.current.map((value) => value.id == id ? { ...value, conceptsLoaded: true } : value)
                        setValues(valuesRef.current)
                        setAlert({
                            hidden: false,
                            status: 'error',
                            title: "Have not yet implemented concept",
                            description: `Concept ${response.concept_id} (${response.concept_name}) is from table '${destination_field.table}' which is not implemented yet.`
                        })
                        onOpen()
                        return
                    }
                    // create scan report concept
                    const data =
                    {
                        concept: concept,
                        object_id: id,
                        content_type: 15
                    }
                    usePost(`/scanreportconcepts/`, data)
                        .then(function (response) {
                            //Re-fetch scan report concepts for field     
                            getScanReportConcepts(id).then(scanreportconcepts => {
                                if (scanreportconcepts.length > 0) {
                                    const conceptIds = scanreportconcepts.map(value => value.concept)
                                    useGet(`/omop/conceptsfilter/?concept_id__in=${conceptIds.join()}`)
                                        .then((values) => {
                                            scanreportconcepts = scanreportconcepts.map(element => ({ ...element, concept: values.find(con => con.concept_id == element.concept) }))
                                            valuesRef.current = valuesRef.current.map((value) => value.id == id ? { ...value, concepts: [...scanreportconcepts], conceptsLoaded: true } : value)
                                            setValues(valuesRef.current)
                                            setAlert({
                                                hidden: false,
                                                status: 'success',
                                                title: 'ConceptId linked to the value',
                                                description: 'Response: ' + response.status + ' ' + response.statusText
                                            })
                                            onOpen()

                                            const scan_report_concept = scanreportconcepts.filter(con => con.concept.concept_id == concept)[0]
                                            saveMappingRules(scan_report_concept, scanReportValue, table)
                                                .then(values => {
                                                    setAlert({
                                                        hidden: false,
                                                        status: 'success',
                                                        title: 'Success',
                                                        description: 'Mapping Rules created'
                                                    })
                                                    onOpen()
                                                })
                                                .catch(err => {
                                                    setAlert({
                                                        hidden: false,
                                                        status: 'error',
                                                        title: 'Could not create mapping rules',
                                                        description: "error"
                                                    })
                                                    onOpen()
                                                })
                                        });
                                }
                                else {
                                    valuesRef.current = valuesRef.current.map((value) => value.id == id ? { ...value, concepts: [], conceptsLoaded: true } : value)
                                    setValues(valuesRef.current)
                                    setAlert({
                                        hidden: false,
                                        status: 'error',
                                        title: 'Cant find the concepts',
                                        description: 'Response: ' + response.status + ' ' + response.statusText
                                    })
                                    onOpen()
                                }
                            })
                        })
                        .catch(function (error) {
                            valuesRef.current = valuesRef.current.map((value) => value.id == id ? { ...value, conceptsLoaded: true } : value)
                            setValues(valuesRef.current)

                            if (typeof (error) !== 'undefined' && error.response != null) {
                                setAlert({
                                    status: 'error',
                                    title: 'Unable to link Concept id to value',
                                    description: 'Response: ' + error.response.status + ' ' + error.response.statusText
                                })
                                onOpen()

                            }
                        })


                })
                .catch(err => {
                    valuesRef.current = valuesRef.current.map((value) => value.id == id ? { ...value, conceptsLoaded: true } : value)
                    setValues(valuesRef.current)
                    setAlert({
                        hidden: false,
                        status: 'error',
                        title: "Could not find concept",
                        description: 'Response: ' + response.status + ' ' + response.statusText
                    })
                    onOpen()
                })
        }
    }


    const handleDelete = (id, conceptId) => {
        valuesRef.current = valuesRef.current.map((value) => value.id == id ? { ...value, conceptsLoaded: false } : value)
        setValues(valuesRef.current)
        //DEETE Request to API
        useDelete(`scanreportconcepts/${conceptId}`)
            .then(function (response) {
                //Re-fetch the concepts for that particular field
                getScanReportConcepts(id).then(scanreportconcepts => {
                    if (scanreportconcepts.length > 0) {
                        const conceptIds = scanreportconcepts.map(value => value.concept)
                        useGet(`/omop/conceptsfilter/?concept_id__in=${conceptIds.join()}`)
                            .then((values) => {
                                scanreportconcepts = scanreportconcepts.map(element => ({ ...element, concept: values.find(con => con.concept_id == element.concept) }))
                                valuesRef.current = valuesRef.current.map((value) => value.id == id ? { ...value, concepts: [...scanreportconcepts], conceptsLoaded: true } : value)
                                setValues(valuesRef.current)
                                setAlert({
                                    status: 'success',
                                    title: 'Concept Id Deleted',
                                    description: 'Response: ' + response.status + ' ' + response.statusText
                                })
                                onOpen()
                            });
                    }
                    else {
                        valuesRef.current = valuesRef.current.map((value) => value.id == id ? { ...value, concepts: [], conceptsLoaded: true } : value)
                        setValues(valuesRef.current)
                        setAlert({
                            status: 'success',
                            title: 'Concept Id Deleted',
                            description: 'Response: ' + response.status + ' ' + response.statusText
                        })
                        onOpen()
                    }
                })
            })
            .catch(function (error) {
                valuesRef.current = valuesRef.current.map((value) => value.id == id ? { ...value, conceptsLoaded: true } : value)
                setValues(valuesRef.current)
                if (typeof (error) !== 'undefined' && error.response != null) {
                    setAlert({
                        status: 'error',
                        title: 'Unable to delete Concept id from value',
                        description: 'Response: ' + error.response.status + ' ' + error.response.statusText
                    })
                    onOpen()

                }
            })
    }

    if (error) {
        //Render Error State
        return (
            <Flex padding="30px">
                <Flex marginLeft="10px">An Error has occured while fetching values</Flex>
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
                {isOpen&&
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
                            <Th>Edit</Th>
                            <Th>Run NLP</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {
                            // Create new row for every value object
                            values.map((item, index) =>
                                <Tr key={item.id}>
                                    <Td><Link style={{ color: "#0000FF", }} href={window.u + "values/?search=" + item.id}>{item.name}</Link></Td>
                                    <Td maxW="250px"><Text maxW="100%" w="max-content">{item.description_column}</Text></Td>
                                    <Td>{item.type_column}</Td>

                                    <Td maxW="300px">
                                        {item.conceptsLoaded ?
                                            item.concepts.length > 0 &&
                                            <VStack alignItems='flex-start' >
                                                {item.concepts.map((concept) => (
                                                    <ConceptTag key={concept.concept.concept_id} conceptName={concept.concept.concept_name} conceptId={concept.concept.concept_id.toString()} conceptIdentifier={concept.id.toString()} itemId={item.id} handleDelete={handleDelete} />
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
                                                            width='90px'
                                                            type='number'
                                                            name='concept'
                                                            value={values.concept}
                                                            onChange={handleChange}
                                                            onBlur={handleBlur} />
                                                        <div>
                                                            <Button type='submit' disabled={false} backgroundColor='#3C579E' color='white'>Add</Button>
                                                        </div>
                                                    </HStack>
                                                </Form>
                                            )}
                                        </Formik>
                                    </Td>
                                    <Td><Link style={{ color: "#0000FF", }} href={window.u + "fields/" + item.id + "/update/"}>Edit Field</Link></Td>
                                    <Td><Link href={"/nlp/run?search=" + item.id} style={{ color: "#0000FF", }}>Run NLP</Link></Td>
                                </Tr>
                            )
                        }
                    </Tbody>
                </Table>
            </div>
        )

    }

}


export default FieldsTbl
