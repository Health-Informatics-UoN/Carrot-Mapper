import React from "react";
import CCBreadcrumbBar from "../components/CCBreadcrumbBar";

export default {
    title: "Components/CCBreadcrumbBar",
    component: CCBreadcrumbBar,
}


const Template = (args) => <CCBreadcrumbBar {...args} />;

export const CrumbsAtRoot = Template.bind()
CrumbsAtRoot.args = {pathArray : []}

export const OneCrumb = Template.bind()
OneCrumb.args = {pathArray : ["Datasets"]}

export const TwoCrumbs = Template.bind()
TwoCrumbs.args = {pathArray : ["Datasets", 1234]}