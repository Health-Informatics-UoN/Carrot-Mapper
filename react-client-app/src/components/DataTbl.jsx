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
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Tag,
    TagLabel,
    TagCloseButton,
    Text,
    HStack,
    VStack,
    Stack,
    Flex,
    Spinner,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    CloseButton,
    FormLabel,
    Box,
    Fade,
    ScaleFade,
    useToast,
    FormControl,
    Input,
    useDisclosure,
    Collapse

  } from "@chakra-ui/react"

import { Formik, Field, Form, ErrorMessage, FieldArray as FormikActions } from 'formik'
import {  getConcept, authToken,api,getScanReports, getScanReportConcepts,m_allowed_tables,
    getScanReportField,getScanReportTable,saveMappingRules,mapConceptToOmopField,
    useDelete, useGet,usePost}  from '../api/values'
import ConceptTag from './ConceptTag'
import ToastAlert from './ToastAlert'
import axios from 'axios'




const DataTbl = () => {  
    const value =parseInt(new URLSearchParams(window.location.search).get("search")) 
    //6284
    //21187
    const [alert, setAlert] = useState({ hidden: true, title: '', description: '', status: 'error' });
    const {isOpen, onOpen, onClose} = useDisclosure()
    const [scanReports, setScanReports] = useState([]);
    const [error, setError] = useState(undefined);
    const [loadingMessage, setLoadingMessage] = useState("");
    const scanReportsRef = useRef([]);
    const scanReportTable = useRef([]);
    
    useEffect(() => {
        // get and store scan report table object to use to check person_id and date_event
        getScanReportField(value).then(data=>{
            getScanReportTable(data.scan_report_table).then(table=>{
                scanReportTable.current = table
            })
        })
        // get scan report values
        getScanReports(value,setScanReports,scanReportsRef,setLoadingMessage,setError)  
        
      },[]);
    
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
            const scanReportValue = scanReports.find(f => f.id === id)
            scanReportsRef.current = scanReportsRef.current.map((value) => value.id == id ? { ...value, conceptsLoaded: false } : value)
            setScanReports(scanReportsRef.current)
            // check if concept exists
            useGet(`${api}/omop/concepts/${concept}`)
                .then(async response => {
                    // if concept does not exist, display error
                    if (response.detail == 'Not found.') {
                        scanReportsRef.current = scanReportsRef.current.map((value) => value.id == id ? { ...value, conceptsLoaded: true } : value)
                        setScanReports(scanReportsRef.current)
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
                    const fields = await useGet(`${api}/omopfields/`)
                    const destination_field = await cachedOmopFunction(fields, domain + "_source_concept_id")
                    if (destination_field == undefined) {
                        scanReportsRef.current = scanReportsRef.current.map((value) => value.id == id ? { ...value, conceptsLoaded: true } : value)
                        setScanReports(scanReportsRef.current)
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
                    const omopTable = await useGet(`${api}/omoptables/${destination_field.table}`)
                    if (!m_allowed_tables.includes(omopTable.table)) {
                        scanReportsRef.current = scanReportsRef.current.map((value) => value.id == id ? { ...value, conceptsLoaded: true } : value)
                        setScanReports(scanReportsRef.current)
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
                        content_type: 17
                    }
                    usePost(`${api}/scanreportconcepts/`, data)
                        .then(function (response) {
                            //Re-fetch scan report concepts for field     
                            getScanReportConcepts(id).then(scanreportconcepts => {
                                if (scanreportconcepts.length > 0) {
                                    const conceptIds = scanreportconcepts.map(value => value.concept)
                                    useGet(`${api}/omop/conceptsfilter/?concept_id__in=${conceptIds.join()}`)
                                        .then((values) => {
                                            scanreportconcepts = scanreportconcepts.map(element => ({ ...element, concept: values.find(con => con.concept_id == element.concept) }))
                                            scanReportsRef.current = scanReportsRef.current.map((value) => value.id == id ? { ...value, concepts: [...scanreportconcepts], conceptsLoaded: true } : value)
                                            setScanReports(scanReportsRef.current)
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
                                    scanReportsRef.current = scanReportsRef.current.map((value) => value.id == id ? { ...value, concepts: [], conceptsLoaded: true } : value)
                                    setScanReports(scanReportsRef.current)
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
                            scanReportsRef.current = scanReportsRef.current.map((value) => value.id == id ? { ...value, conceptsLoaded: true } : value)
                            setScanReports(scanReportsRef.current)

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
                    scanReportsRef.current = scanReportsRef.current.map((value) => value.id == id ? { ...value, conceptsLoaded: true } : value)
                    setScanReports(scanReportsRef.current)
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
        scanReportsRef.current = scanReportsRef.current.map((value) => value.id == id ? { ...value, conceptsLoaded: false } : value)
        setScanReports(scanReportsRef.current)
        //DEETE Request to API
        useDelete(`scanreportconcepts/${conceptId}`)
            .then(function (response) {
                //Re-fetch the concepts for that particular field
                getScanReportConcepts(id).then(scanreportconcepts => {
                    if (scanreportconcepts.length > 0) {
                        const conceptIds = scanreportconcepts.map(value => value.concept)
                        useGet(`${api}/omop/conceptsfilter/?concept_id__in=${conceptIds.join()}`)
                            .then((values) => {
                                scanreportconcepts = scanreportconcepts.map(element => ({ ...element, concept: values.find(con => con.concept_id == element.concept) }))
                                scanReportsRef.current = scanReportsRef.current.map((value) => value.id == id ? { ...value, concepts: [...scanreportconcepts], conceptsLoaded: true } : value)
                                setScanReports(scanReportsRef.current)
                                setAlert({
                                    status: 'success',
                                    title: 'Concept Id Deleted',
                                    description: 'Response: ' + response.status + ' ' + response.statusText
                                })
                                onOpen()
                            });
                    }
                    else {
                        scanReportsRef.current = scanReportsRef.current.map((value) => value.id == id ? { ...value, concepts: [], conceptsLoaded: true } : value)
                        setScanReports(scanReportsRef.current)
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
                scanReportsRef.current = scanReportsRef.current.map((value) => value.id == id ? { ...value, conceptsLoaded: true } : value)
                setScanReports(scanReportsRef.current)
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

    if (error){
        //Render Loading State
        return (
            <Flex padding="30px"> 
                <Flex marginLeft="10px">An Error has occured while fetching values</Flex>
            </Flex>
        )
    }

    if (scanReports.length<1){
        //Render Loading State
        return (
            <Flex padding="30px">
                <Spinner />
                <Flex marginLeft="10px">Loading Scan Reports {loadingMessage}</Flex>
            </Flex>
        )
    }
    if (scanReports[0]==undefined){
        //Render Loading State
        return (
            <Flex padding="30px">
                
                <Flex marginLeft="10px">No Scan Reports Found</Flex>
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
                    <Th>Value</Th>
                    <Th>Value Description</Th>
                    <Th>Frequency</Th>
                    <Th>Concepts</Th>
                    <Th></Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {
                        // Create new row for every value object
                        scanReports.map((item,index) =>
                        <Tr key={item.id}>
                        <Td>{item.value}</Td>
                        <Td>{item.value_description}</Td>
                        <Td>{item.frequency}</Td>
                        
                        <Td>
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
                        { ( { values, handleChange, handleBlur, handleSubmit }) => (
                            <Form onSubmit={handleSubmit}>
                                <HStack>
                                    <Input  
                                        width='30%'
                                        type='number'                                    
                                        name='concept'
                                        value={values.concept}
                                        onChange={handleChange}
                                        onBlur={handleBlur} />
                                    <div>
                                        <Button type='submit' disabled={!item.conceptsToLoad==0} backgroundColor='#3C579E' color='white'>Add</Button>
                                    </div>
                                </HStack>
                            </Form>
                        )}  
                        </Formik>  
                        </Td>
                        </Tr>
                        
                        )
                    }
                </Tbody>
                </Table>
            </div>
        )

    } 

} 


export default DataTbl

