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
    )

class ScanReportFieldSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = ScanReportField


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
