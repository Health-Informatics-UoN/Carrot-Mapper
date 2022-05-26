import json
import io
import csv
from datetime import datetime

from django.contrib import messages
from data.models import Concept, ConceptRelationship, ConceptAncestor

from mapping.models import ScanReportTable, ScanReportField, ScanReportValue
from mapping.models import ScanReportConcept, OmopTable, OmopField, Concept, MappingRule

from graphviz import Digraph

from django.http import HttpResponse
from django.db.models import Q


class NonStandardConceptMapsToSelf(Exception):
    pass


# allowed tables
m_allowed_tables = [
    "person",
    "measurement",
    "condition_occurrence",
    "observation",
    "drug_exposure",
]

# look up of date-events in all the allowed (destination) tables
m_date_field_mapper = {
    "person": ["birth_datetime"],
    "condition_occurrence": ["condition_start_datetime", "condition_end_datetime"],
    "measurement": ["measurement_datetime"],
    "observation": ["observation_datetime"],
    "drug_exposure": ["drug_exposure_start_datetime", "drug_exposure_end_datetime"],
}


def find_date_event(source_table):
    """
    convienience function to return the source field of a date event
    for a destination table from the current source table

    Paramaters:
      - source_table (ScanReportTable): object for the scan report table

    Returns:
      - ScanReportField : the source_field that has been marked as the date event
    """
    return source_table.date_event


def find_person_id(source_table):
    """
    convenience function to return the person_id for a source table
    Args:
      - source_table (ScanReportTable)
    Returns:
      - person_id (ScanReportField)
    """
    return source_table.person_id


def get_omop_field(destination_field, destination_table=None):
    """
    function to return the destination_field object, given lookup names
    Args:
      - destination_field (str) : the name of the destination field
      - [optional] destination_table (str) : the name of destination table, if known
    Returns:
      - OmopField : the destination field object
    """

    # if we haven't specified the table name
    if destination_table is None:
        # look up the field from the "allowed_tables"
        omop_field = OmopField.objects.filter(field=destination_field)

        if len(omop_field) > 1:
            return omop_field.filter(table__table__in=m_allowed_tables)[0]
        elif len(omop_field) == 0:
            return None
        else:
            return omop_field[0]

    else:
        # otherwise, if we know which table the field is in, use this to find the field
        omop_field = OmopField.objects.filter(table__table=destination_table).get(
            field=destination_field
        )
    return omop_field


def get_person_id_rule(
    request, scan_report, scan_report_concept, source_table, destination_table
):
    # look up what source_field for this table contains the person id
    person_id_source_field = find_person_id(source_table)

    # get the associated OmopField Object (aka destination_table::person_id)
    person_id_omop_field = OmopField.objects.get(
        table=destination_table, field="person_id"
    )

    # create a new 1-1 rule
    rule_domain_person_id, created = MappingRule.objects.update_or_create(
        scan_report=scan_report,
        omop_field=person_id_omop_field,
        source_field=person_id_source_field,
        concept=scan_report_concept,
        approved=True,
    )
    # return the rule mapping
    return rule_domain_person_id


def get_date_rules(
    request, scan_report, scan_report_concept, source_table, destination_table
):

    #!todo - need some checks for this
    date_event_source_field = find_date_event(source_table)

    date_omop_fields = m_date_field_mapper[destination_table.table]
    # loop over all returned
    # most will return just one date event
    # in the case of condition_occurrence, it returns start and end
    date_rules = []
    for date_omop_field in date_omop_fields:

        # get the actual omop field object
        date_event_omop_field = OmopField.objects.get(
            table=destination_table, field=date_omop_field
        )

        # create a new 1-1 rule
        rule_domain_date_event, created = MappingRule.objects.update_or_create(
            scan_report=scan_report,
            omop_field=date_event_omop_field,
            source_field=date_event_source_field,
            concept=scan_report_concept,
            approved=True,
        )

        date_rules.append(rule_domain_date_event)

    return date_rules


