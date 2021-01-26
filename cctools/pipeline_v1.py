
# A basic CLI app for running *part* of the data pipeline
# Currently only builds a skeleton data dictionary (i.e. a DD without any descriptive fields)
# Only processes 1 table within a scan report for now (user selects what table they'd like to process)
# Some parts of the process are currently missing (e.g. programtically creating a Usagi properties file for Usagi CLI)

from __future__ import print_function, unicode_literals
import regex
import pandas as pd
from pprint import pprint
from PyInquirer import prompt
from examples import custom_style_3
from dfply import *
import numpy as np
import os

# Ask user what they'd like to do:
method = [

    {
        'type': 'list',
        'name': 'method',
        'message': 'What would you like to do?',
        'choices': ['Merge Scan Report & Dictionary', 'Build Basic Dictionary']
    }

]

# Save the user's response
method_answer = prompt(method, style=custom_style_3)

# If there's only a scan report and no data dictionary:
# Build a basic 'dictionary' i.e. convert from scan report into Usagi-compatible file
if method_answer.get('method') == "Build Basic Dictionary":

    # Load in scan report
    print('Please enter file path of your White Rabbit Scan Report (.xlsx): ')
    path = input()
    scan_report = pd.read_excel(path, sheet_name='Field Overview', engine='openpyxl')
    #print(scan_report)

    # The 'Table Overview' sheet contains the information on which tables in the Scan Report at actual data tables (and not White Rabbit summary statistics)
    tables = (pd.read_excel(path, sheet_name='Table Overview', engine='openpyxl') >> select(X.Table))
    tables = list(tables.Table)

    # Ask the user what table they want to process
    what_table = [

        {
            'type': 'list',
            'name': 'table_select',
            'message': 'Which data table would you like to process? ',
            'choices': tables
        }
    ]

    # Save the user's response
    what_table_answer = prompt(what_table, style=custom_style_3)

    # Load in the user-selected table, remove the frequency column so the dataframe can be melted
    x = pd.read_excel(path, sheet_name=what_table_answer.get('table_select'), engine='openpyxl')
    x = x.loc[:,~x.columns.str.startswith('Frequency')]

    # Pull out and melt the field frequency information so that it can later be column-bound to x
    y = pd.read_excel(path, sheet_name=what_table_answer.get('table_select'), engine='openpyxl')
    y = y.loc[:,y.columns.str.startswith('Frequency')]

    # Melt the dataframes, join them together
    df1 = pd.melt(x)
    df2 = pd.melt(y)
    df2.columns = ['freq', 'frequency']
    z = pd.concat([df1, df2], axis=1)
    z = z.drop(['freq'], axis=1)

    # Drop duplicates
    dict = z.drop_duplicates(subset=['value', 'frequency'])

    # For now, some hard-coded field removals (to make Usagi quicker to run)
    # In production, the user would be able to select some fields to ignore
    dict = dict[(dict.variable != 'ID')]
    dict = dict[(dict.variable != 'Study ID')]
    dict = dict[(dict.variable != 'Date of visit')]

    # Tells the user what dictionary was created
    print("Generated a basic dictionary for", what_table_answer.get('table_select'), "\n\n")

    # Write skeleton data dictionary to disk
    dict.to_csv("~/Documents/phenobase/output_scratch/melt.csv", index=False)

    ### PROCESS IN USAGI ###
    print('Please enter file path to your Usagi CLI properties file: ')
    # ~/Documents/phenobase/usagi.properties
    properties_file_path = input()

    print("Running Usagi...this might take a while. Go grab a coffee... ""\u2615", "\n\n")

    # For now, you have to manually specify your Usagi properties file
    # In production, we will need code that will allow users to create this programmatically
    # Or we also ask for the file path for a user-generated properties file (might be an easier and more straightforward way to implement this)
    os.system("java -jar /Users/uizst1/Documents/Usagi/dist/Usagi.jar run ~/Documents/phenobase/usagi.properties > /dev/null")

    print("Fin. Coffee break is over. \n\n")

else:
    print("COMING SOON! But the code to handle this does exist.")
