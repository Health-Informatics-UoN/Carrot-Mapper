import React from 'react';
import { ChakraProvider } from "@chakra-ui/react"
import styles from './styles'
import DataTbl from './components/DataTbl'
import PageHeading from './components/PageHeading'
import MappingTbl from './components/MappingTbl';
import FieldsTbl from './components/FieldsTbl';
import TablesTbl from './components/TablesTbl';

const App = ({ page }) => {
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
            default:
                return <DataTbl />
        }
    }
    return (
        <ChakraProvider theme={styles}>
            <PageHeading text={page} />
            {getPage()}
        </ChakraProvider>
    )
}

export default App;