import React, { useState, useEffect, useRef } from 'react'
import {
    Select, Box, Text, Button, Flex, Spinner, Container, Input, Tooltip, CloseButton, ScaleFade, useDisclosure, Switch,
    FormControl, FormLabel, FormErrorMessage
} from "@chakra-ui/react"
import PageHeading from './PageHeading'
import ToastAlert from './ToastAlert'
import ConceptTag from './ConceptTag'
import { useGet, usePatch, useDelete } from '../api/values'

const DatasetAdminForm = ({ setTitle }) => {
    let datasetId = window.location.pathname.split("/").pop()
    const { isOpen, onOpen, onClose } = useDisclosure()

    // Set up component state
    const [alert, setAlert] = useState({ hidden: true, title: '', description: '', status: 'error' })
    const [dataset, setDataset] = useState({})
    const [dataPartners, setDataPartners] = useState();
    const [selectedDataPartner, setSelectedDataPartner] = useState({ name: "------" })
    const [isPublic, setIsPublic] = useState()
    const [loadingMessage, setLoadingMessage] = useState("Loading page")
    const [formErrors, setFormErrors] = useState({})

    // Set up page
    useEffect(
        async () => {
            setTitle(null)
            // Get dataset
            const datasetQuery = await useGet(`/datasets/${datasetId}`)
            setDataset(datasetQuery)
            setIsPublic(datasetQuery.visibility === "PUBLIC")
            const dataPartnerQuery = await useGet("/datapartners/")
            setDataPartners([{ name: "------" }, ...dataPartnerQuery])
            setSelectedDataPartner(
                dataPartnerQuery.find(element => element.id === datasetQuery.data_partner)
            )
            setLoadingMessage(null)
        },
        [], // Required to stop this effect sending infinite requests
    )

    // Update dataset name
    function handleNameInput(newValue) {
        setDataset({ ...dataset, name: newValue })
    }
    // Update dataset visibility
    function handleVisibilitySwitch(newValue) {
        setIsPublic(newValue)
        setDataset({ ...dataset, visibility: newValue ? "PUBLIC" : "RESTRICTED" })
    }


    if (loadingMessage) {
        //Render Loading State
        return (
            <div>
                <Flex padding="30px">
                    <Spinner />
                    <Flex marginLeft="10px">{loadingMessage ? loadingMessage : "Loading page"}</Flex>
                </Flex>
            </div>
        )
    }

    return (
        <Container maxW='container.xl'>
            {isOpen &&
                <ScaleFade initialScale={0.9} in={isOpen}>
                    <ToastAlert hide={onClose} title={alert.title} status={alert.status} description={alert.description} />
                </ScaleFade>
            }

            <PageHeading text={`Admin Page for Dataset #${dataset.id}`} />

            <FormControl>
                <FormLabel htmlFor="dataset-name">Name</FormLabel>
                <Input
                    id="dataset-name"
                    value={dataset.name}
                    onChange={e => handleNameInput(e.target.value)}
                />
            </FormControl>
            <FormControl>
                <FormLabel htmlFor="dataset-visibility">Visibility</FormLabel>
                <Flex alignItems={"center"}>
                    <Switch
                        id="dataset-visibility"
                        isChecked={isPublic}
                        onChange={e => handleVisibilitySwitch(!isPublic)}
                    />
                    <Text fontWeight={"bold"} ml={2}>{dataset.visibility}</Text>
                </Flex>
            </FormControl>
            <FormControl>
                <FormLabel htmlFor="dataset-datapartner">Data Partner</FormLabel>
                <Select
                    id="dataset-datapartner"
                    value={JSON.stringify(selectedDataPartner)}
                    onChange={(option) => setSelectedDataPartner(JSON.parse(option.target.value))}
                >
                    {dataPartners.map((item, index) =>
                        <option key={index} value={JSON.stringify(item)}>{item.name}</option>
                    )}
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel htmlFor="dataset-viewers">Viewers</FormLabel>
                <Input id="dataset-viewers"></Input>
            </FormControl>
            <FormControl>
                <FormLabel htmlFor="dataset-admins">Admins</FormLabel>
                <Input id="dataset-admins"></Input>
            </FormControl>
        </Container>
    )
}

export default DatasetAdminForm