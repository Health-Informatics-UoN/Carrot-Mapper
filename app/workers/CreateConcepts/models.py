from typing import NotRequired, Optional, TypedDict, Union


class ScanReportValueDict(TypedDict):
    id: str
    scan_report_field: int
    value: str
    frequency: int
    concept_id: Union[str, int]
    value_description: Optional[str]
    vocabulary_id: NotRequired[Optional[str]]
    standard_concept: NotRequired[Optional[str]]
