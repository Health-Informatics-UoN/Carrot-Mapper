import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  Fade,
  useDisclosure,
  Flex,
} from "@chakra-ui/react";
import React, { useState } from "react";
import PropTypes from "prop-types";

const ToastAlert = ({ title, description, status, hide }) => {
  //const [hidden, setHidden] = useState(hide)

  const onClick = () => {
    setHidden(true);
  };

  return (
    <Flex paddingTop={5} paddingBottom={5}>
      <Alert status={status} variant="left-accent">
        <AlertIcon />
        <AlertTitle mr={2}>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
        <CloseButton position="absolute" right="8px" top="8px" onClick={hide} />
      </Alert>
    </Flex>
  );
};

// Storybook Controls
ToastAlert.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
};

// Defaults to dark blue
ToastAlert.defaultProps = {
  title: null,
  description: null,
  status: "error",
};

export default ToastAlert;
