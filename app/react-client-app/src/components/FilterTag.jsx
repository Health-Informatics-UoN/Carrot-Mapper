import {Tag,TagLabel, TagCloseButton, Wrap} from '@chakra-ui/react';
import React, { useState } from 'react'
import PropTypes from 'prop-types';

const FilterTag = ({selected,tagName, handleClick,popping}) => {

    return (
        <Tag
            size='lg'
            variant="solid"
            backgroundColor={selected?"#3db28c":"#3C579E"}
            onClick={() => {
                popping.current=false
                handleClick(tagName)
            }}
            style={{cursor:'pointer'}}
            >
            <TagLabel padding='5px'>{tagName}</TagLabel>
         </Tag>
        
    )
}

// Storybook Controls
FilterTag.propTypes = {
    tagName: PropTypes.string.isRequired,
};


FilterTag.defaultProps = {
    tagName: "All"
  };
export default FilterTag