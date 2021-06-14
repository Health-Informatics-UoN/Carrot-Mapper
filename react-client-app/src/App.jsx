import React from 'react';
import { ChakraProvider } from "@chakra-ui/react"
import styles from './styles'
import DataTbl from './components/DataTbl'

const App = () => {
    return (
        <ChakraProvider theme={styles}>
            <DataTbl />
        </ChakraProvider>
   )
}

export default App;