from django.db import models

class Vocabulary(models.Model):
    vocabulary_id = models.CharField(
        primary_key=True, max_length=20
    )

    vocabulary_name = models.CharField(
        max_length=255
    )
    
    vocabulary_reference = models.CharField(
        max_length=255
    )
    
    vocabulary_version = models.CharField(
        max_length=255, blank=True, null=True
    )
    
    vocabulary_concept_id = models.IntegerField(

    )

    class Meta:
        managed = False
        db_table = 'omop"."vocabulary'