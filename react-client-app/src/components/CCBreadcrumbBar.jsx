import React from 'react'
import { Flex, Text } from "@chakra-ui/react"

const CCBreadcrumbBar = (props) => {
    /**
     * Breadcrumb bar to assist navigation.
     */

    return (
        <Flex>
            {
                React.Children.map(
                    props.children,
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
            }
        </Flex>
    )

}

export default CCBreadcrumbBar