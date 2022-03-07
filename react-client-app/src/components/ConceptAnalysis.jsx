import React from 'react'
import AnalysisTbl from './AnalysisTbl'

function ConceptAnalysis({data, values, filters}) {
    
    return (
        <div>
            <AnalysisTbl data={data} values={values}filters={filters}/>
        </div>
    )
}

export default ConceptAnalysis
