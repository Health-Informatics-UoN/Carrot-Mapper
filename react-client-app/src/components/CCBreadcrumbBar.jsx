import React from 'react'
import {
    ArrowForwardIcon, Flex, Link
} from "@chakra-ui/react"

const CCBreadcrumbBar = ({ pathArray }) => {
    const breadcrumbs = ["Home", ...pathArray]
    const lastBreadcrumb = breadcrumbs.length > 1 ? breadcrumbs.pop() : null

    return (
        <Flex>
            {
                breadcrumbs.map(
                    (breadcrum, index) => {
                        return (
                            <>
                                <Link href={`/${pathArray.slice(0, index).join("/")}`}>{breadcrum}</Link>
                                {/* <ArrowForwardIcon /> */}
                            </>
                        )
                    }
                )
            }
            <Link href={`/${pathArray.join("/")}`}>{lastBreadcrumb}</Link>
        </Flex>
    )

}

export default CCBreadcrumbBar