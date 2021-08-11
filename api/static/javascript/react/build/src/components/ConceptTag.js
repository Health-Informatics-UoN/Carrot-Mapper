import {Tag, TagLabel, TagCloseButton, Wrap} from "../../_snowpack/pkg/@chakra-ui/react.js";
import React, {useState} from "../../_snowpack/pkg/react.js";
import PropTypes from "../../_snowpack/pkg/prop-types.js";
const ConceptTag = ({conceptId, conceptName, itemId, handleDelete, backgroundColor}) => {
  const tagColour = (id) => {
    switch (id) {
      case 999:
        return "#ff0000";
      case 111:
        return "#33cc33";
      default:
        return backgroundColor;
    }
  };
  return /* @__PURE__ */ React.createElement(Tag, {
    size: "lg",
    key: conceptId,
    borderRadius: "full",
    variant: "solid",
    backgroundColor: tagColour(conceptId)
  }, /* @__PURE__ */ React.createElement(TagLabel, {
    padding: "5px"
  }, conceptId), /* @__PURE__ */ React.createElement(TagLabel, {
    padding: "5px"
  }, conceptName), /* @__PURE__ */ React.createElement(Wrap, {
    direction: "right"
  }, /* @__PURE__ */ React.createElement(TagCloseButton, {
    onClick: () => {
      handleDelete(itemId, conceptId);
    }
  })));
};
ConceptTag.propTypes = {
  conceptId: PropTypes.string.isRequired,
  backgroundColor: PropTypes.string
};
ConceptTag.defaultProps = {
  backgroundColor: "#3C579E"
};
export default ConceptTag;
