import { extendTheme } from "@chakra-ui/react"

const theme = extendTheme({
  components: {
    Button: {
      variants: {
        "blue": {
          bg: "#475da7",
          color: "white"
        },
        "green": {
          bg: "#3db28c",
          color: "white"
        },
      },
    },
  },
  colors: {
    greyBasic: {
      100: "#F2F1F2",
      // ...
      900: "#1a202c",
    },
  },
})

export default theme