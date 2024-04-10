from typing import List

from shared.data.models import (
    MappingRule,
    ScanReportConcept,
    ScanReportField,
    ScanReportValue,
)


def delete_mapping_rules(table_id: int) -> None:
    """
    Delete existing mapping rules related to a Scan Report Table.

    Args:
        table_id (int): The Id of the ScanReportTable to delete the rules for.

    Returns:
        None
    """
    rules = MappingRule.objects.all().filter(source_field__scan_report_table=table_id)

    rules.delete()


def find_existing_scan_report_concepts(table_id: int) -> List[ScanReportConcept]:
    # TODO: Docs
    # find ScanReportValue associated to this table_id
    # that have at least one concept added to them
    values = (
        ScanReportValue.objects.all()
        .filter(scan_report_field__scan_report_table=table_id)
        .filter(concepts__isnull=False)
        .distinct()
        .order_by("id")
    )

    # find ScanReportField associated to this table_id
    # that have at least one concept added to them
    fields = (
        ScanReportField.objects.all()
        .filter(scan_report_table=table_id)
        .filter(concepts__isnull=False)
        .distinct()
        .order_by("id")
    )

    # retrieve all value concepts
    all_concepts = [concept for obj in values for concept in obj.concepts.all()]
    # retrieve all field concepts
    all_concepts += [concept for obj in fields for concept in obj.concepts.all()]
    return all_concepts


def save_mapping_rules(concept: ScanReportConcept) -> None:
    """
    Save mapping rules from a given ScanReportConcept
    """
    pass


def refresh_mapping_rules(table_id: int):
    """
    TODO: Docs
    """
    delete_mapping_rules(table_id)

    concepts = find_existing_scan_report_concepts(table_id)

    nconcepts = 0
    nbadconcepts = 0

    for concept in concepts:
        if save_mapping_rules(concept):
            nconcepts += 1
        else:
            nbadconcepts += 1