def find_destination_table(request, concept):
    domain = concept.domain_id.lower()
    # get the omop field for the source_concept_id for this domain
    omop_field = get_omop_field(f"{domain}_source_concept_id")
    if omop_field is None:
        if request is not None:
            messages.error(
                request,
                f"Something up with this concept, '{domain}_source_concept_id' does not exist, or is from a table that is not allowed.",
            )
        return None
    # start looking up what table we're looking at
    destination_table = omop_field.table

    if destination_table.table not in m_allowed_tables:
        messages.error(
            request,
            f"Concept {concept.concept_id} ({concept.concept_name}) is from table '{destination_table.table}' which is not implemented yet.",
        )
        return None
    return destination_table


def validate_person_id_and_date(request, source_table):
    """
    Before creating any rules, we need to make sure the person_id and date_event
    has been set
    """

    # find the date event first
    person_id_source_field = find_person_id(source_table)

    if person_id_source_field is None:
        msg = f"No person_id set for this table {source_table}, cannot create rules."
        if request:
            messages.error(request, msg)
        else:
            print(msg)
        return False

    date_event_source_field = find_date_event(source_table)
    if date_event_source_field is None:
        msg = f"No date_event set for this table {source_table}, cannot create rules."
        if request:
            messages.error(msg)
        else:
            print(msg)
        return False

    return True


def save_mapping_rules(request, scan_report_concept):
    """
    function to save the rules
    Args:
       - request (HttpRequest): django object for the request (get/post)
       - scan_report_concept (ScanReportConcept) : object containing the Concept and Link to source_value
    """

    content_object = scan_report_concept.content_object
    if isinstance(content_object, ScanReportValue):
        scan_report_value = content_object
        source_field = scan_report_value.scan_report_field
    else:
        source_field = content_object

    scan_report = source_field.scan_report_table.scan_report

    concept = scan_report_concept.concept

    # start looking up what table we're looking at
    destination_table = find_destination_table(request, concept)
    if destination_table is None:
        if request is not None:
            messages.warning(
                request,
                f"Failed to make rules for {concept.concept_id} ({concept.concept_name})",
            )
        return False

    # get the omop field for the source_concept_id for this domain
    domain = concept.domain_id.lower()
    omop_field = get_omop_field(f"{domain}_source_concept_id")

    # obtain the source table
    source_table = source_field.scan_report_table

    # check whether the person_id and date events for this table are valid
    # if not, we dont want to create any rules for this concept
    if not validate_person_id_and_date(request, source_table):
        return False

    # keep a track of all rules that are being created
    # only safe them if all are successfull
    rules = []

    # create a person_id rule
    person_id_rule = get_person_id_rule(
        request, scan_report, scan_report_concept, source_table, destination_table
    )
    rules.append(person_id_rule)

    # create(potentially multiple) date_rules
    date_rules = get_date_rules(
        request, scan_report, scan_report_concept, source_table, destination_table
    )
    rules += date_rules

    # create/update a model for the domain source_concept_id
    #  - for this destination_field and source_field
    #  - do_term_mapping is set to true:
    #    - all term mapping rules associated need to be applied
    rule_domain_source_concept_id, created = MappingRule.objects.update_or_create(
        scan_report=scan_report,
        omop_field=omop_field,
        source_field=source_field,
        concept=scan_report_concept,
        approved=True,
    )
    rules.append(rule_domain_source_concept_id)

    # create/update a model for the domain concept_id
    #  - for this destination_field and source_field
    #  - do_term_mapping is set to true:
    #    - all term mapping rules associated need to be applied
    rule_domain_concept_id, created = MappingRule.objects.update_or_create(
        scan_report=scan_report,
        omop_field=get_omop_field(f"{domain}_concept_id"),
        source_field=source_field,
        concept=scan_report_concept,
        approved=True,
    )
    rules.append(rule_domain_concept_id)

    # create/update a model for the domain source_value
    #  - for this destination_field and source_field
    #  - do_term_mapping is set to false
    rule_domain_source_value, created = MappingRule.objects.update_or_create(
        scan_report=scan_report,
        omop_field=get_omop_field(f"{domain}_source_value"),
        source_field=source_field,
        concept=scan_report_concept,
        approved=True,
    )
    # add this new concept mapping
    # - the concept wont be used, because  do_term_mapping=False
    # - but we need to preserve the link,
    #   so when all associated concepts are deleted, the rule is deleted
    rules.append(rule_domain_source_value)

    if domain == "measurement":
        # create/update a model for the domain value_as_number
        #  - for this destination_field and source_field
        #  - do_term_mapping is set to false
        rule_domain_value_as_number, created = MappingRule.objects.update_or_create(
            scan_report=scan_report,
            omop_field=get_omop_field("value_as_number", "measurement"),
            source_field=source_field,
            concept=scan_report_concept,
            approved=True,
        )
        rules.append(rule_domain_value_as_number)

    # now we are sure all rules have been created, we can save them safely
    for rule in rules:
        rule.save()

    return True


