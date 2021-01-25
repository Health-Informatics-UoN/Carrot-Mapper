from django.db import models

# Relationship is many:many because;
# Each pair of source data tables/fields can potentially be related to many tables/fields in OMOP
# Each pair of tables/fields in OMOP can be related to many different pairs of tables/fields in the source data

# DEFINE MODEL TO HOLD INFORMATION ON THE SOURCE DATA TABLES AND COLUMNS
class Source(models.Model):
    dataset = models.CharField(max_length=64)
    table = models.CharField(max_length=64)
    field = models.CharField(max_length=64)
    mapping = models.ManyToManyField('Mapping')

    def __str__(self):
        return f'{self.dataset, self.table, self.field}'

# DEFINE MODEL TO HOLD THE POSSIBLE OMOP MAPPING COMBINATIONS
class Mapping(models.Model):
    table = models.CharField(max_length=64)
    field = models.CharField(max_length=64)

    def __str__(self):
        return f'{self.table, self.field}'
