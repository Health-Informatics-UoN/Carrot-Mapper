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
        "yellow": {
          bg: "#ffc107",
          color: "white"
        },
        "red": {
          bg: "#dc3544",
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
    white: "#ffffff",
    orange: { pastel: "#FFB347" },
    green: { pastel: "#C1E1C1", bright: "#66FF00" },
    red: { pastel: "#FF6961", bright: "#EE4B2B" },
    yellow: { pastel: "#FDFD96", bright: "#FFFF00" },
    prog25: "#BFDF00",//75% Yellow, Green
    prog50: "#80D100",//50% Y, 50% G
    prog75: "#40C300",//25% Y, 75% G
    brown: { light: "#C89D7C", bright: "#DCB190" },
  },
  styles: {
    global: {
      "Tr.largeTbl > Th": {
        p: "5px"
      },
      "Tr.largeTbl > Td": {
        p: "5px",
      },
      "Tr.mediumTbl > Th": {
        p: "8px"
      },
      "Tr.mediumTbl > Td": {
        p: "8px",
      },
    },
  },
})

export default theme