
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

import {useValue} from '../api/values'
import ConceptTag from './ConceptTag'
import ToastAlert from './ToastAlert'
import axios from 'axios'

const api = axios.create({
    baseURL: `https://609e52b633eed8001795841d.mockapi.io/`
})

//{values}
const DataTbl = () => {

    const res = useValue()
    const [conceptId, setConceptId] = useState([]); //Holds input fields cocnept values onChange
    const [alert, setAlert] = useState({ hidden: true, title: '', description: '', status: 'error' });
    const {isOpen, onOpen, onClose} = useDisclosure()

    const handleChange = (id, value) => {
        const found = conceptId.some(f => f.id === id);

        // If obj is not present for that value - create obj
        if (!found) {
            setConceptId(conceptId => [...conceptId, {
            id: id,
            value: value
        }])
        }
        // If obj is present for that value - update obj
        else if (found){
            const obj = conceptId.find(f => f.id === id);
            obj.value = value
        }
    
    }

    const handleSubmit = (id, event) => {
        event.preventDefault();
        //Empty array
        //event.target.reset();
        const found = conceptId.some(f => f.id === id);
        const obj = conceptId.find(f => f.id === id);
        
        // If input field is empty
        if (!found || obj.value === ''){
            setAlert({
                hidden: false,
                status: 'error',
                title: 'Input field must not be empty',
                description: 'Unsuccessful'
            })
            onOpen()
        }
        else {
            const obj = conceptId.find(f => f.id === id);
            const value = res.data.find(f => f.id === id);

            const newArr = value.conceptIds.concat(obj.value)
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
        setConceptId([])
        
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

    const getValue = (id) => {
        return (conceptId.some(f => f.id === id) ? conceptId.find(f => f.id == id).value : '')
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
                            <VStack >
                                    {item.conceptIds.map((conceptIds) => (
                                            <ConceptTag conceptId={conceptIds} itemId={item.id} handleDelete={handleDelete} />
                                        ))}

                                
                            </VStack>

                        </Td>
                        <Td>
                        {/* method=post */}
                        <form onSubmit={(e) => handleSubmit(item.id, e)}>
                            <FormControl>
                            <HStack>
                            <NumberInput min={-1}>
                                <NumberInputField  onChange={({ target }) => handleChange(item.id, target.value)} placeholder={'New Concept ID'}/>
                            </NumberInput>
                                <Button type='submit' backgroundColor='#3C579E' color='white'>Add</Button>
                            </HStack>
							
                            </FormControl>   

                        </form>   
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
