from django.contrib import messages
from data.models import Concept, ConceptRelationship

from mapping.models import ScanReportConcept, OmopField, Concept, StructuralMappingRule
from mapping.serializers import ConceptSerializer


class NonStandardConceptMapsToSelf(Exception):
    pass

           
#allowed tables
m_allowed_tables = ['person','measurement','condition_occurrence','observation']

#names of date objects in ScanReportTable
m_date_lookup = {
    'person':'birth_date',
    'measurement':'measurement_date',
    'condition_occurrence':'condition_date',
    'observation':'observation_date'
}

#look up of date-events in all the allowed (destination) tables
m_date_field_mapper = {
    'person': ['birth_datetime'],
    'condition_occurrence': ['condition_start_datetime','condition_end_datetime'],
    'measurement':['measurement_datetime'],
    'observation':['observation_datetime']
}


def find_date_event(destination_table,
                    source_table):
    """
    convienience function to return the source field of a date event
    for a destination table from the current source table
    
    the field name is looked up in m_date_lookup
    e.g. 
       'person':'birth_date'
    so, the code obtains the ScanReportField for birth_date

    Paramaters:
      - destination_table (str) : name of the destination table (e.g. 'person')
      - source_table (ScanReportTable): object for the scan report table
    
    Returns:
      - ScanReportField : the source_field that has been marked as the date event
    """
    field = m_date_lookup[destination_table]
    return getattr(source_table,field)

def find_person_id(source_table):
    """
    convenience function to return the person_id for a source table
    Parameters:
      - source_table (ScanReportTable)
    Returns:
      - person_id (ScanReportField)
    """
    return source_table.person_id

def get_omop_field(destination_field,
                   destination_table=None):
    """
    function to return the destination_field object, given lookup names
    Parameters:
      - destination_field (str) : the name of the destination field
      - [optional] destination_table (str) : the name of destination table, if known
    Returns:
      - OmopField : the destination field object
    """
    #if we haven't specified the table name
    if destination_table == None:
        #look up the field from the "allowed_tables"
        omop_field = OmopField.objects\
                               .filter(table__table__in=m_allowed_tables)\
                               .get(field=destination_field)
    else:
        #otherwise, if we know which table the field is in, use this to find the field
        omop_field = OmopField.objects\
                              .filter(table__table=destination_table)\
                              .get(field=destination_field)
    return omop_field


def save_person_id_rule(request,
                        scan_report,
                        scan_report_concept,
                        source_table,
                        destination_table):
    #look up what source_field for this table contains the person id
    person_id_source_field = find_person_id(source_table)

    #!todo - turn into a func() is stable/valid for mapping
    #      - this needs to be checked before this step
    if person_id_source_field == None:
        messages.error(request,'Failed to add concept because there is no'
                       f'person_id set for this table {source_table}')
        return False
    
    # get the associated OmopField Object (aka destination_table::person_id)
    person_id_omop_field = OmopField.objects.get(
        table=destination_table, field="person_id"
    )

    #create a new 1-1 rule 
    rule_domain_person_id, created = StructuralMappingRule.objects.update_or_create(
        scan_report=scan_report,
        omop_field=person_id_omop_field,
        source_field=person_id_source_field,
        concept = scan_report_concept,
        approved=True,
    )
    #save this new mapping
    rule_domain_person_id.save()
    return True

def save_date_rule(request,
                        scan_report,
                        scan_report_concept,
                        source_table,
                        destination_table):

    #!todo - need some checks for this
    date_event_source_field  = find_date_event(destination_table.table,source_table)
    
    date_omop_fields = m_date_field_mapper[destination_table.table]
    #loop over all returned
    #most will return just one date event
    #in the case of condition_occurrence, it returns start and end
    for date_omop_field in date_omop_fields:

        # get the actual omop field object
        date_event_omop_field = OmopField.objects.get(
            table=destination_table, field=date_omop_field
        )

        #create a new 1-1 rule 
        rule_domain_date_event, created = StructuralMappingRule.objects.update_or_create(
            scan_report=scan_report,
            omop_field=date_event_omop_field,
            source_field=date_event_source_field,
            concept = scan_report_concept,
            approved=True,
        )
        #save this new mapping
        rule_domain_date_event.save()
        
    return True


