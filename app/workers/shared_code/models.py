from enum import Enum
from typing import Any, Dict, NotRequired, Optional, TypedDict, Union


class ScanReportConceptContentType(Enum):
    FIELD = "scanreportfield"
    VALUE = "scanreportvalue"


class ScanReportFieldDict(TypedDict):
    id: str
    name: str


class ScanReportValueDict(TypedDict):
    id: str
    scan_report_field: ScanReportFieldDict
    value: str
    frequency: int
    concept_id: Union[str, int]
    value_description: Optional[str]
    vocabulary_id: NotRequired[Optional[str]]
    standard_concept: NotRequired[Optional[str]]
