from django.db import models


class ConceptAncestor(models.Model):
    ancestor_concept_id = models.IntegerField(primary_key=True)

    descendant_concept_id = models.IntegerField()

    min_levels_of_separation = models.IntegerField()

    max_levels_of_separation = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'omop"."concept_ancestor'
        app_label = "data"
        unique_together = (("ancestor_concept_id", "descendant_concept_id"),)
