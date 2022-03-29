import React, { useState } from 'react'
import { ChakraProvider } from "@chakra-ui/react"
import styles from './styles'
import DatasetAdminForm from './components/DatasetAdminForm'
import ValuesTbl from './components/ValuesTbl'
import PageHeading from './components/PageHeading'
import MappingTbl from './components/MappingTbl';
import FieldsTbl from './components/FieldsTbl';
import TablesTbl from './components/TablesTbl';
import EditTable from './components/EditTable';
import EditField from './components/EditField';
import ScanReportTbl from './components/ScanReportTbl';
import ScanReportAdminForm from './views/ScanReportAdminForm'
import Home from './components/Home';
import { getScanReportConcepts, m_allowed_tables, useDelete, useGet, usePost, mapConceptToOmopField, saveMappingRules } from './api/values'
import UploadScanReport from './components/UploadScanReport'
import DatasetsContent from './views/DatasetsContent'
const App = ({ page }) => {

    const handleDeleteConcept = (id, conceptId, valuesRef, setValues, setAlert, onOpen) => {
        valuesRef.current = valuesRef.current.map((value) => value.id == id ? { ...value, conceptsLoaded: false } : value)
        setValues(valuesRef.current)
        //DEETE Request to API
        useDelete(`/scanreportconcepts/${conceptId}`)
            .then(function (response) {
                //Re-fetch the concepts for that particular field
                getScanReportConcepts(id).then(async scanreportconcepts => {
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
                        // if scan report now has no concepts set concepts of specified scan report to be an empty array
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
                // return to original state if an error occurs while trying to delete the concept
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

    const handleAddConcept = (id, concept, valuesRef, setValues, setAlert, onOpen, table, content_type) => {
        // check if input field has anything typed into it
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
            if (!table.person_id && !table.date_event) { message = 'Please set the person_id and a date_event on the table ' }
            else if (!table.person_id) { message = 'Please set the person_id on the table ' }
            else { message = 'Please set the date_event on the table ' }
            setAlert({
                hidden: false,
                status: 'error',
                title: message + table.name + ' before you add a concept.',
                description: 'Unsuccessful'
            })
            onOpen()
        }
        else {
            const scanReportValue = valuesRef.current.find(f => f.id === id)
            valuesRef.current = valuesRef.current.map((value) => value.id == id ? { ...value, conceptsLoaded: false } : value)
            setValues(valuesRef.current)
            // check if concept exists
            useGet(`/omop/concepts/${concept}/`)
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
                    const omopTable = await useGet(`/omoptables/${destination_field.table}/`)
                    if (!m_allowed_tables.includes(omopTable.table)) {
                        valuesRef.current = valuesRef.current.map((value) => value.id == id ? { ...value, conceptsLoaded: true } : value)
                        setValues(valuesRef.current)
                        setAlert({
                            hidden: false,
                            status: 'error',
                            title: "Have not yet implemented concept",
                            description: `Concept ${response.concept_id} (${response.concept_name}) is from table '${omopTable.table}' which is not implemented yet.`
                        })
                        onOpen()
                        return
                    }
                    // create scan report concept
                    const data =
                    {
                        concept: concept,
                        object_id: id,
                        content_type: content_type,
                        creation_type: "M",
                    }
                    usePost(`/scanreportconcepts/`, data)
                        .then(function (response) {
                            //Re-fetch scan report concepts for field     
                            getScanReportConcepts(id).then(async scanreportconcepts => {
                                if (scanreportconcepts.length > 0) {

                                    const conceptIds = scanreportconcepts.map(value => value.concept)
                                    useGet(`/omop/conceptsfilter/?concept_id__in=${conceptIds.join()}`)
                                        .then((values) => {
                                            // save new concepts to state
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
                                            // create mapping rules for new concept
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
                                    // if no concept is found after a concept has been added then something has gone wrong
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
                            // if an error occurs while trying to add the concept, return to original state
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
                    // if an error occurs while trying to check if the concept exists, return to original state
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

    const [title, setTitle] = useState(page);
    // render the page specified in the page variable
    const getPage = () => {
        switch (page) {
            case "Home":
                return <Home />
            case "Values":
                return <ValuesTbl handleDelete={handleDeleteConcept} handleSubmit={handleAddConcept} />
            case "Mapping Rules":
                return <MappingTbl />
            case "Fields":
                return <FieldsTbl handleDelete={handleDeleteConcept} handleSubmit={handleAddConcept} />
            case "Tables":
                return <TablesTbl />
            case "Update Table":
                return <EditTable />
            case "Update Field":
                return <EditField setTitle={setTitle} />
            case "New Scan Report":
                return <UploadScanReport setTitle={setTitle} />
            case "Dataset Admin":
                return <DatasetAdminForm setTitle={setTitle} />
            case "Dataset Content":
                return <DatasetsContent setTitle={setTitle}/>
            case "Scan Report Admin":
                return <ScanReportAdminForm setTitle={setTitle} />
            default:
                return <ScanReportTbl setTitle={setTitle} />
        }
    }
    return (
        <ChakraProvider theme={styles}>
            <PageHeading text={title} />
            {getPage()}
        </ChakraProvider>
    )
}

export default App;
