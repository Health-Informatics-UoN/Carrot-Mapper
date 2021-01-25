
### This script joins a White Rabbit scan report to a data provider-supplied data dictionary to make a more robust Usagi input
### Note that the bottom part of this script carries out a range of data integrity checks between a scan report and a data dictionary
### These checks will eventually be broken out into a seperate script (dictionary_integrity.py)

import pandas as pd
from dfply import *
import numpy as np

scan_report_path = '~/Documents/phenobase/ScanReport.xlsx'
dictionary_path = '~/Documents/phenobase/Metadata.xlsx'

# Load in data dictionary, field overview and list of data tables present in source data
data_dict = pd.read_excel(dictionary_path, engine='openpyxl')
scan_report = pd.read_excel(scan_report_path, sheet_name='Field Overview', engine='openpyxl')

# The 'Table Overview' sheet contains the information on which tables in the Scan Report at actual data tables (and not White Rabbit summary statistics)
tables = (pd.read_excel(scan_report_path, sheet_name='Table Overview', engine='openpyxl') >> select(X.Table))

# Data tables present in the scan report
tables = np.array(tables.Table)
print('DATA TABLES PRESENT: ', tables)

# Creates a list and adds to the list only the sheets from the scan report which are data sheets
# Subsequently removes all frequency columns from the data for value comparison to data dictionary
data_tables = list()
for tab in tables:
    x = pd.read_excel(scan_report_path, sheet_name=tab, engine='openpyxl')
    x = x.loc[:,~x.columns.str.startswith('Frequency')]
    data_tables.append(x)

# Full join the scan report to the data dictionary on the Field ID cols in both datasets
# Full join because, later, we need to do some filtering to see what fields/tables are in either set
x = pd.merge(scan_report, data_dict, how='outer', left_on='Field', right_on='FieldID', indicator='where')

# When joining, pandas will indicate where the joined data have come from
# Where 'both': the FieldID is present in source and dictionary
# Where not both, data is present in one or other dataset (but not in both)
# Filter on 'left_only' or 'right_only' to determine what's missing from where

left_only = x.loc[x['where'] == 'left_only']
left_only = left_only[['Field']]
print('FIELDS IN SCAN REPORT ONLY \n', left_only, '\n\n')

right_only = x.loc[x['where'] == 'right_only']
right_only = right_only.FieldID.unique()
print('FIELDS IN DATA DICTIONARY ONLY \n', right_only, '\n\n')

both = x.loc[x['where'] == 'both']
print(type(both))
print('FIELDS PRESENT IN BOTH THE SCAN REPORT AND DATA DICTIONARY \n', both, '\n\n')

# Write join output to disk
# This can be sent to Ugasi 'as-is' but in reality this file will require some further processing
x.to_csv('scanreport_dictionary_merge.csv')

######################
### VALUE CHECKING ###
######################

# THIS CODE CHECKS WHETHER THE VALUES IN THE SCAN REPORT MATCH EXPECTED VALUES IN THE DATA DICTIONARY
# "What values are present in the scan report which are not in the data dictionary?"
# Only checks values in data dictionary fields which are common between the scan report and the data dictionary

print('COLS IN DATA DICTIONARY:', list(data_dict.columns))
print('COLS IN SCAN REPORT:', list(scan_report.columns))

# Show list of unique tables in the data DICTIONARY
unique_dict_tables = data_dict.Table.unique()
print('TABLES IN DICTIONARY \n', unique_dict_tables, '\n\n')

# Show list of unique tables in scan REPORT
unique_scan_tables = scan_report.Table.unique()
print('TABLES IN SCAN REPORT \n', unique_scan_tables, '\n\n')

# Show tables missing from the data DICTIONARY
missing = list(set(unique_scan_tables) - set(unique_dict_tables))
print('THE FOLLOWING SCAN REPORT TABLES DO NOT APPEAR AS TABLES IN THE DATA DICTIONARY \n', missing, '\n\n')

missing2 = list(set(unique_dict_tables) - set(unique_scan_tables))
print('THE FOLLOWING DATA DICTIONARY TABLES DO NOT APPEAR AS TABLES IN THE SCAN REPORT \n', missing2, '\n\n')

# Create dataframe which groups each FieldID and then puts the values for each group in a list
# Then, for each column of values in data_tables, check if these scan report values are in the data dictionary
values_check = both.groupby('FieldID')['ValueCode'].apply(list).reset_index()

y = np.array(both['Field'].dropna()) # Returns only the fields which are in the scan report and the data dictionary
y = np.unique(y) # Gives unique field names

# Scan report data
# Intersection only returns scan report data which are present in the data dictionary
df1 = data_tables[0][data_tables[0].columns.intersection(y)]

# Iterate over the sequence of column names
summary = pd.DataFrame([])
for column in df1:

       # GET SCAN REPORT DATA
       print('Scan Report Column Name: ', column)
       scan_vals = df1[column].tolist() # Scan report values for a given column (field)
       scan_vals = [x for x in scan_vals if str(x) != 'nan'] # Removes NaN which appear due to differing numbers of rows with data in each column (field)
       print('SCAN VALUES (First 5 only): ', scan_vals[:5]) # Print only first 5 values to console for a sense-check

       # GET DATA DICTIONARY DATA
       dict_vals = (values_check >> filter_by(X.FieldID == column) >> select(X.ValueCode)) # Using dfply to get the list of *expected* values
       dict_vals = dict_vals.values.tolist() # Coerce to list so numpy can compares differences between the two lists
       print('DICTIONARY VALUES: ', dict_vals[:5])

       missing_vals = np.setdiff1d(scan_vals, dict_vals) # Returns the elements in SCAN REPORT that are *NOT* in DATA DICTIONARY

       if missing_vals.size == 0: # If there are no missing values insert string
           missing_vals = str("No missing values")
       else: # Else convert the list of values into a string (so it can be written to CSV without being truncated by to_csv())
           missing_vals = missing_vals.tolist()
           missing_vals = str(missing_vals)

       print('MISSING FROM DICTIONARY: ', missing_vals, '\n\n\n')

       summary = summary.append(pd.DataFrame({'Field': column, 'MissingVals': missing_vals}, index=[0])) # Add column's data to summary object
