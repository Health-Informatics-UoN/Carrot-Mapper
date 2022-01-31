from django.db import models


class DrugStrength(models.Model):
    drug_concept_id = models.IntegerField(primary_key=True)

    ingredient_concept_id = models.IntegerField()

    amount_value = models.DecimalField(
        max_digits=65535, decimal_places=65535, blank=True, null=True
    )

    amount_unit_concept_id = models.IntegerField(blank=True, null=True)

    numerator_value = models.DecimalField(
        max_digits=65535, decimal_places=65535, blank=True, null=True
    )

    numerator_unit_concept_id = models.IntegerField(blank=True, null=True)

    denominator_value = models.DecimalField(
        max_digits=65535, decimal_places=65535, blank=True, null=True
    )

    denominator_unit_concept_id = models.IntegerField(blank=True, null=True)

    box_size = models.IntegerField(blank=True, null=True)

    valid_start_date = models.DateField()

    valid_end_date = models.DateField()

    invalid_reason = models.CharField(max_length=1, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'omop"."drug_strength'
        unique_together = (("drug_concept_id", "ingredient_concept_id"),)
