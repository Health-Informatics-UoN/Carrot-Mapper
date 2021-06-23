
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

import { Formik, Field, Form, ErrorMessage, FieldArray, FormikHelpers as FormikActions } from 'formik'
import { useValue, useScanReportConcepts }  from '../api/values'
import ConceptTag from './ConceptTag'
import ToastAlert from './ToastAlert'
import axios from 'axios'

const api = axios.create({
    baseURL: `https://609e52b633eed8001795841d.mockapi.io/`
})

//{values}
const Test = () => {

    const res = useValue()
    const res2 = useScanReportConcepts()
    const [alert, setAlert] = useState({ hidden: true, title: '', description: '', status: 'error' });
    const {isOpen, onOpen, onClose} = useDisclosure()

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
        const test = value.conceptIds.filter(item => item !== conceptId)
        //PUT Request to API
        api.put(`/values/${id}`, { 
            id: {id},
            value: value.value,
            frequency: value.frequency,
            conceptIds: test
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
    }

    if (res.isLoading){
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
                        res.data.map((item) =>
                        <Tr key={item.id}>
                        <Td>{item.value}</Td>
                        <Td>{item.frequency}</Td>
                        <Td>
        
                                <VStack alignItems='flex-start' >
                                    {item.conceptIds.map((conceptIds) => (
                                            <ConceptTag conceptId={conceptIds} itemId={item.id} handleDelete={handleDelete} />
                                        ))}                             
                                </VStack>
                            

                        </Td>
                        <Td>

                        <Formik initialValues={{ concept: '' }} onSubmit={(data, actions) => {
                            handleSubmit(item.id, data.concept)
                            console.log(res2)
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