def save_mapping_rules(request,scan_report_concept):
    """
    function to save the rules
    Parameters:
       - request (HttpRequest): django object for the request (get/post)
       - scan_report_concept (ScanReportConcept) : object containing the Concept and Link to source_value
    """

    scan_report_value = scan_report_concept.content_object
    source_field = scan_report_value.scan_report_field
    scan_report = source_field.scan_report_table.scan_report
    concept = scan_report_concept.concept
    domain = concept.domain_id.lower()
    #get the omop field for the source_concept_id for this domain
    omop_field = get_omop_field(f"{domain}_source_concept_id")

    #start looking up what table we're looking at
    destination_table = omop_field.table
    #obtain the source table
    source_table = source_field.scan_report_table

    #try and save the person_id
    if not save_person_id_rule(request,
                               scan_report,
                               scan_report_concept,
                               source_table,
                               destination_table):
        return False

    if not save_date_rule(request,
                          scan_report,
                          scan_report_concept,
                          source_table,
                          destination_table):
        return False


    # create/update a model for the domain source_concept_id
    #  - for this destination_field and source_field
    #  - do_term_mapping is set to true:
    #    - all term mapping rules associated need to be applied
    rule_domain_source_concept_id, created = StructuralMappingRule.objects.update_or_create(
        scan_report=scan_report,
        omop_field=omop_field,
        source_field=source_field,
        concept = scan_report_concept,
        approved=True,
    )
    rule_domain_source_concept_id.save()

    # create/update a model for the domain concept_id
    #  - for this destination_field and source_field
    #  - do_term_mapping is set to true:
    #    - all term mapping rules associated need to be applied
    rule_domain_concept_id, created = StructuralMappingRule.objects.update_or_create(
        scan_report=scan_report,
        omop_field=get_omop_field(f"{domain}_concept_id"),
        source_field=source_field,
        concept	= scan_report_concept,
        approved=True,
    )
    rule_domain_concept_id.save()

    # create/update a model for the domain source_value
    #  - for this destination_field and source_field
    #  - do_term_mapping is set to false
    rule_domain_source_value, created = StructuralMappingRule.objects.update_or_create(
        scan_report=scan_report,
        omop_field=get_omop_field(f"{domain}_source_value"),
        source_field=source_field,
        concept = scan_report_concept,
        approved=True,
    )
    #add this new concept mapping
    # - the concept wont be used, because  do_term_mapping=False
    # - but we need to preserve the link,
    #   so when all associated concepts are deleted, the rule is deleted
    rule_domain_source_value.save()

    if domain == 'measurement':
        # create/update a model for the domain value_as_number
        #  - for this destination_field and source_field
        #  - do_term_mapping is set to false
        rule_domain_value_as_number, created = StructuralMappingRule.objects.update_or_create(
            scan_report=scan_report,
            omop_field=get_omop_field("value_as_number","measurement"),
            source_field=source_field,
            concept=scan_report_concept,
            approved=True,
        )
        rule_domain_value_as_number.save()

    return True

def get_concept_from_concept_code(concept_code,
                                  vocabulary_id,
                                  no_source_concept=False):
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
    #obtain the source_concept given the code and vocab
    source_concept = Concept.objects.get(
        concept_code = concept_code,
        vocabulary_id = vocabulary_id
    )

    #if the source_concept is standard
    if source_concept.standard_concept == 'S':
        #the concept is the same as the source_concept
        concept = source_concept
    else:
        #otherwise we need to look up 
        concept = find_standard_concept(source_concept)

    if no_source_concept:
        #only return the concept
        return concept
    else:
        #return both as a tuple
        return (source_concept,concept)


def find_standard_concept(source_concept):
    """
    Parameters:
      - source_concept(Concept): originally found, potentially non-standard concept
    Returns:
      - Concept: either the same object as input (if input is standard), or a newly found 
    """

    #if is standard, return self
    if source_concept.standard_concept == 'S':
        return source_concept

    #find the concept relationship, of what this non-standard concept "Maps to"
    concept_relation = ConceptRelationship.objects.get(
        concept_id_1=source_concept.concept_id,
        relationship_id__contains='Maps to'
    )

    if concept_relation.concept_id_2 == concept_relation.concept_id_1:
        raise NonStandardConceptMapsToSelf('For a non-standard concept '
                                           'the concept_relation is mapping to itself '
                                           'i.e. it cannot find an associated standard concept')

    #look up the associated standard-concept
    concept = Concept.objects.get(
        concept_id=concept_relation.concept_id_2
    )
    return concept


class Concept2OMOP:

    @staticmethod
    def get_rules_by_scan_report_concept(scan_report_concept_id):

        print("scan_report_concept_id: {}".format(scan_report_concept_id))

        _scan_report_concept = ScanReportConcept.objects.get(pk=scan_report_concept_id)

        print("concept_id: {}".format(_scan_report_concept.concept.concept_id))

        _concept = Concept.objects.get(concept_id=_scan_report_concept.concept.concept_id)

        serializer = ConceptSerializer(_concept)

        concept = serializer.data

        if concept.get('domain_id') == 'Condition':
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
