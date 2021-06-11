import React from 'react';
import { ChakraProvider } from "@chakra-ui/react"
import styles from './styles'

const App = () => {
    return (
        <ChakraProvider theme={styles}>

      </ChakraProvider>
   )
}

export default App;