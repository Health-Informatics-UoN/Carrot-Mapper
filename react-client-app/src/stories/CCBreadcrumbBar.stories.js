import React from "react";
import { Link } from "@chakra-ui/react";
import CCBreadcrumbBar from "../components/CCBreadcrumbBar";

export default {
    title: "Components/CCBreadcrumbBar",
    component: CCBreadcrumbBar,
    subcomponents: {Link}
}

// Home
export const OneCrumb = () => (
    <CCBreadcrumbBar>
        <Link href={"/"}>Home</Link>
    </CCBreadcrumbBar>
)

// Home / Datasets
export const TwoCrumbs = (args) => (
    <CCBreadcrumbBar {...args}>
        <Link href={"/"}>Home</Link>
        <Link href={"/datasets"}>Datasets</Link>
    </CCBreadcrumbBar>
)

// Home / Datasets / 1234 
export const ThreeCrumbs = (args) => (
    <CCBreadcrumbBar {...args}>
        <Link href={"/"}>Home</Link>
        <Link href={"/datasets"}>Datasets</Link>
        <Link href={"/datasets/1234"}>1234</Link>
    </CCBreadcrumbBar>
)
