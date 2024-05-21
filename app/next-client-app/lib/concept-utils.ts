// Method to add concepts to a scanreport result
export const addConceptsToResults = (
  scanReportsResult: ScanReportField[],
  scanReportsConcepts: ScanReportConcept[],
  concepts: Concept[]
) => {
  for (const result of scanReportsResult) {
    result.concepts = [];
    scanReportsConcepts.map((scanreportconcept) => {
      if (scanreportconcept.object_id === result.id) {
        let concept = concepts.find(
          (x) => x.concept_id === scanreportconcept.concept
        );
        if (concept) {
          result.concepts?.push({
            ...concept,
            scan_report_concept_id: scanreportconcept.id,
          });
        }
      }
    });
  }
  return scanReportsResult;
};
// TODO: Need to combined somehow
// Method to add concepts to a scanreport result
export const addConceptsToResultsValue = (
  scanReportsResult: ScanReportValue[],
  scanReportsConcepts: ScanReportConcept[],
  concepts: Concept[]
) => {
  for (const result of scanReportsResult) {
    result.concepts = [];
    scanReportsConcepts.map((scanreportconcept) => {
      if (scanreportconcept.object_id === result.id) {
        let concept = concepts.find(
          (x) => x.concept_id === scanreportconcept.concept
        );
        if (concept) {
          result.concepts?.push({
            ...concept,
            scan_report_concept_id: scanreportconcept.id,
          });
        }
      }
    });
  }
  return scanReportsResult;
};
