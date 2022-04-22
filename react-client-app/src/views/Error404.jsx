import React, { useEffect } from 'react'
import {
    Button, Container, Text, VStack
} from "@chakra-ui/react"
import PageHeading from '../components/PageHeading'

const Error404 = ({ setTitle }) => {

    useEffect(() => {
        setTitle(null)
    }, [])

    function goBack() {
        history.back()
    }

    return (
        <Container maxW='container.xl'>
            <PageHeading text={"Resource not found."} />
            <Text>The resource you are looking for does not exist.</Text>
            <Button onClick={goBack}>Go Back</Button>
        </Container>
    )
}

export default Error404