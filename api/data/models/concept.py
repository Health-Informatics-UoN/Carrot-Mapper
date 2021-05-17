from django.db import models


class Concept(models.Model):
    concept_id = models.IntegerField(
        primary_key=True,
    )

    concept_name = models.CharField(
        max_length=255,
    )

    domain_id = models.CharField(
        max_length=20,
    )

    vocabulary_id = models.CharField(
        max_length=20,
    )

    concept_class_id = models.CharField(
        max_length=20,
    )

    standard_concept = models.CharField(
        max_length=1,
        blank=True,
        null=True,
    )

    concept_code = models.CharField(
        max_length=50,
    )

    valid_start_date = models.DateField(

    )

    valid_end_date = models.DateField(

    )

    invalid_reason = models.CharField(
        max_length=1,
        blank=True,
        null=True
    )

    class Meta:
        managed = False
        db_table = 'omop"."concept'
