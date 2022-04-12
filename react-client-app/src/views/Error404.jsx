import React from 'react'
import {
    Button, Container, HStack
} from "@chakra-ui/react"
import PageHeading from '../components/PageHeading'

const Error404 = () => {
    return (
        <Container maxW='container.xl'>
            <HStack>
                <PageHeading text={"Resource not found."} />
                <Text>The resource your are looking for does not exist.</Text>
                <Button>Go Back</Button>
            </HStack>
        </Container>
    )
}

export default Error404