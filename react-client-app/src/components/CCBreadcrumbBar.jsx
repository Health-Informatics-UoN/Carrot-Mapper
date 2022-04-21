import React from 'react'
import { Flex, Link, Text } from "@chakra-ui/react"

const CCBreadcrumbBar = ({ pathArray, altNames = null }) => {
    /**
     * Breadcrumb bar to assist navigation.
     * 
     * Required args:
     *  pathArray (Array[Any]): an Array forming the path to the current page.
     *  altNames (Array[String]?): an Array of alternative names to display in
     *      the breadcrumbs (the href won't be affected).
     */

    // Check for required arguments
    if (!pathArray || !Array.isArray(pathArray)) {
        throw TypeError("`pathArray` must be an array. It can be empty (`[]`).")
    }
    if (altNames && (!Array.isArray(altNames) || altNames.length !== pathArray.length)) {
        throw TypeError("`altNames` must be an Array of the same length as `pathArray`")
    }

    const breadcrumbs = ["Home", ...pathArray]
    const altBreadcrumbs = altNames !== null ? ["Home", ...altNames] : null

    return (
        <Flex>
            {
                breadcrumbs.map(
                    (breadcrumb, index) => {
                        return (
                            <>
                                <Link href={`/${pathArray.slice(0, index).join("/")}`}>
                                    {altBreadcrumbs !== null ? altBreadcrumbs[index] : breadcrumb}
                                </Link>
                                {index !== breadcrumbs.length - 1 &&
                                    <Text>&nbsp;/&nbsp;</Text>
                                }
                            </>
                        )
                    }
                )
            }
        </Flex>
    )

}

export default CCBreadcrumbBar