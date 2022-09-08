import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  components: {
    Button: {
      variants: {
        blue: {
          bg: "#475da7",
          color: "white",
        },
        green: {
          bg: "#3db28c",
          color: "white",
        },
        yellow: {
          bg: "#ffc107",
          color: "white",
        },
        red: {
          bg: "#dc3544",
          color: "white",
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
    lightyellow: "#FFFF8A",
    lightred: "#F7BEC0",
    brown: { light: "#C89D7C", bright: "#DCB190" },
    upload: "#ececec",
    prog25: "#fef0d5",
    prog50: "#fbe3a9",
    prog75: "#fbd879",
    pending: "#a3c1e2",
    complete: "#50a95e",
    blocked: "#e84e46",
    in_progress: "#fbd879",
  },
  styles: {
    global: {
      "Tr.largeTbl > Th": {
        p: "5px",
      },
      "Tr.largeTbl > Td": {
        p: "5px",
      },
      "Tr.mediumTbl > Th": {
        p: "8px",
      },
      "Tr.mediumTbl > Td": {
        p: "8px",
      },
    },
  },
});

export default theme;
