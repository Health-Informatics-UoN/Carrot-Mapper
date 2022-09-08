import React, { useEffect } from "react";
import { Button, Container, Text, VStack } from "@chakra-ui/react";
import PageHeading from "../components/PageHeading";

const Error404 = ({ setTitle }) => {
  useEffect(() => {
    setTitle(null);
  }, []);

  function goBack() {
    history.back();
  }

  return (
    <Container maxW="container.xl">
      <PageHeading text={"Something went wrong."} />
      <Text>
        Could not access the resource you requested. Check that it exists and
        that you have permission to view it.
      </Text>
      <Button onClick={goBack}>Go Back</Button>
    </Container>
  );
};

export default Error404;
