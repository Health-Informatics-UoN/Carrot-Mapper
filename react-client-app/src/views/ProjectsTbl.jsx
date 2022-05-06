import React, { useState, useEffect, useRef } from 'react'
import { Flex, Spacer, Link, Text, Grid, GridItem, Spinner } from "@chakra-ui/react"
import { useGet, usePatch, chunkIds } from '../api/values'
import PageHeading from '../components/PageHeading'
import ConceptTag from '../components/ConceptTag'
import CCBreadcrumbBar from '../components/CCBreadcrumbBar'
import moment from 'moment';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import ToastAlert from '../components/ToastAlert'

const ProjectsTbl = () => {
    const [projects, setProjects] = useState([]);
    const [loadingMessage, setLoadingMessage] = useState("Loading Projects")
    // const [ids, setIds] = useState();
    // const a = useRef(null);
    useEffect(() => {

        useGet(`/projects/?datasets`).then(res => {
            setProjects(res)
            let test_projects = res.sort((b, a) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0))
            const datasetObject = {};
            test_projects.map((project) => {
                project.datasets.map((id) => {
                    datasetObject[id] = true;
                })
            });
            const datasetIds = chunkIds(Object.keys(datasetObject));
            const datasetPromises = [];
            for (let i = 0; i < datasetIds.length; i++) {
                datasetPromises.push(useGet(`/datasets/?id__in=${datasetIds[i].join()}`));
            }
            let dataset = await Promise.all(datasetPromises)
            dataset = dataset[0]
            // dataset.forEach((element) => {
            //     test_projects = test_projects.map((project) => {
            //         project.datasets.map((id) => id == element.id ? { ...id, id: element } : id);
            //     })

            // })
            // console.log(test_projects)
        });

        console.log(datasetPromises)
        // datasetPromises.forEach((element) => {
        //     console.log(element)
        //     test_projects.map((project) => {
        //         project.datasets.map((id) => {
        //             id == element.id ? { ...id, name: element.name } : id
        //         })
        //     });
        // });
        console.log(test_projects)
        setLoadingMessage(null)
    })

}, []);
if (loadingMessage) {
    //Render Loading State
    return (
        <div>
            <Flex padding="30px">
                <Spinner />
                <Flex marginLeft="10px">{loadingMessage}</Flex>
            </Flex>
        </div>
    )
}
return (
    <div>
        <CCBreadcrumbBar>
            <Link href={"/"}>Home</Link>
            <Link href={"/projects"}>Projects</Link>
        </CCBreadcrumbBar>
        <Flex>
            <Spacer />
        </Flex>

        <Grid templateColumns="repeat(4, 1fr)" gap={6} >

            <Text fontWeight={"bold"}>Project</Text>
            <Text fontWeight={"bold"}>Datasets</Text>
            {projects.length > 0 ?
                projects.map((item, index) =>
                    <GridItem colSpan={4} w={"100%"} bg={index % 2 == 0 ? 'greyBasic.100' : 'greyBasic.500'} >
                        <Grid templateColumns="repeat(4, 1fr)">
                            <Text>{item.name}</Text>
                            <GridItem colSpan={3} >
                                {item.datasets.map((id) =>
                                    <Grid templateColumns="repeat(3, 1fr)">
                                        <>
                                            <Text><Link href={"/datasets/" + id}>{id}</Link> </Text>
                                        </>

                                    </Grid>
                                )}
                            </GridItem>
                        </Grid>
                    </GridItem >
                ) :
                <Flex padding="30px">
                    <Flex marginLeft="10px">No Datasets in Project</Flex>
                </Flex>
            }
        </Grid >
    </div>
);

}
export default ProjectsTbl;