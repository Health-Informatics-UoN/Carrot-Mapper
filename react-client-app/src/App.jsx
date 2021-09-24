import React, { useState } from 'react'
import { ChakraProvider } from "@chakra-ui/react"
import styles from './styles'
import DataTbl from './components/DataTbl'
import PageHeading from './components/PageHeading'
import MappingTbl from './components/MappingTbl';
import FieldsTbl from './components/FieldsTbl';
import TablesTbl from './components/TablesTbl';
import EditTable from './components/EditTable';
import EditField from './components/EditField';
import ScanReportTbl from './components/ScanReportTbl';
import { getScanReportConcepts,m_allowed_tables,useDelete, useGet,usePost}  from './api/values'
const App = ({ page }) => {

    const handleDeleteConcept = (id, conceptId,valuesRef,setValues,setAlert,onOpen)=>{
        valuesRef.current = valuesRef.current.map((value) => value.id == id ? { ...value, conceptsLoaded: false } : value)
        setValues(valuesRef.current)
        //DEETE Request to API
        useDelete(`scanreportconcepts/${conceptId}`)
            .then(function (response) {
                //Re-fetch the concepts for that particular field
                getScanReportConcepts(id).then(scanreportconcepts => {
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

    const handleAddConcept = ()=>{

    }

    const [title, setTitle] = useState(page);
    const getPage = () => {
        switch (page) {
            case "Values":
                return <DataTbl handleDelete={handleDeleteConcept} />
            case "Mapping Rules":
                return <MappingTbl />
            case "Fields":
                return <FieldsTbl handleDelete={handleDeleteConcept}/>
            case "Tables":
                return <TablesTbl />
            case "Update Table":
                return <EditTable />
            case "Update Field":
                return <EditField setTitle={setTitle}/>
            default:
                return <ScanReportTbl setTitle={setTitle}/>
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