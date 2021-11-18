import { Tag, Text, TagCloseButton, Wrap } from '@chakra-ui/react';
import React, { useState } from 'react'
import PropTypes from 'prop-types';

const ConceptTag = ({ conceptId, conceptIdentifier, conceptName, itemId, handleDelete, backgroundColor }) => {
    // pass id of concept and determine background colour depending on the id
    const tagColour = (id) => {
        switch (id) {
            case 999:
                return '#ff0000'
            case 111:
                return '#33cc33'
            default:
                return backgroundColor
        }
    }

    return (
        <Tag
            size='lg'
            key={conceptId}
            borderRadius="full"
            variant="solid"
            backgroundColor={tagColour(conceptId)}
        >
            <Text w="max-content" ml="8px" py="4px">{conceptId + " " + conceptName}</Text>
            <Wrap direction='right'>
                <TagCloseButton onClick={() => { handleDelete(itemId, conceptIdentifier) }} />
            </Wrap>


        </Tag>

    )
}

// Storybook Controls
ConceptTag.propTypes = {
    conceptId: PropTypes.string.isRequired,
    backgroundColor: PropTypes.string,
};

// Defaults to dark blue
ConceptTag.defaultProps = {
    backgroundColor: "#3C579E"
};
export default ConceptTag
