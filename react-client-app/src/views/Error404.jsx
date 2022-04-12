import React, { useEffect } from 'react'
import {
    Button, Container, Text, VStack
} from "@chakra-ui/react"
import PageHeading from '../components/PageHeading'

const Error404 = ({ setTitle }) => {

    useEffect(() => {
        setTitle(null)
    }, [])

    return (
        <Container maxW='container.xl'>
            <PageHeading text={"Resource not found."} />
            <Text>The resource your are looking for does not exist.</Text>
            <Button onClick={history.back()}>Go Back</Button>
        </Container>
    )
}

export default Error404