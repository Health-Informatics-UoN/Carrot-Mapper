import React from 'react'
import { Flex, Text } from "@chakra-ui/react"

const CCBreadcrumbBar = (props) => {
    /**
     * Breadcrumb bar to assist navigation.
     */

    return (
        <Flex>
            {
                props.children.length ? props.children.map(
                    (breadcrumb, index) => {
                        return (
                            <>
                                {breadcrumb}
                                {index !== props.children.length - 1 &&
                                    <Text>&nbsp;/&nbsp;</Text>
                                }
                            </>
                        )
                    }
                )
                    :
                    props.children
            }
        </Flex>
    )

}

export default CCBreadcrumbBar