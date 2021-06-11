import React from 'react';
import { ChakraProvider } from "@chakra-ui/react"
import Btn from './components/Btn'

const App = () => {
    return (
        <ChakraProvider>
            <Btn text='Test props'/>
      </ChakraProvider>
   )
}

export default App;