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
    const { isOpen, onOpen, onClose } = useDisclosure()

    // Set up component state
    const [alert, setAlert] = useState({ hidden: true, title: '', description: '', status: 'error' })
    const [dataset, setDataset] = useState({})
    const [loadingMessage, setLoadingMessage] = useState("Loading page")
    const [formErrors, setFormErrors] = useState({});

    // Set up component refs
    const datasetName = useRef()
    const datasetVisibility = useRef()
    const datasetDataPartner = useRef()
    const datasetViewers = useRef()
    const datasetAdmins = useRef()

    // Set up reactive values
    useEffect(
        async () => {
            let datasetId = window.location.pathname.split("/").pop()
            datasetId = parseInt(datasetId)
            setDataset(useGet(`/datasets/${datasetId}`))
        },
        [dataset],
    )
    return (
        <h1>{dataset.name}</h1>
    )

}

export default DatasetAdminForm