def get_concept_from_concept_code(concept_code, vocabulary_id, no_source_concept=False):
    """
    Given a concept_code and vocabularly id,
    return the source_concept and concept objects

    If the concept is a standard concept,
    source_concept will be the same object

    Parameters:
      concept_code (str) : the concept code
      vocabulary_id (str) : SNOMED etc.
      no_source_concept (bool) : only return the concept
    Returns:
      tuple( source_concept(Concept), concept(Concept) )
      OR
      concept(Concept)
    """

    # NLP returns SNOMED as SNOWMEDCT_US
    # This sets SNOWMEDCT_US to SNOWMED if this function is
    # used within services_nlp.py
    if vocabulary_id == "SNOMEDCT_US":
        vocabulary_id = "SNOMED"

    # It's RXNORM in NLP but RxNorm in OMOP db, so must convert
    if vocabulary_id == "RXNORM":
        vocabulary_id = "RxNorm"

    # obtain the source_concept given the code and vocab
    source_concept = Concept.objects.get(
        concept_code=concept_code, vocabulary_id=vocabulary_id
    )

    # if the source_concept is standard
    if source_concept.standard_concept == "S":
        # the concept is the same as the source_concept
        concept = source_concept
    else:
        # otherwise we need to look up
        concept = find_standard_concept(source_concept)

    if no_source_concept:
        # only return the concept
        return concept
    else:
        # return both as a tuple
        return (source_concept, concept)


def find_standard_concept(source_concept):
    """
    Args:
      - source_concept(Concept): originally found, potentially non-standard concept
    Returns:
      - Concept: either the same object as input (if input is standard), or a newly found
    """

    # if is standard, return self
    if source_concept.standard_concept == "S":
        return source_concept

    # find the concept relationship, of what this non-standard concept "Maps to"
    concept_relation = ConceptRelationship.objects.get(
        concept_id_1=source_concept.concept_id, relationship_id__contains="Maps to"
    )

    if concept_relation.concept_id_2 == concept_relation.concept_id_1:
        raise NonStandardConceptMapsToSelf(
            "For a non-standard concept "
            "the concept_relation is mapping to itself "
            "i.e. it cannot find an associated standard concept"
        )

    # look up the associated standard-concept
    concept = Concept.objects.get(concept_id=concept_relation.concept_id_2)
    return concept


class Concept2OMOP:
    @staticmethod
    def get_rules_by_scan_report_concept(scan_report_concept_id):

        print("scan_report_concept_id: {}".format(scan_report_concept_id))

        _scan_report_concept = ScanReportConcept.objects.get(pk=scan_report_concept_id)

        print("concept_id: {}".format(_scan_report_concept.concept.concept_id))

        _concept = Concept.objects.get(
            concept_id=_scan_report_concept.concept.concept_id
        )

        serializer = ConceptSerializer(_concept)

        concept = serializer.data

        if concept.get("domain_id") == "Condition":
            """
            https://ohdsi.github.io/TheBookOfOhdsi/CommonDataModel.html#conditionOccurrence

            condition_occurrence_id: This is typically an autogenerated value creating a unique identifier for each record.
            person_id: This is a foreign key to Laura’s record in the PERSON table and links PERSON to CONDITION_OCCURRENCE.
            condition_concept_id: A foreign key referring to the SNOMED code 266599000: 194696.
            condition_start_date: The date when the instance of the Condition is recorded.
            condition_source_value: This is the original source value representing the Condition. In Lauren’s case of dysmenorrhea the SNOMED code for that Condition is stored here, while the Concept representing the code went to the CONDITION_SOURCE_CONCEPT_ID and the Standard Concept mapped from that is stored in the CONDITION_CONCEPT_ID field.
            condition_source_concept_id: If the condition value from the source is coded using a vocabulary that is recognized by OHDSI, the concept ID that represents that value would go here. In the example of dysmennorhea the source value is a SNOMED code so the Concept representing that code is 194696. In this case it has the same value as the CONDITION_CONCEPT_ID field.
            """
            pass

        return concept


