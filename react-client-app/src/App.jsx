import React from 'react';
import { ChakraProvider } from "@chakra-ui/react"
import styles from './styles'
import DataTbl from './components/DataTbl'
import PageHeading from './components/PageHeading'

const App = () => {
    return (
        <ChakraProvider theme={styles}>
            <PageHeading text='Values' />
            <DataTbl />
        </ChakraProvider>
   )
}

export default App;