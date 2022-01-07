import { Tag, Text, TagCloseButton, Wrap, Tooltip } from '@chakra-ui/react';
import React, { useState } from 'react'
import PropTypes from 'prop-types';

const ConceptTag = ({ conceptId, conceptIdentifier, conceptName, itemId, handleDelete, backgroundColor, creation_type }) => {
    // pass id of concept and determine background colour depending on the id
    const tagColour = (id) => {
        switch (id) {
            case 999:
                return '#ff0000'
            case 111:
                return '#33cc33'
            default:
                if (creation_type) {
                    let color
                    switch (creation_type) {
                        case "vocab":
                            color = "#ff00ff"
                            break
                        case "reuse":
                            color = "#00ff00"
                            break
                        case "manual":
                            color = "#3C579E"
                            break
                        default:
                            color = '#3C579E'
                            break;
                    }
                    return color
                }
                else {
                    return '#3C579E'
                }

        }
    }

    const mapCreationTypeToString = (type)=>{
        let str
        switch (type) {
            case "vocab":
                str = "added through vocab"
                break
            case "reuse":
                str = "added through mapping reuse"
                break
            case "manual":
                str = "manually added"
                break
            default:
                str = 'unknown origins'
                break;
        }
        return str
    }
    return (
        <Tooltip label={creation_type?`${conceptId} ${conceptName} (${mapCreationTypeToString(creation_type)})`:null}>
            <Tag
                size='lg'
                key={conceptId}
                borderRadius="full"
                variant="solid"
                backgroundColor={tagColour(conceptId)}
            >
                <Text w="max-content" ml="8px" py="4px">{conceptId + " " + conceptName} {creation_type ? `(${creation_type.charAt(0)})` : ""}</Text>
                <Wrap direction='right'>
                    <TagCloseButton onClick={() => { handleDelete(itemId, conceptIdentifier) }} />
                </Wrap>


            </Tag>
        </Tooltip>

    )
}

// Storybook Controls
ConceptTag.propTypes = {
    conceptId: PropTypes.string.isRequired,
    backgroundColor: PropTypes.string,
    creation_type: PropTypes.string,
};

// Defaults to dark blue
ConceptTag.defaultProps = {
    //backgroundColor: "#3C579E"
};
export default ConceptTag