def get_mapping_rules_list(structural_mapping_rules):
    """
    Args:
        qs : queryset of all mapping rules
    Returns:
        list : a list of rules that can be interpreted by the view.py
               page and processed to build a json
    """

    # Queryset -> list, makes the calls to the db to get the rules
    structural_mapping_rules = list(structural_mapping_rules)

    # get all scan_report_concepts that are used
    # get the ids first so we can make a batch call
    scan_report_concepts = list(
        set([obj.concept_id for obj in structural_mapping_rules])
    )

    nmapped_concepts = len(scan_report_concepts)

    # make the batch call
    scan_report_concepts = {
        x.id: x
        for x in list(ScanReportConcept.objects.filter(pk__in=scan_report_concepts))
    }
    ntotal_concepts = len(scan_report_concepts.values())

    if nmapped_concepts != ntotal_concepts:
        print(
            "WARNING!! There are a differing number of scan report concepts"
            " associate to the mapping rules, and those that exist as scan report concepts"
        )

    # get all the ids for all ScanReportValues that are used (have been mapped with a concept)
    scan_report_values = [
        obj.object_id
        for obj in scan_report_concepts.values()
        if obj.content_type.model_class() is ScanReportValue
    ]
    # make a batch call to the ORM again..
    scan_report_values = {
        obj.id: obj.value
        for obj in list(ScanReportValue.objects.filter(pk__in=scan_report_values))
    }

    # get all destination field ids
    destination_fields = [obj.omop_field_id for obj in structural_mapping_rules]
    # batch call
    destination_fields = {
        obj.id: obj for obj in list(OmopField.objects.filter(pk__in=destination_fields))
    }

    # again with destination table
    destination_tables = [obj.table_id for obj in destination_fields.values()]
    destination_tables = {
        obj.id: obj for obj in list(OmopTable.objects.filter(pk__in=destination_tables))
    }

    # and sources....
    source_fields = [obj.source_field_id for obj in structural_mapping_rules]
    source_fields = {
        obj.id: obj
        for obj in list(ScanReportField.objects.filter(pk__in=source_fields))
    }
    source_tables = [obj.scan_report_table_id for obj in source_fields.values()]
    source_tables = {
        obj.id: obj
        for obj in list(ScanReportTable.objects.filter(pk__in=source_tables))
    }

    # now looop over the rules to actually create the list version of the rules
    rules = []
    for rule in structural_mapping_rules:

        # get the fields/tables from the loop up lists
        # the speed up comes from here as we dont need to keep hitting the DB to get this data
        # we've already cached it in these dictionaries by making a batch call
        destination_field = destination_fields[rule.omop_field_id]
        destination_table = destination_tables[destination_field.table_id]

        source_field = source_fields[rule.source_field_id]
        source_table = source_tables[source_field.scan_report_table_id]

        # get the concepts again
        scan_report_concept_id = rule.concept_id
        if rule.concept_id not in scan_report_concepts:
            print(f"WARNING!! scan_report_concept {rule.concept_id} no longer exists")
            continue
        scan_report_concept = scan_report_concepts[rule.concept_id]
        concept_id = scan_report_concept.concept_id
        concept_name = scan_report_concept.concept.concept_name

        # work out if we need term_mapping or not
        term_mapping = None
        if "concept_id" in destination_field.field:
            if scan_report_concept.content_type.model_class() is ScanReportValue:
                term_mapping = {
                    scan_report_values[scan_report_concept.object_id]: concept_id
                }
            else:
                term_mapping = concept_id

        creation_type = scan_report_concept.creation_type
        rules.append(
            {
                "rule_id": scan_report_concept_id,
                "rule_name": concept_name,
                "destination_table": destination_table,
                "destination_field": destination_field,
                "source_table": source_table,
                "source_field": source_field,
                "term_mapping": term_mapping,
                "creation_type": creation_type,
            }
        )

    return rules


