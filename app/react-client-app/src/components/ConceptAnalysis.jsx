import React, { useState, useEffect } from 'react'
import AnalysisTbl from './AnalysisTbl'
import { useGet } from '../api/values'

function ConceptAnalysis({ scan_report_id }) {

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [error, setError] = useState(undefined);


    useEffect(() => {
        useGet(`/analyse/${scan_report_id}/`).then(res => {
            setData(res.data)
            setLoading(false);
            setLoadingMessage("");
        })
            .catch(err => {
                setLoading(false);
                setLoadingMessage("");
                setError("An error has occurred while fetching the rules")
            })
    }, []);


    return (
        <div>
            <AnalysisTbl data={data} />
        </div>
    )
}

export default ConceptAnalysis
