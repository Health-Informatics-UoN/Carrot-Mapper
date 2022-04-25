import React from 'react'
import { Link } from "@chakra-ui/react"

const CCBreadcrumb = ({ name, link }) => {
    /**
     * Reusable breadcrumb component. 
     * 
     * Required args:
     *  name (String): the text to display for the crumb.
     *  link (String): the link to the destination of the crumb.
     */
    return <Link href={link}>{name}</Link>
}

export default CCBreadcrumb