def get_mapping_rules_json(structural_mapping_rules):
    """
    Args:
        qs : queryset of all mapping rules
    Returns:
        dict : formatted json that can be eaten by the TL-Tool
    """

    # Return empty metadata and cdm if `structural_mapping_rules` is empty
    if not structural_mapping_rules:
        return {"metadata": {}, "cdm": {}}

    # use the first_qs to get the scan_report dataset name
    # all qs items will be from the same scan_report
    first_rule = structural_mapping_rules[0]

    # build some metadata
    metadata = {
        "date_created": datetime.utcnow().isoformat(),
        "dataset": first_rule.scan_report.dataset,
    }

    # get the list of rules
    # this is the same list/function that is used
    #!NOTE: we could cache this to speed things up, as the page load will call this once already
    all_rules = get_mapping_rules_list(structural_mapping_rules)

    cdm = {}
    # loop over the list of rules
    for rule in all_rules:
        # get the rule id
        # i.e. 5 rules with have the same id as they're associated to the same object e.g. person mapping of 'F' to 8532
        # append the rule_id to not overwrite mappings to the same concept ID
        _id = rule["rule_name"] + " " + str(rule["rule_id"])

        # get the table name
        table_name = rule["destination_table"].table

        # make a new object if we havent come across this cdm table yet
        if table_name not in cdm:
            cdm[table_name] = {}

        # reminder, json for ETL needs to be structured like:
        # { 'cdm': {'person': [person_0, person_1], 'condition_occurence:[c1,c2,c3...] }
        # if the sub-object (e.g. <person_0>) has not been made, create a new nested document
        if _id not in cdm[table_name]:
            cdm[table_name][_id] = {}

        # make a new mapping spec for the destination table
        destination_field = rule["destination_field"].field
        cdm[table_name][_id][destination_field] = {
            "source_table": rule["source_table"].name.replace("\ufeff", ""),
            "source_field": rule["source_field"].name.replace("\ufeff", ""),
        }
        # include term_mapping if it's needed
        # will appear for destinations with _concept_id,
        # either as a dict (value map) or as a str/int (field map)
        if rule["term_mapping"] is not None:
            cdm[table_name][_id][destination_field]["term_mapping"] = rule[
                "term_mapping"
            ]

    # add the metadata and cdm object together
    return {"metadata": metadata, "cdm": cdm}


def download_mapping_rules(request, qs):
    # get the mapping rules
    output = get_mapping_rules_json(qs)
    # used the first qs item to get the scan_report name the qs is associated with
    scan_report = qs[0].scan_report
    # make a file name
    return_type = "json"
    fname = f"{scan_report.parent_dataset.data_partner.name}_{scan_report.dataset}_structural_mapping.{return_type}"
    # return a response that downloads the json file

    response = HttpResponse(
        json.dumps(output, indent=6), content_type="application/json"
    )
    response["Content-Disposition"] = f'attachment; filename="{fname}"'
    return response


