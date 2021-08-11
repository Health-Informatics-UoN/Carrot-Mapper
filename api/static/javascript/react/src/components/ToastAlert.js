import {Alert, AlertIcon, AlertTitle, AlertDescription, CloseButton, Fade, useDisclosure, Flex} from "../../_snowpack/pkg/@chakra-ui/react.js";
import React, {useState} from "../../_snowpack/pkg/react.js";
import PropTypes from "../../_snowpack/pkg/prop-types.js";
const ToastAlert = ({title, description, status, hide}) => {
  const onClick = () => {
    setHidden(true);
  };
  return /* @__PURE__ */ React.createElement(Flex, {
    paddingTop: 5,
    paddingBottom: 5
  }, /* @__PURE__ */ React.createElement(Alert, {
    status,
    variant: "left-accent"
  }, /* @__PURE__ */ React.createElement(AlertIcon, null), /* @__PURE__ */ React.createElement(AlertTitle, {
    mr: 2
  }, title), /* @__PURE__ */ React.createElement(AlertDescription, null, description), /* @__PURE__ */ React.createElement(CloseButton, {
    position: "absolute",
    right: "8px",
    top: "8px",
    onClick: hide
  })));
};
ToastAlert.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired
};
ToastAlert.defaultProps = {
  title: null,
  description: null,
  status: "error"
};
export default ToastAlert;
