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
import {  getConcept, authToken,
    getScanReports, getScanReportConcepts,getScanReportsInOrder }  from '../api/values'
import ConceptTag from './ConceptTag'
import ToastAlert from './ToastAlert'
import axios from 'axios'



const api = "http://127.0.0.1:8080/api/"
const Test2 = () => {  
    const value =window.location.search? parseInt(new URLSearchParams(window.location.search).get("search")):23138
    const [alert, setAlert] = useState({ hidden: true, title: '', description: '', status: 'error' });
    const {isOpen, onOpen, onClose} = useDisclosure()
    const [scanReports, setScanReports] = useState([]);
    const scanReportsRef = useRef([]);
    
    useEffect(() => {
        getScanReports(value,setScanReports,scanReportsRef)  
      },[]);
    
    const handleSubmit = (id, concept) => {
        if (concept === ''){
            setAlert({
                hidden: false,
                status: 'error',
                title: 'Input field must not be empty',
                description: 'Unsuccessful'
            })
            onOpen()
        }
        else {
            const value = scanReports.find(f => f.id === id)
            const newArr = value.concepts.concat(concept)
            scanReportsRef.current = scanReportsRef.current.map((scanReport)=>scanReport.id==id?{...scanReport,conceptsLoaded:false}:scanReport)
            setScanReports(scanReportsRef.current)         
            //PUT Request to API
            const data = 
            {
                concept: concept,
                object_id: id,
                content_type:17
            }
            axios.post(`${api}scanreportconcepts/`,data, { 
                headers: { Authorization: "Token " + authToken }
                
            })
            .then(function(response) {
                //Re-fetch API data        
                getScanReportConcepts(id).then(concepts => {
                    if(concepts.length>0){     
                        const promises=[]      
                        concepts.map((concept,ind) => {
                            promises.push(getConcept(concept.concept,concept.id))
                        })
                        Promise.all(promises).then((values) => {
                            setScanReports(scanReportsRef.current.map((scanReport)=>scanReport.id==id?{...scanReport,concepts:[...values],conceptsLoaded:true}:scanReport))
                            scanReportsRef.current = scanReportsRef.current.map((scanReport)=>scanReport.id==id?{...scanReport,concepts:[...values],conceptsLoaded:true}:scanReport)
                            setAlert({
                                hidden: false,
                                status: 'success',
                                title: 'ConceptId linked to the value',
                                description: 'Response: ' + response.status + ' ' + response.statusText
                            })
                            onOpen()
                          });
                    }
                    else{
                        //   
                        setScanReports(scanReportsRef.current.map((scanReport)=>scanReport.id==id?{...scanReport,concepts:[],conceptsLoaded:true}:scanReport)) 
                        scanReportsRef.current.map((scanReport)=>scanReport.id==id?{...scanReport,concepts:[],conceptsLoaded:true}:scanReport)
                        setAlert({
                            hidden: false,
                            status: 'success',
                            title: 'ConceptId linked to the value',
                            description: 'Response: ' + response.status + ' ' + response.statusText
                        })
                        onOpen()
                    }
                    
                })    
            })
            .catch(function(error){
                setScanReports(scanReportsRef.current.map((scanReport)=>scanReport.id==id?{...scanReport,conceptsLoaded:true}:scanReport)) 
                scanReportsRef.current.map((scanReport)=>scanReport.id==id?{...scanReport,conceptsLoaded:true}:scanReport)
                if (typeof(error) !== 'undefined' && error.response != null)
                {
                    setAlert({
                        status: 'error',
                        title: 'Unable to link Concept id to value',
                        description: 'Response: ' + error.response.status + ' ' + error.response.statusText
                    })
                    onOpen()
                   
                }
            })  
        }
    }


    const handleDelete = (id, conceptId) => {
        scanReportsRef.current = scanReportsRef.current.map((scanReport)=>scanReport.id==id?{...scanReport,conceptsLoaded:false}:scanReport)
        setScanReports(scanReportsRef.current)
        //PUT Request to API
        axios.delete(`${api}scanreportconcepts/${conceptId}`, { 
            headers: { Authorization: "Token " + authToken }
            
        })
        .then(function(response) {
            //Re-fetch the concepts for that particular scan report
            getScanReportConcepts(id).then(concepts => {
                if(concepts.length>0){     
                    const promises=[]      
                    concepts.map((concept) => {
                        promises.push(getConcept(concept.concept,concept.id))
                    })
                    Promise.all(promises).then((values) => {
                        scanReportsRef.current = scanReportsRef.current.map((scanReport)=>scanReport.id==id?{...scanReport,concepts:[...values],conceptsLoaded:true}:scanReport)
                        setScanReports(scanReportsRef.current)
                        setAlert({
                            status: 'success',
                            title: 'Concept Id Deleted',
                            description: 'Response: ' + response.status + ' ' + response.statusText
                        })
                        onOpen()
                      });
                }
                else{
                    //    
                    scanReportsRef.current = scanReportsRef.current.map((scanReport)=>scanReport.id==id?{...scanReport,concepts:[],conceptsLoaded:true}:scanReport)
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
        .catch(function(error){
            scanReportsRef.current = scanReportsRef.current.map((scanReport)=>scanReport.id==id?{...scanReport,conceptsLoaded:true}:scanReport)
            setScanReports(scanReportsRef.current) 
            if (typeof(error) !== 'undefined' && error.response != null)
            {
                
                setAlert({
                    status: 'error',
                    title: 'Unable to delete Concept id from value',
                    description: 'Response: ' + error.response.status + ' ' + error.response.statusText
                })
                onOpen()
               
            }
        }) 
    } 


    if (scanReports.length<1){
        //Render Loading State
        return (
            <Flex padding="30px">
                <Spinner />
                <Flex marginLeft="10px">Loading Scan Reports</Flex>
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
                <ScaleFade initialScale={0.9} in={isOpen}>
                    <ToastAlert hide={onClose} title={alert.title} status={alert.status} description={alert.description} />
                </ScaleFade>

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
                            {item.conceptsLoaded?
                                item.concepts.length>0&&
                                    <VStack alignItems='flex-start' >
                                        {item.concepts.map((concept) => (
                                                <ConceptTag key={concept.concept_id} conceptName={concept.concept_name} conceptId={concept.concept_id.toString()}  conceptIdentifier={concept.id.toString()}  itemId={item.id} handleDelete={handleDelete} />
                                            ))}                             
                                    </VStack>
                                :
                                <Flex >
                                    <Spinner />
                                    <Flex marginLeft="10px">Loading Concepts</Flex>
                                </Flex>
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
                                        <Button type='submit' disabled={!item.conceptsLoaded} backgroundColor='#3C579E' color='white'>Add</Button>
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


export default Test2