import React, { useState, useEffect, useRef } from 'react'
import PageHeading from '../components/PageHeading'
import ToastAlert from '../components/ToastAlert'
import CCMultiSelectInput from '../components/CCMultiSelectInput'
import CCSelectInput from '../components/CCSelectInput'
import CCSwitchInput from '../components/CCSwitchInput'
import CCTextInput from '../components/CCTextInput'
import { useGet, usePatch, useDelete } from '../api/values'
import {
    Button, Flex, Spinner, Container, ScaleFade, useDisclosure
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
    const [author, setAuthor] = useState();
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
            setAuthor(
                usersQuery.find(element => element.id == scanReportQuery.author)
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


    // Update scan report dataset (the actual name)
    function handleNameInput(newValue) {
        setScanReport({ ...scanReport, dataset: newValue })
    }

    // Update scan report visibility
    function handleVisibilitySwitch(newValue) {
        setIsPublic(newValue)
        setScanReport({ ...scanReport, visibility: newValue ? "PUBLIC" : "RESTRICTED" })
    }

    // Update scan report parent dataset
    function handleDatasetSelect(newValue) {
        const dataset = datasets.find(el => el.name === newValue)
        console.log(dataset)
        setSelectedDataset(dataset)
        setScanReport({ ...scanReport, parent_dataset: dataset.id })
    }

    // Update scan report author
    function handleAuthorSelect(newValue) {
        const newAuthor = usersList.find(el => el.username === newValue)
        console.log(newAuthor)
        setAuthor(newAuthor)
        setScanReport({ ...scanReport, author: newAuthor.id })
    }

    // Update scan report viewers
    function handleViewersInput(newViewers) {
        console.log(newViewers)
    }

    // Update scan report editors
    function handleEditorsInput(newEditors) {
        console.log(newEditors)
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
            <PageHeading text={`Scan Report #${scanReport.id}`} />
            <CCTextInput
                id={"scanreport-name"}
                label={"Name"}
                value={scanReport.dataset}
                handleInput={handleNameInput}
                isDisabled={!isAdmin}
                formErrors={formErrors.dataset}
            />
            <CCSelectInput
                id={"scanreport-author"}
                label={"Author"}
                value={author.username}
                selectOptions={usersList.map(item => item.username)}
                handleInput={handleAuthorSelect}
                isDisabled={!isAdmin}
                formErrors={formErrors.dataset}
            />
            <CCSwitchInput
                id={"scanreport-visibility"}
                label={"Visibility"}
                isChecked={isPublic}
                isDisabled={!isAdmin}
                handleInput={handleVisibilitySwitch}
                checkedMessage={"PUBLIC"}
                notCheckedMessage={"RESTRICTED"}
            />
            {!isPublic &&
                <CCMultiSelectInput
                    id={"scanreport-viewers"}
                    label={"Viewers"}
                    isDisabled={!isAdmin}
                    selectOptions={usersList.map(item => item.username)}
                    currentSelections={viewers.map(item => item.username)}
                    handleInput={handleViewersInput}
                />
            }
            <CCMultiSelectInput
                id={"scanreport-editors"}
                label={"Editors"}
                isDisabled={!isAdmin}
                selectOptions={usersList.map(item => item.username)}
                currentSelections={editors.map(item => item.username)}
                handleInput={handleEditorsInput}
            />
            <CCSelectInput
                id={"scanreport-dataset"}
                label={"Dataset"}
                value={selectedDataset}
                selectOptions={datasets.map(item => item.name)}
                handleInput={handleDatasetSelect}
                isDisabled={!isAdmin}
                formErrors={formErrors.dataset}
            />
            {isAdmin &&
                <Button isLoading={uploadLoading} loadingText='Uploading' mt="10px" onClick={upload}>Submit</Button>
            }
        </Container>
    )
}

export default ScanReportAdminForm