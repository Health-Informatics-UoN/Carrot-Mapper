import React from 'react'
import RulesTbl from './RulesTbl'
function SummaryTbl({ values, filters, removeFilter, setDestinationFilter, setSourceFilter, destinationTableFilter, sourceTableFilter, scanReportId }) {
    const applyFilters = (variable) => {
        let newData = variable.map((scanreport) => scanreport);
        newData = newData.filter((rule) => !rule.destination_field.name.includes('_source_concept_id'));
        newData = newData.filter((rule) => rule.term_mapping != null);
        if (destinationTableFilter.length > 0) {
            newData = newData.filter((rule) => destinationTableFilter.includes(rule.destination_table.name));
        }
        if (sourceTableFilter.length > 0) {
            newData = newData.filter((rule) => sourceTableFilter.includes(rule.source_table.name));
        }
        return newData;
    }
    return (
        <div>

            <RulesTbl values={values}
                filters={filters} removeFilter={removeFilter} setDestinationFilter={setDestinationFilter} setSourceFilter={setSourceFilter}
                destinationTableFilter={destinationTableFilter} sourceTableFilter={sourceTableFilter} applyFilters={applyFilters} scanReportId={scanReportId} />
        </div>
    )
}

export default SummaryTbl
