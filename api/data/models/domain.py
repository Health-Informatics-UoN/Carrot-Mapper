from django.db import models

class Domain(models.Model):
    domain_id = models.CharField(
        primary_key=True, max_length=20
    )
    
    domain_name = models.CharField(
        max_length=255
    )
    
    domain_concept_id = models.IntegerField(

    )

    class Meta:
        managed = False
        db_table = 'omop"."domain'