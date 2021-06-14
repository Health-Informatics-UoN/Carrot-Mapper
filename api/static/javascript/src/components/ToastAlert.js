import {Alert, AlertIcon, AlertTitle, AlertDescription, CloseButton, Fade, useDisclosure} from "../../_snowpack/pkg/@chakra-ui/react.js";
import React, {useState} from "../../_snowpack/pkg/react.js";
import PropTypes from "../../_snowpack/pkg/prop-types.js";
const ToastAlert = ({title, description, status}) => {
  return /* @__PURE__ */ React.createElement(Alert, {
    status,
    variant: "left-accent"
  }, /* @__PURE__ */ React.createElement(AlertIcon, null), /* @__PURE__ */ React.createElement(AlertTitle, {
    mr: 2
  }, title), /* @__PURE__ */ React.createElement(AlertDescription, null, description));
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
