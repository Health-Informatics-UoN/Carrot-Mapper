

import React, { useState, useEffect } from 'react'
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
import { useValue,  useScanReportValues, getConceptLoop }  from '../api/values'
import ConceptTag from './ConceptTag'
import ToastAlert from './ToastAlert'
import axios from 'axios'

const api = axios.create({
    baseURL: `https://609e52b633eed8001795841d.mockapi.io/`
})

//{values}
const Test = () => {
    const res = useValue()
    const value = 8381
    const res1 = useScanReportValues(value)
    const [alert, setAlert] = useState({ hidden: true, title: '', description: '', status: 'error' });
    const {isOpen, onOpen, onClose} = useDisclosure()
    const [concepts, setConcepts] = useState([]);
    
    useEffect(() => {
        getConceptLoop(value)
        .then(result=>{
                // results are a list of promises
                // each promise either returns undefined or an array of promises (getting concepts)
                // each of these promises returns an object (the concept)
                
                const updatedConceptsState = []   
                for(let i = 0; i < result.length; i++) {
                    updatedConceptsState.push([]);
                }
                result.map((a,index) =>{    
                    if(a){
                        a.then(b=>{
                            if(b){
                                b.map(c=>{
                                    c.then(d=>{
                                        updatedConceptsState[index].push(d)
                                        setConcepts(updatedConceptsState)                    
                                    })
                                })
                            }
                            else if(index==result.length-1){
                                setConcepts(updatedConceptsState)  
                            }
                        })
                    }
                    else {
                        setConcepts(updatedConceptsState)  
                    }
                    
                })
                    
                     
        })
      },[]);
    

    
   
    
    

    /*
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
            const value = res.data.find(f => f.id === id)
            const newArr = value.conceptIds.concat(concept)
            //PUT Request to API
            api.put(`/values/${id}`, { 
                id: {id},
                value: value.value,
                frequency: value.frequency,
                conceptIds: newArr
            })
            .then(function(response) {
                //Re-fetch API data
                {res.revalidate();}
                setAlert({
                    hidden: false,
                    status: 'success',
                    title: 'ConceptId linked to the value',
                    description: 'Response: ' + response.status + ' ' + response.statusText
                })
                onOpen()
                  
            })
            .then(function(error){
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
        const value = res.data.find(f => f.id === id);
        const concept = value.conceptIds.filter(item => item !== conceptId)
        //PUT Request to API
        api.put(`/values/${id}`, { 
            id: {id},
            value: value.value,
            frequency: value.frequency,
            conceptIds: concept
        })
        .then(function(response) {
            //Re-fetch API data
            {res.revalidate();}
            setAlert({
                status: 'success',
                title: 'Concept Id Deleted',
                description: 'Response: ' + response.status + ' ' + response.statusText
            })
            onOpen()
        }) 
    } */


    if (res1.isLoading || res1.isError || concepts.length<1){
        //Render Loading State
        return (
            <Flex padding="30px">
                <Spinner />
                <Flex marginLeft="10px">Loading Value Data</Flex>
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
                    <Th>Frequency</Th>
                    <Th>Concepts</Th>
                    <Th></Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {
                        // Create new row for every value object
                        res1.data.map((item,index) =>
                        <Tr key={item.id}>
                        <Td>{item.value}</Td>
                        <Td>{item.frequency}</Td>
                        <Td>
                            {concepts[index].length>0&&
                                <VStack alignItems='flex-start' >
                                    {concepts[index].map((concept) => (
                                            <ConceptTag key={concept.concept_id} conceptName={concept.concept_name} conceptId={concept.concept_id.toString()} itemId={concept.concept_id} /* handleDelete={handleDelete} */ />
                                        ))}                             
                                </VStack>
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
                                        <Button type='submit' backgroundColor='#3C579E' color='white'>Add</Button>
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


export default Test

