from django.db import models
import uuid

# Create model which defines the local databases' data
class localDB(models.Model):
    localDB_name = models.CharField(max_length = 256, unique = False)
    localDB_table = models.CharField(max_length = 265, unique = False)
    localDB_column = models.CharField(max_length = 256, unique = False)
    localDB_value = models.CharField(max_length = 256, unique = False)
    term = models.CharField(max_length = 256, unique = False)

    def __str__(self):
        local = f'{self.localDB_name, self.localDB_table, self.localDB_value, self.localDB_column, self.term}'
        return local

class controlledVocab(models.Model):
    id = models.UUIDField(primary_key = True, default = uuid.uuid4, editable = False)
    term = models.CharField(max_length = 256, unique = True)

    def __str__(self):
        vocab = f'{self.term}'
        return(vocab)

class omopMapping(models.Model):
    controlled_vocab_id = models.ForeignKey(controlledVocab, on_delete=models.CASCADE)
    omop_table = models.CharField(max_length = 265, unique = False)
    omop_column = models.CharField(max_length = 265, unique = False)
    omop_value = models.CharField(max_length = 265, unique = False)

    def __str__(self):
        mapping = f'{self.omop_table, self.omop_column} - {self.omop_value}'
        return(mapping)
