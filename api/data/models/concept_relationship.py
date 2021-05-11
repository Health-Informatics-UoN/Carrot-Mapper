from django.db import models


class ConceptRelationship(models.Model):
    concept_id_1 = models.IntegerField(
        primary_key=True,
    )

    concept_id_2 = models.IntegerField(
    )


    relationship_id = models.CharField(
        max_length=255,
    )


    class Meta:
        managed = False
        db_table = 'concept_relationship'
