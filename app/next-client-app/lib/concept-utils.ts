// Method to add concepts to a scanreport result
export const addConceptsToResults = <
  T extends { id: number; concepts?: Concept[] }
>(
  scanReportsResult: T[],
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
            creation_type: scanreportconcept.creation_type,
          });
        }
      }
    });
  }
  return scanReportsResult;
};
