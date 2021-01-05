from django.db import models

# Create model which defines the local databases' data
class LocalDB(models.Model):
    localDB_name = models.CharField(max_length = 256, unique = False)
    localDB_table = models.CharField(max_length = 265, unique = False)
    localDB_column = models.CharField(max_length = 256, unique = False)
    localDB_value = models.CharField(max_length = 256, unique = False)
    term = models.CharField(max_length = 256, unique = False)

    def __str__(self):
        return f'{self.localDB_name, self.localDB_table, self.localDB_value, self.localDB_column, self.term}'

# Create model which defines the controlled vocabulary list
class ControlledVocab(models.Model):
    term = models.CharField(max_length = 256, unique = True)

    def __str__(self):
        return f'{self.term}'

# Create model which defines the OMOP mapping values
class OmopMapping(models.Model):
    controlled_vocab_id = models.ForeignKey(ControlledVocab, on_delete=models.CASCADE)
    omop_table = models.CharField(max_length = 265, unique = False)
    omop_column = models.CharField(max_length = 265, unique = False)
    omop_value = models.CharField(max_length = 265, unique = False)

    def __str__(self):
        return f'{self.omop_table, self.omop_column} - {self.omop_value}'
