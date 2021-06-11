import {Alert, AlertIcon, AlertTitle, AlertDescription, CloseButton, Fade, useDisclosure} from '@chakra-ui/react';
import React, { useState } from 'react'
import PropTypes from 'prop-types';

const ToastAlert = ({title, description, status}) => {
    return (
            <Alert status={status}  variant="left-accent">
                <AlertIcon />
                <AlertTitle mr={2}>{title}</AlertTitle>
                <AlertDescription>{description}</AlertDescription>
            </Alert>
    )
}

// Storybook Controls
ToastAlert.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired
};

// Defaults to dark blue
ToastAlert.defaultProps = {
    title: null,
    description: null,
    status: 'error'
  };

export default ToastAlert
