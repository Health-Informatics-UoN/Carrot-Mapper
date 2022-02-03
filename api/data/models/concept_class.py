from django.db import models


class ConceptClass(models.Model):
    concept_class_id = models.CharField(primary_key=True, max_length=20)

    concept_class_name = models.CharField(max_length=255)

    concept_class_concept_id = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'omop"."concept_class'
