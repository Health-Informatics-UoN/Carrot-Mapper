import React from 'react'
import { Link } from "@chakra-ui/react"

const CCBreadcrumb = ({ name, link }) => {
    return <Link href={link}>{name}</Link>
}

export default CCBreadcrumb