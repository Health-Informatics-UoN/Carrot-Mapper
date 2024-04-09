from django.db import models


class ConceptRelationship(models.Model):
    concept_id_1 = models.IntegerField(
        primary_key=True,
    )

    concept_id_2 = models.IntegerField()

    relationship_id = models.CharField(
        max_length=20,
    )

    valid_start_date = models.DateField()

    valid_end_date = models.DateField()

    invalid_reason = models.CharField(
        max_length=1,
        blank=True,
        null=True,
    )

    class Meta:
        managed = False
        db_table = 'omop"."concept_relationship'
        unique_together = (("concept_id_1", "concept_id_2", "relationship_id"),)
