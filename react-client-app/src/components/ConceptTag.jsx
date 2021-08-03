import {Tag,TagLabel, TagCloseButton, Wrap} from '@chakra-ui/react';
import React, { useState } from 'react'
import PropTypes from 'prop-types';

const ConceptTag = ({conceptId,conceptName, itemId, handleDelete, backgroundColor}) => {

    const tagColour = (id) => {
        switch(id) {
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
            <TagLabel padding='5px'>{conceptId}</TagLabel>
            <TagLabel padding='5px'>{conceptName}</TagLabel>
            <Wrap direction='right'>
            <TagCloseButton onClick={() => {handleDelete(itemId, conceptId)}} />
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
