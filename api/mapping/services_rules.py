import json
from datetime import datetime

from django.contrib import messages
from data.models import Concept, ConceptRelationship

from mapping.models import ScanReportTable, ScanReportField, ScanReportValue
from mapping.models import ScanReportConcept, OmopTable, OmopField, Concept, StructuralMappingRule
from mapping.serializers import ConceptSerializer

from graphviz import Digraph

from django.http import HttpResponse

class NonStandardConceptMapsToSelf(Exception):
    pass

           
#allowed tables
m_allowed_tables = ['person','measurement','condition_occurrence','observation','drug_exposure']

#look up of date-events in all the allowed (destination) tables
m_date_field_mapper = {
    'person': ['birth_datetime'],
    'condition_occurrence': ['condition_start_datetime','condition_end_datetime'],
    'measurement':['measurement_datetime'],
    'observation':['observation_datetime'],
    'drug_exposure':['drug_exposure_start_datetime','drug_exposure_end_datetime']
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

def get_omop_field(destination_field,
                   destination_table=None):
    """
    function to return the destination_field object, given lookup names
    Args:
      - destination_field (str) : the name of the destination field
      - [optional] destination_table (str) : the name of destination table, if known
    Returns:
      - OmopField : the destination field object
    """

    #if we haven't specified the table name
    if destination_table == None:
        #look up the field from the "allowed_tables"
        omop_field = OmopField.objects\
                              .filter(field=destination_field)

        if len(omop_field)>1:
            return omop_field.filter(table__table__in=m_allowed_tables)[0]
        elif len(omop_field) == 0:
            return None
        else:
            return omop_field[0]
        
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
    if person_id_source_field == None and request:
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
    date_event_source_field  = find_date_event(source_table)
    
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


def find_destination_table(request,concept):
    domain = concept.domain_id.lower()
    #get the omop field for the source_concept_id for this domain
    omop_field = get_omop_field(f"{domain}_source_concept_id")
    if omop_field == None:
        if request != None:
            messages.error(request,f"Something up with this concept, '{domain}_source_concept_id' does not exist, or is from a table that is not allowed.")
        return None
    #start looking up what table we're looking at
    destination_table = omop_field.table

    if destination_table.table not in m_allowed_tables:
        messages.error(request,f"Concept {concept.concept_id} ({concept.concept_name}) is from table '{destination_table.table}' which is not implemented yet.")
        return None
    return destination_table


def save_mapping_rules(request,scan_report_concept):
    """
    function to save the rules
    Args:
       - request (HttpRequest): django object for the request (get/post)
       - scan_report_concept (ScanReportConcept) : object containing the Concept and Link to source_value
    """

    content_object = scan_report_concept.content_object
    if isinstance(content_object,ScanReportValue):
        scan_report_value = content_object
        source_field = scan_report_value.scan_report_field
    else:
        source_field = content_object
        
    scan_report = source_field.scan_report_table.scan_report

    concept = scan_report_concept.concept

    #start looking up what table we're looking at
    destination_table = find_destination_table(request,concept)
    if destination_table == None:
        if request != None:
            messages.warning(request,f"Failed to make rules for {concept.concept_id} ({concept.concept_name})")
        return False

    #get the omop field for the source_concept_id for this domain
    domain = concept.domain_id.lower()
    omop_field = get_omop_field(f"{domain}_source_concept_id")

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
    
    # NLP returns SNOMED as SNOWMEDCT_US
    # This sets SNOWMEDCT_US to SNOWMED if this function is
    # used within services_nlp.py
    if vocabulary_id == 'SNOMEDCT_US':
        vocabulary_id="SNOMED"

    # It's RXNORM in NLP but RxNorm in OMOP db, so must convert    
    if vocabulary_id=="RXNORM":
        vocabulary_id="RxNorm"
    else:
        vocabulary_id=vocabulary_id

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
    Args:
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



def get_mapping_rules_list(structural_mapping_rules):
    """
    Args:
        qs : queryset of all mapping rules
    Returns:
        dict : formatted json that can be eaten by the TL-Tool
    """

    # Queryset -> list, makes the calls to the db to get the rules 
    structural_mapping_rules = list(structural_mapping_rules)
    
    #get all scan_report_concepts that are used
    #get the ids first so we can make a batch call
    scan_report_concepts = list(set([ obj.concept_id for obj in structural_mapping_rules]))
    #make a batch call
    scan_report_concepts = { x.id: x for x in list(ScanReportConcept.objects.filter(pk__in=scan_report_concepts))}
    
    scan_report_values = [
        obj.object_id
        for obj in scan_report_concepts.values()
        if obj.content_type.model_class() is ScanReportValue
    ]
    scan_report_values = { obj.id:obj.value for obj in list(ScanReportValue.objects.filter(pk__in=scan_report_values)) }

    destination_fields = [ obj.omop_field_id for obj in structural_mapping_rules]
    destination_fields = { obj.id:obj for obj in list(OmopField.objects.filter(pk__in=destination_fields))}

    destination_tables = [obj.table_id for obj in destination_fields.values()]
    destination_tables = {obj.id:obj for obj in list(OmopTable.objects.filter(pk__in=destination_tables))}
    
    source_fields = [ obj.source_field_id for obj in structural_mapping_rules]
    source_fields = { obj.id:obj for obj in list(ScanReportField.objects.filter(pk__in=source_fields))}

    source_tables = [obj.scan_report_table_id for obj in source_fields.values()]
    source_tables = {obj.id:obj for obj in list(ScanReportTable.objects.filter(pk__in=source_tables))}
    
    rules = []
    for rule in structural_mapping_rules:

        destination_field = destination_fields[rule.omop_field_id]
        destination_table = destination_tables[destination_field.table_id]
        #destination_field = destination_field.field


        source_field = source_fields[rule.source_field_id]
        source_table = source_tables[source_field.scan_report_table_id]
        #source_field = source_field.name
        
        scan_report_concept_id = rule.concept_id
        scan_report_concept = scan_report_concepts[rule.concept_id]
        concept_id = scan_report_concept.concept_id
        if scan_report_concept.content_type.model_class() is ScanReportValue:
            term_mapping = {scan_report_values[scan_report_concept.object_id]:concept_id}
        else:
            term_mapping = concept_id
            
        rules.append(
            {
                'destination_table':destination_table,
                'destination_field':destination_field,
                'source_table':source_table,
                'source_field':source_field,
                'term_mapping':term_mapping
            })
            
    return rules

def get_mapping_rules_json_batch(structural_mapping_rules):
    """
    Args:
        qs : queryset of all mapping rules
    Returns:
        dict : formatted json that can be eaten by the TL-Tool
    """

    #use the first_qs to get the scan_report dataset name
    #all qs items will be from the same scan_report
    first_rule = structural_mapping_rules[0]

    #build some metadata
    metadata =  {
        'date_created':datetime.utcnow().isoformat(),
        'dataset':first_rule.scan_report.dataset
    }

    all_rules = get_mapping_rules_list(structural_mapping_rules)
    
    return all_rules


def get_mapping_rules_json(qs):
    """
    Args:
        qs : queryset of all mapping rules
    Returns:
        dict : formatted json that can be eaten by the TL-Tool
    """
    #use the first_qs to get the scan_report dataset name
    #all qs items will be from the same scan_report
    first_qs = qs[0]

    #build some metadata
    metadata =  {
        'date_created':datetime.utcnow().isoformat(),
        'dataset':first_qs.scan_report.dataset
    }

    # group all rules in the QuerySet
    # by the concept they are associated to
    # Example:
    # - "person": [ <male>, <female>]
    # - <male> : [<person_id_rule>, <date_event_rule>, <concept_rule,...]
    # - <female> : [<person_id_rule>, <date_event_rule>, <concept_rule,...]
    # The 5 rules for male(female) need to be grouped so the object can be
    # created
    object_map = {}
    for rule in qs:
        if rule.concept not in object_map:
            object_map[rule.concept] = []
        object_map[rule.concept].append(rule)

    #save to a dict
    #the keys will be the destination_tabls
    # "cdm" : {
    #           "person": [],
    #           "measurement": [],
    #
    #         }
    cdm = {}
    
    #loop over all unique concepts
    #rules will contain 5 rules:
    # - person_id, date_event, concept, source_concept, source_value
    for rules in object_map.values():

        #use the first rule to get the destinatin tablee
        #all rules are associated to the same object, so this fine to do
        first_rule = rules[0]
        destination_table = first_rule.omop_field.table.table

        #each destination_table will be a list of objects
        #if the table is not in the cdm dict, add a blank list
        if destination_table not in cdm:
            cdm[destination_table] = []

        #save each cdm object to a dict
        # "person": [<cdm_obj: male>, <cdm_obj: female>]
        # <cdm_obj> : {
        #                'person_id': <rule def>,
        #                'concept_id': <rule def
        #                ...
        #             }
        cdm_obj = {}

        #loop over all rules to be added to this cdm object
        for rule in rules:

            #note: needed because some weird whitespace/ byte order marks were appearing in the names
            source_field = rule.source_field.name.replace(u'\ufeff', '')
            source_table = rule.source_field.scan_report_table.name.replace(u'\ufeff', '')
                            
            destination_field = rule.omop_field.field
            # !-- todo: add some validation/error check, just incase
            #_destination_table = rule.omop_field.table.table
            # if _destination_table != destination_table: something realllly wrong

            #start building the object
            # Example:
            # {
            #        "source_table": "demographic.csv",
            #        "source_field": "gender",
            #        "term_mapping": { "M": "8507" }
            # }
            cdm_obj[destination_field] = {
                'source_table':source_table,
                'source_field':source_field,
            }

            #if this is a rule for a concept_id
            if 'concept_id' in destination_field:
                #check if it's a scan_report_value
                #otherwise it's a scan_report_field
                is_scan_report_value = isinstance(rule.concept.content_object,ScanReportValue)

                if is_scan_report_value:
                    #apply term mapping that says how to map each value to a concept_id
                    cdm_obj[destination_field]['term_mapping'] = {
                        rule.concept.content_object.value : rule.concept.concept_id
                    }
                else:
                    #otherwise it's a column level mapping and all values should be
                    #replace with this concept_id
                    cdm_obj[destination_field]['term_mapping'] = rule.concept.concept_id
                    
        #append the object
        cdm[destination_table].append(cdm_obj)
    #return the finalised dict(json)
    return {'metadata':metadata,'cdm':cdm}

def download_mapping_rules(request,qs):
    #get the mapping rules
    output = get_mapping_rules_json_batch(qs)
    #used the first qs item to get the scan_report name the qs is associated with
    scan_report = qs[0].scan_report
    #make a file name
    return_type = "json"
    fname = f"{scan_report.data_partner.name}_{scan_report.dataset}_structural_mapping.{return_type}"
    #return a response that downloads the json file
    response = HttpResponse(json.dumps(output,indent=6),content_type='application/json')
    response['Content-Disposition'] = f'attachment; filename="{fname}"'
    return response


def make_dag(data):
    dot = Digraph(strict=True,format='svg')
    dot.attr(rankdir='RL', size='8,5')
    
    for destination_table_name,destination_tables in data.items():
        dot.node(destination_table_name,shape='box')

        for destination_table in destination_tables:
            for destination_field,source in destination_table.items():
                source_field = source['source_field']
                source_table = source['source_table']

                table_name = f"{destination_table_name}_{destination_field}"
                
                dot.node(table_name,
                         label=destination_field,style='filled', fillcolor='yellow',shape='box')

                dot.edge(destination_table_name,table_name,dir='back')

                source_field_name =  f"{source_table}_{source_field}"
                
                dot.node(source_field_name,source_field)

                #if 'operations' in source:
                #    operations = source['operations']

                if 'term_mapping' in source and source['term_mapping'] is not None:
                    term_mapping = source['term_mapping']
                    dot.edge(table_name,source_field_name,dir='back',color='red')
                        
                else:                                                    
                    dot.edge(table_name,source_field_name,dir='back')

                
                dot.node(source_table,shape='box')
                dot.edge(source_field_name,source_table,dir='back')

    return dot.pipe().decode('utf-8')



#this is here as we should move it out of coconnect.tools
def view_mapping_rules(request,qs):
    #get the rules
    output = get_mapping_rules_json(qs)
    #use make dag svg image
    svg = make_dag(output['cdm'])
    #return a svg response
    response = HttpResponse(svg, content_type="image/svg+xml")
    return response


def find_existing_scan_report_concepts(request,table_id):

    #find ScanReportValue associated to this table_id
    #that have at least one concept added to them
    values = ScanReportValue\
        .objects\
        .all()\
        .filter(scan_report_field__scan_report_table__scan_report=table_id)\
        .filter(concepts__isnull=False)

    #find ScanReportField associated to this table_id
    #that have at least one concept added to them
    fields = ScanReportField\
        .objects\
        .all()\
        .filter(scan_report_table__scan_report=table_id)\
        .filter(concepts__isnull=False)

    #retrieve all value concepts
    all_concepts  = [
        concept
        for obj in values
        for concept in obj.concepts.all()
    ]
    #retrieve all field concepts
    all_concepts  += [
        concept
        for obj in fields
        for concept in obj.concepts.all()
    ]
    return all_concepts

#! NOTE
# this could be slow if there are 100s of concepts to be added
def save_multiple_mapping_rules(request,all_concepts):    
    #now loop over all concepts and save new rules
    for concept in all_concepts:
        save_mapping_rules(request,concept)


def remove_mapping_rules(request,scan_report_id):
    """
    Function given a scan_report_id that will find all
    associated mappings and delete them
    """
    rules = StructuralMappingRule.objects.all()\
        .filter(scan_report__id=scan_report_id)

    rules.delete()