def download_mapping_rules_as_csv(request, qs):
    # get the mapping rules as a list
    output = get_mapping_rules_list(qs)

    # used the first qs item to get the scan_report name the qs is associated with
    scan_report = qs[0].scan_report
    # make a csv file name
    return_type = "csv"
    fname = f"{scan_report.parent_dataset.data_partner.name}_{scan_report.dataset}_structural_mapping.{return_type}"
    # return a response that downloads the csv file

    # make a string buffer
    _buffer = io.StringIO()
    # setup a csv writter
    writer = csv.writer(
        _buffer,
        lineterminator="\n",
        delimiter=",",
        quoting=csv.QUOTE_MINIMAL,
    )

    # setup the headers from the first object
    # replace term_mapping ({'source_value':'concept'}) with separate columns
    headers = [str(x) for x in output[0].keys() if str(x) != "term_mapping"]
    headers += ["source_value", "concept", "isFieldMapping"]

    # write the headers to the csv
    writer.writerow(headers)

    # loop over the content
    for content in output:
        # replace the django model objects with string names
        content["destination_table"] = content["destination_table"].table
        content["destination_field"] = content["destination_field"].field
        content["source_table"] = content["source_table"].name
        content["source_field"] = content["source_field"].name

        # pop out the term mapping
        term_mapping = content.pop("term_mapping")
        content["isFieldMapping"] = ""
        # if no term mapping, set columns to blank
        if term_mapping is None:
            content["source_value"] = ""
            content["concept"] = ""
        elif isinstance(term_mapping, dict):
            # if is a dict, it's a map between a source value and a concept
            # set these based on the value/key
            content["source_value"] = list(term_mapping.keys())[0]
            content["concept"] = list(term_mapping.values())[0]
            content["isFieldMapping"] = "0"
        else:
            # otherwise it is a scalar, it is a term map of a field, so set this
            content["source_value"] = ""
            content["concept"] = term_mapping
            content["isFieldMapping"] = "1"

        # extract and write the contents now
        content = [str(content[x]) for x in headers]
        writer.writerow(content)

    # rewind the buffer and return the response
    _buffer.seek(0)
    response = HttpResponse(_buffer, content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{fname}"'

    return response


colorscheme = "gnbu9"


def make_dag(data, colorscheme="gnbu9"):

    dot = Digraph(strict=True, format="svg")
    dot.attr(rankdir="RL")
    with dot.subgraph(name="cluster_0") as dest, dot.subgraph(name="cluster_1") as inp:
        dest.attr(
            style="filled",
            fillcolor="2",
            colorscheme="blues9",
            penwidth="0",
            label="Destination",
        )
        inp.attr(
            style="filled",
            fillcolor="2",
            colorscheme="greens9",
            penwidth="0",
            label="Source",
        )

        for destination_table_name, destination_tables in data.items():
            dest.node(
                destination_table_name,
                shape="folder",
                style="filled",
                fontcolor="white",
                colorscheme=colorscheme,
                fillcolor="9",
            )

            for ref_name, destination_table in destination_tables.items():
                for destination_field, source in destination_table.items():
                    source_field = source["source_field"]
                    source_table = source["source_table"]

                    table_name = f"{destination_table_name}_{destination_field}"
                    dest.node(
                        table_name,
                        label=destination_field,
                        style="filled,rounded",
                        colorscheme=colorscheme,
                        fillcolor="7",
                        shape="box",
                        fontcolor="white",
                    )

                    dest.edge(destination_table_name, table_name, arrowhead="none")

                    source_field_name = f"{source_table}_{source_field}"
                    inp.node(
                        source_field_name,
                        source_field,
                        colorscheme=colorscheme,
                        style="filled,rounded",
                        fillcolor="5",
                        shape="box",
                    )

                    if "term_mapping" in source and source["term_mapping"] is not None:
                        dot.edge(
                            table_name,
                            source_field_name,
                            dir="back",
                            color="red",
                            penwidth="2",
                        )
                    else:
                        dot.edge(
                            table_name, source_field_name, dir="back", penwidth="2"
                        )

                    inp.node(
                        source_table,
                        shape="tab",
                        fillcolor="4",
                        colorscheme=colorscheme,
                        style="filled",
                    )
                    inp.edge(source_field_name, source_table, arrowhead="none")

    return dot.pipe().decode("utf-8")


# this is here as we should move it out of coconnect.tools
def view_mapping_rules(request, qs):
    # get the rules
    output = get_mapping_rules_json(qs)
    # use make dag svg image
    svg = make_dag(output["cdm"])
    # return a svg response
    response = HttpResponse(svg, content_type="image/svg+xml")
    return response


def find_existing_scan_report_concepts(request, table_id):

    # find ScanReportValue associated to this table_id
    # that have at least one concept added to them
    values = (
        ScanReportValue.objects.all()
        .filter(scan_report_field__scan_report_table__scan_report=table_id)
        .filter(concepts__isnull=False)
    )

    # find ScanReportField associated to this table_id
    # that have at least one concept added to them
    fields = (
        ScanReportField.objects.all()
        .filter(scan_report_table__scan_report=table_id)
        .filter(concepts__isnull=False)
    )

    # retrieve all value concepts
    all_concepts = [concept for obj in values for concept in obj.concepts.all()]
    # retrieve all field concepts
    all_concepts += [concept for obj in fields for concept in obj.concepts.all()]
    return all_concepts


#! NOTE
# this could be slow if there are 100s of concepts to be added
def save_multiple_mapping_rules(request, all_concepts):
    # now loop over all concepts and save new rules
    for concept in all_concepts:
        save_mapping_rules(request, concept)


def remove_mapping_rules(request, scan_report_id):
    """
    Function given a scan_report_id that will find all
    associated mappings and delete them
    """
    rules = MappingRule.objects.all().filter(scan_report__id=scan_report_id)

    rules.delete()


def get_concept_details(h_concept_id):
    """
    Given a mapping rule and its descendant/ancestor concept id
    Find the source field/value that the descendant/ancestor is mapped to,
    Return the mapping rule name, the descendant/ancestor name, and the source fields/tables
    """
    # Get the descendant/ancestor concept name
    concept_name = Concept.objects.get(concept_id=h_concept_id).concept_name

    # Get the source field id, source field name, source table id,
    # source table name and the content type of the descendant/ancestor
    # Filter out mapping rules pointing to omop fields:
    # person id, datetime, or source_concept_id to account for duplicated mapping rules
    source_ids = (
        MappingRule.objects.filter(concept__concept=h_concept_id)
        .exclude(
            Q(omop_field__field__icontains="person_id")
            | Q(omop_field__field__icontains="datetime")
            | Q(omop_field__field__icontains="source")
        )
        .values(
            "source_field__id",
            "source_field__name",
            "source_field__scan_report_table__id",
            "source_field__scan_report_table__name",
            "source_field__scan_report_table__scan_report",
            "concept__content_type",
        )
    ).distinct()
    return (concept_name, source_ids)


def analyse_concepts(scan_report_id):
    """
    Given a scan_report_id get all the mapping rules in that Scan Report.
    Get all the mapping rules from every other Scan Report and compare them against the current ones
    If there are any ancestors/descendants of the current mapping rules mapped in another Scan Report
    Find where those ancestors/descendants are mapped to
    """

    # Get mapping rules for current scan report
    mapping_rules = (
        MappingRule.objects.all()
        .filter(scan_report_id=scan_report_id)
        .values_list("concept__concept", flat=True)
        .distinct()
    )
    # Get mapping rules for all other scan reports
    all_mapping_rules = MappingRule.objects.exclude(
        scan_report_id=scan_report_id
    ).values_list("concept__concept", flat=True)

    data = []
    descendant_list = []
    ancestors_list = []
    # For every mapping rule in the current scan report
    for rule in mapping_rules:
        # Get the name of the mapping rule concept
        rule_name = Concept.objects.get(concept_id=rule).concept_name
        # Find the descendants of that rule
        descendants = ConceptAncestor.objects.filter(ancestor_concept_id=rule)
        # Find the ancestors of that rule
        ancestors = ConceptAncestor.objects.filter(descendant_concept_id=rule)

        # For each descendant found
        for descendant in descendants:
            # get the concept id
            desc = descendant.descendant_concept_id
            desc_level = (
                str(descendant.min_levels_of_separation) + "/",
                str(descendant.max_levels_of_separation),
            )
            # Check if the descendant is a mapped concept in any other scan report
            # and that it's not the same as the original concept
            if (desc in all_mapping_rules) and (desc != rule):

                # Get all the details for that descendant:
                # descendant name, current mapping rule name, where that descendant is mapped to
                desc_name, source_ids = get_concept_details(desc)
                # Append all descendant details to a list
                descendant_list.append(
                    {
                        "d_id": desc,
                        "d_name": desc_name,
                        "source": source_ids,
                        "level": desc_level,
                    }
                )
        # For each ancestor found
        for ancestor in ancestors:
            # get the concept_id
            anc = ancestor.ancestor_concept_id
            anc_level = (
                str(ancestor.min_levels_of_separation) + "/",
                str(ancestor.max_levels_of_separation),
            )
            # If ancestor is a mapping rule in any other scan report,
            # and is not the same rule as the current one
            if (anc in all_mapping_rules) and (anc != rule):

                # Get all the details for that ancestor:
                # ancestor name, current mapping rule name, where that ancestor is mapped to
                concept, source_ids = get_concept_details(anc)
                # Append all the ancestor details to a list
                ancestors_list.append(
                    {
                        "a_id": anc,
                        "a_name": concept,
                        "source": source_ids,
                        "level": anc_level,
                    }
                )

        # Append all the descendants/ancestors of the current mapping rule in a dict
        # Do not append if both lists are empty
        if ancestors_list or descendant_list:
            data.append(
                {
                    "rule_id": rule,
                    "rule_name": rule_name,
                    "anc_desc": [
                        {
                            "descendants": descendant_list,
                            "ancestors": ancestors_list,
                        }
                    ],
                }
            )
        # Reset lists before moving on to the next mapping rule
        descendant_list = []
        ancestors_list = []

    return {"data": data}
