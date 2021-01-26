
### This script builds a 'skeleton' data dictionary from a White Rabbit scan report
### It outputs a CSV file with the following columns: variable, value, frequency

import pandas as pd
from dfply import *
import numpy as np

# File path to White Rabbit scan report
scan_path = "~/Documents/phenobase/PANTHER_WhiteRabbit_ScanReport_v1.0_MCC-1..xlsx"

# Load in scan report
scan_report = pd.read_excel(scan_path, sheet_name='Field Overview', engine='openpyxl')

# The 'Table Overview' sheet contains the information on which tables in the Scan Report are actual data tables (and not White Rabbit summary statistics)
tables = (pd.read_excel(scan_path, sheet_name='Table Overview', engine='openpyxl') >> select(X.Table))

# Data tables present in the scan report
tables = np.array(tables.Table)

# Creates a list and adds to the list only the sheets from the scan report which are data sheets
# Subsequently removes all frequency columns from the data for value comparison to data dictionary
data_tables = list()
for tab in tables:
    x = pd.read_excel(scan_path, sheet_name=tab, engine='openpyxl')
    x = x.loc[:,~x.columns.str.startswith('Frequency')]
    data_tables.append(x)

freq = list()
for tab in tables:
    x = pd.read_excel(scan_path, sheet_name=tab, engine='openpyxl')
    x = x.loc[:,x.columns.str.startswith('Frequency')]
    freq.append(x)


# Melt the dataframe and drop duplicate rows
# Returns a data dictionary where each row shows the variable name and its value
dict = list()
for d,f,t in zip(data_tables, freq, tables):
    x = pd.melt(d)
    y = pd.melt(f)
    y.columns = ['freq', 'frequency']
    x = pd.concat([x, y], axis=1)
    x = x.drop(['freq'], axis=1)
    x = x.drop_duplicates(subset=['value', 'frequency'])
    x.insert(3, 'src', str(t))
    dict.append(x)

dict = pd.concat(dict)
print(dict)
dict.to_csv("~/Documents/melt.csv", index=False)
