from rest_framework import serializers
from data.models import (
    Concept,
    Vocabulary,
    ConceptRelationship,
    ConceptAncestor,
    ConceptClass,
    ConceptSynonym,
    Domain,
    DrugStrength,
) 
from mapping.models import (
    ScanReportField, 
    ScanReportValue,
    ScanReport,
    ScanReportTable,
    ScanReportConcept,
    Mapping,
    ClassificationSystem,
    DataDictionary,
    Document,
    DocumentFile,
    DataPartner,
    OmopField,
    OmopTable,
    StructuralMappingRule,
    Source,
    DocumentType,
    )

#class ScanReportFieldSerializer(serializers.HyperlinkedModelSerializer):
#    class Meta:
#        model = ScanReportField


class ConceptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Concept
        fields = '__all__'

class VocabularySerializer(serializers.ModelSerializer):
    class Meta:
        model=Vocabulary
        fields='__all__'
        
class ConceptRelationshipSerializer(serializers.ModelSerializer):
    class Meta:
        model=ConceptRelationship
        fields='__all__'
        
class ConceptAncestorSerializer(serializers.ModelSerializer):
    class Meta:
        model=ConceptAncestor
        fields='__all__'      
                  
class ConceptClassSerializer(serializers.ModelSerializer):
    class Meta:
        model=ConceptClass
        fields='__all__'                        

class ConceptSynonymSerializer(serializers.ModelSerializer):
    class Meta:
        model=ConceptSynonym
        fields='__all__'     
                           
class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model=Domain
        fields='__all__'  
              
class DrugStrengthSerializer(serializers.ModelSerializer):
    class Meta:
        model=DrugStrength
        fields='__all__'        

class ScanReportSerializer(serializers.ModelSerializer):
    class Meta:
        model=ScanReport
        fields='__all__'        

class ScanReportTableSerializer(serializers.ModelSerializer):
    class Meta:
        model=ScanReportTable
        fields='__all__'        

class ScanReportFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model=ScanReportField
        fields='__all__'        

class ScanReportValueSerializer(serializers.ModelSerializer):
    class Meta:
        model=ScanReportValue
        fields='__all__'        

class ScanReportConceptSerializer(serializers.ModelSerializer):
    class Meta:
        model=ScanReportConcept
        fields='__all__'        
        
class MappingSerializer(serializers.ModelSerializer):
    class Meta:
        model=Mapping
        fields='__all__'      

class ClassificationSystemSerializer(serializers.ModelSerializer):
    class Meta:
        model=ClassificationSystem
        fields='__all__'               

class DataDictionarySerializer(serializers.ModelSerializer):
    class Meta:
        model=DataDictionary
        fields='__all__'               

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model=Document
        fields='__all__'               

class DocumentFileSerializer(serializers.ModelSerializer):
    class Meta:
        model=DocumentFile
        fields='__all__'               

class DataPartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model=DataPartner
        fields='__all__'               

class OmopFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model=OmopField
        fields='__all__'               

class OmopTableSerializer(serializers.ModelSerializer):
    class Meta:
        model=OmopTable
        fields='__all__'               

class StructuralMappingRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model=StructuralMappingRule
        fields='__all__' 

class SourceSerializer(serializers.ModelSerializer):
    class Meta:
        model=Source
        fields='__all__'         
        
class DocumentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model=DocumentType
        fields='__all__'                 
