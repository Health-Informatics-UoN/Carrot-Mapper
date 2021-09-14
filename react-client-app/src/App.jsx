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

const App = ({ page }) => {
    const [title, setTitle] = useState(page);
    const getPage = () => {
        switch (page) {
            case "Values":
                return <DataTbl />
            case "Mapping Rules":
                return <MappingTbl />
            case "Fields":
                return <FieldsTbl />
            case "Tables":
                return <TablesTbl />
            case "Update Table":
                return <EditTable />
            case "Update Field":
                return <EditField setTitle={setTitle}/>
            default:
                return <DataTbl />
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