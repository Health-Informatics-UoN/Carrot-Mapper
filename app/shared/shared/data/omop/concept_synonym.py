from django.db import models


class ConceptSynonym(models.Model):
    concept_id = models.IntegerField(primary_key=True)

    concept_synonym_name = models.CharField(max_length=1000)

    language_concept_id = models.IntegerField()

    class Meta:
        managed = False
        app_label = "data"
        db_table = 'omop"."concept_synonym'
