import React, { useState, useEffect, useRef } from 'react'
import PageHeading from '../components/PageHeading'
import ToastAlert from '../components/ToastAlert'
import ConceptTag from '../components/ConceptTag'
import CCSelectInput from '../components/CCSelectInput'
import CCSwitchInput from '../components/CCSwitchInput'
import CCTextInput from '../components/CCTextInput'
import { useGet, usePatch, useDelete } from '../api/values'
import {
    Select, Box, Text, Button, Flex, Spinner, Container, Input, Tooltip, CloseButton, ScaleFade, useDisclosure, Switch,
    FormControl, FormLabel, FormErrorMessage
} from "@chakra-ui/react"


const ScanReportAdminForm = ({ setTitle }) => {
    // scan report id in second to last block of the path
    let scanReportId = window.location.pathname.split("/")
    scanReportId = scanReportId[scanReportId.length - 2]

    const { isOpen, onOpen, onClose } = useDisclosure()
    const [alert, setAlert] = useState({ hidden: true, title: '', description: '', status: 'error' })
    const [scanReport, setScanReport] = useState({})
    const [isAdmin, setIsAdmin] = useState(window.isAdmin)
    const [datasets, setDatasets] = useState();
    const [selectedDataset, setSelectedDataset] = useState()
    const [isPublic, setIsPublic] = useState()
    const [loadingMessage, setLoadingMessage] = useState("Loading page")
    const [formErrors, setFormErrors] = useState({})
    const [uploadLoading, setUploadLoading] = useState(false)
    const [viewers, setViewers] = useState([])
    const [editors, setEditors] = useState([])
    const [usersList, setUsersList] = useState(undefined)

    function getUsersFromIds(userIds, userObjects) {
        /**
         * Get an array user objects with ids in an array of ids.
         * 
         * userIds: Array[Number]
         * userObjects: Array[Object]
         */
        const idIterator = userIds.values()
        let users = []
        for (let id of idIterator) {
            for (let obj of userObjects) {
                if (id === obj.id) {
                    users.push(obj)
                }
            }
        }
        return users
    }

    // Set up page
    useEffect(
        async () => {
            setTitle(null)
            const queries = [
                useGet(`/scanreports/${scanReportId}`),
                useGet("/datasets/"),
                useGet("/users/"),
            ]
            // Get dataset, data partners and users
            const [scanReportQuery, datasetsQuery, usersQuery] = await Promise.all(queries)
            // Set up state from the results of the queries
            setScanReport(scanReportQuery)
            setDatasets(datasetsQuery)
            setSelectedDataset(
                datasetsQuery.find(element => element.id === scanReportQuery.parent_dataset)
            )
            setIsPublic(scanReportQuery.visibility === "PUBLIC")
            setUsersList(usersQuery)
            setViewers(
                prevViewers => [
                    ...prevViewers,
                    ...getUsersFromIds(scanReportQuery.viewers, usersQuery),
                ]
            )
            setEditors(
                prevEditors => [
                    ...prevEditors,
                    ...getUsersFromIds(scanReportQuery.editors, usersQuery),
                ]
            )
            setLoadingMessage(null)  // stop loading when finished
        },
        [], // Required to stop this effect sending infinite requests
    )


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
            <PageHeading text={`Scan Report #${scanReport.id}`} />
            <CCTextInput
                id={"scanreport-name"}
                label={"Name"}
                value={scanReport.name}
                isReadOnly={!isAdmin}
                formErrors={formErrors.name}
            />
            <CCSwitchInput
                id={"scanreport-visibility"}
                label={"Visibility"}
                isChecked={isPublic}
                isReadOnly={!isAdmin}
                checkedMessage={"PUBLIC"}
                notCheckedMessage={"RESTRICTED"}
            />
            <CCSelectInput
                id={"scanreport-dataset"}
                label={"Dataset"}
                value={selectedDataset}
                selectOptions={datasets}
                isReadOnly={!isAdmin}
                formErrors={formErrors.dataset}
            />
            {isAdmin &&
                <Button isLoading={uploadLoading} loadingText='Uploading' mt="10px" onClick={upload}>Submit</Button>
            }
        </Container>
    )
}

export default ScanReportAdminForm