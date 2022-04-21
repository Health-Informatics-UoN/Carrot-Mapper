import React from 'react'
import { Flex, Link, Text } from "@chakra-ui/react"

const CCBreadcrumbBar = ({ pathArray }) => {
    /**
     * Breadcrumb bar to assist navigation.
     * 
     * Required args:
     *  pathArray (Array[Any]): an Array forming the path to the current page.
     */

    // Check for required arguments
    if (!pathArray || !Array.isArray(pathArray)) {
        throw TypeError("`pathArray` must be an array. It can be empty (`[]`).")
    }

    const breadcrumbs = ["Home", ...pathArray]

    return (
        <Flex>
            {
                breadcrumbs.map(
                    (breadcrumb, index) => {
                        return (
                            <>
                                <Link href={`/${pathArray.slice(0, index).join("/")}`}>{breadcrumb}</Link>
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