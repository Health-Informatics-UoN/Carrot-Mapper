import React from "react";
import CCBreadcrumbBar from "../components/CCBreadcrumbBar";

export default {
    title: "Components/CCBreadcrumbBar",
    component: CCBreadcrumbBar,
}


const Template = (args) => <CCBreadcrumbBar {...args} />;

// Home
export const CrumbsAtRoot = Template.bind()
CrumbsAtRoot.args = {pathArray : []}

// Home / Datasets
export const OneCrumb = Template.bind()
OneCrumb.args = {pathArray : ["Datasets"]}

// Home / Datasets / 1234
export const TwoCrumbs = Template.bind()
TwoCrumbs.args = {pathArray : ["Datasets", 1234]}

// Home / Datasets / 1234 / Details
export const ThreeCrumbs = Template.bind()
ThreeCrumbs.args = {pathArray : ["Datasets", 1234, "Details"]}

// Throws TypeError
export const UndefindedCrumbs = Template.bind()
UndefindedCrumbs.args = {pathArray : undefined}

// Throws TypeError
export const NonArrayCrumbs = Template.bind()
NonArrayCrumbs.args = {pathArray : "abc"}

// Home / Datasets / The Fellowship of The Ring / Details
export const AltNames = Template.bind()
AltNames.args = {
    pathArray : ["Datasets", 1234, "Details"],
    altNames : ["Datasets", "The Fellowship of The Ring", "Details"]
}

// Throws TypeError
export const AltNamesNotEqualLength = Template.bind()
AltNamesNotEqualLength.args = {
    pathArray : ["Datasets", 1234, "Details"],
    altNames : ["Datasets", "The Fellowship of The Ring"]
}

// Throws TypeError
export const AltNamesNotArray = Template.bind()
AltNamesNotArray.args = {
    pathArray : ["Datasets", 1234, "Details"],
    altNames : "Not an Array"
}