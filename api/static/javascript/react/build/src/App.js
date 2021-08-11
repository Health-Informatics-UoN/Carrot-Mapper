import React from "../_snowpack/pkg/react.js";
import {ChakraProvider} from "../_snowpack/pkg/@chakra-ui/react.js";
import styles from "./styles.js";
import DataTbl from "./components/DataTbl.js";
import PageHeading from "./components/PageHeading.js";
const App = () => {
  return /* @__PURE__ */ React.createElement(ChakraProvider, {
    theme: styles
  }, /* @__PURE__ */ React.createElement(PageHeading, {
    text: "Values"
  }), /* @__PURE__ */ React.createElement(DataTbl, null));
};
export default App;
