import React from "react";
import CCBreadcrumbBar from "../components/CCBreadcrumbBar";
import CCBreadcrumb from "../components/CCBreadcrumb";

export default {
    title: "Components/CCBreadcrumbBar",
    component: CCBreadcrumbBar,
    subcomponents: {CCBreadcrumb}
}

// Home
export const OneCrumb = () => (
    <CCBreadcrumbBar>
        <CCBreadcrumb name={"Home"} link={"/"} />
    </CCBreadcrumbBar>
)

// Home / Datasets
export const TwoCrumbs = (args) => (
    <CCBreadcrumbBar {...args}>
        <CCBreadcrumb name={"Home"} link={"/"} />
        <CCBreadcrumb name={"Datasets"} link={"/datasets"} />
    </CCBreadcrumbBar>
)

// Home / Datasets / 1234 
export const ThreeCrumbs = (args) => (
    <CCBreadcrumbBar {...args}>
        <CCBreadcrumb name={"Home"} link={"/"} />
        <CCBreadcrumb name={"Datasets"} link={"/datasets"} />
        <CCBreadcrumb name={1234} link={"/datasets/1234"} />
    </CCBreadcrumbBar>
)
