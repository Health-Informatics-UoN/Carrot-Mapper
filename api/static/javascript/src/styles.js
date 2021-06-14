import { extendTheme } from "../_snowpack/pkg/@chakra-ui/react.js"

const theme = extendTheme({
    colors: {
      greyBasic: {
        100: "#F2F1F2",
        // ...
        900: "#1a202c",
      },
    },
  })
  
  export default theme