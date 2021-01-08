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
















### OLD MODEL CODE FROM RETRO MEETING ON 07/01 ###

# class OmopTable(models.Model):
#     table_name = models.CharField(max_length=64, unique=True)
#
#     def __str__(self):
#         return f'{self.table_name}'
#
# class OmopField(models.Model):
#     table_name = models.ForeignKey(OmopTable, on_delete=models.CASCADE)
#     field_name = models.CharField(max_length=64, unique=True)
#
#     def __str__(self):
#         return f'{self.table_name, self.field_name}'
#
# class MappingTable(models.Model):
#     localDB_name = models.CharField(max_length = 256, unique = False)
#     localDB_table = models.CharField(max_length = 265, unique = False)
#     localDB_column = models.CharField(max_length = 256, unique = False)
#     localDB_value = models.CharField(max_length = 256, unique = False)
#
#     omop_table = models.ForeignKey(OmopTable, on_delete=models.CASCADE)
#     omop_field = models.ForeignKey(OmopField, on_delete=models.CASCADE)
#
#     comments = models.TextField(blank=True)
#
#     def __str__(self):
#         return f'{self.omop_table, self.omop_field}'
