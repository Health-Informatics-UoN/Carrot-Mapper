from mapping.models import (
    ScanReport,
    ScanReportTable,
    ScanReportField,
    ScanReportValue
)
import json
import pandas as pd
import os

def generate_synthetic_data_table(scan_report_table_id: int, number_of_events: int) -> pd.DataFrame:

    table = ScanReportTable.objects.get(pk=scan_report_table_id)

    field_person_id = ScanReportField.objects.get(pk=table.person_id.id).name
    
    #get all columns (fields) for a given table 
    fields = ScanReportField.objects\
                                .filter(scan_report_table=table)\
                                .order_by("created_at")

    #create an array to hold each pandas series
    #corresponding to a synthetic data column
    series_synthetic = []
    #loop over all columns (fields) in the table
    for field in fields:
        #obtain all values there are in the ScanReport
        objects = ScanReportValue.objects.filter(scan_report_field=field)
        #pull out data for each value giving the raw value and the frequency of this value
        data = [
            {field.name:obj.value,'frequency':obj.frequency}
            for obj in objects
        ]
        
        #build a temporary dataframe from this
        df = pd.DataFrame.from_records(data)

        #get all the frequencies
        frequency = df['frequency']
        #normalise the frequency by total recorded
        total = frequency.sum()
        if total > 0 :
            norm_frequency = frequency / frequency.sum()
        else:
            norm_frequency = frequency * 0 
            
        #for each value work out how many times the value must be repeated
        #in order to generate the number_of_events requested
        n_generate = number_of_events*norm_frequency
        #round this number to an integer
        n_generate = n_generate.astype(int)
        
        
        # 1. take the values, which is the first column in this temp df
        #    the 2nd column is the frequency
        # 2. repeat them the number of times needed to generate number_of_events
        # 3. randomly sample them, to mix up and shuffle the values in the column
        # 4. remove the index so that we just have the synthetic value we want
        values = df.iloc[:,0]\
            .loc[df.index.repeat(n_generate)]\
            .sample(frac=1)\
            .reset_index(drop=True)
        
        #append this to the list
        series_synthetic.append(values)

    #merge all columns together to create a new table
    df_synthetic = pd.concat(series_synthetic,axis=1)

    if field_person_id in df_synthetic.columns:
        df_synthetic[field_person_id] = df_synthetic.reset_index()['index']
        
    
    #return this synthetic data table
    return df_synthetic.set_index(df_synthetic.columns[0])

    

def generate_synthetic_data_report(scan_report_id,number_of_events,output_folder):
    scan_report = ScanReport.objects.get(pk=scan_report_id)
    #get all tables for the given dataset (via scanreport id)
    tables = ScanReportTable.objects.filter(scan_report=scan_report)
    #loop over all tables within the dataset
    for table in tables:
        #generate synthetic data in the form of a dataframe for them
        df = generate_synthetic_data_table(table.id,number_of_events)

        if not os.path.isdir(output_folder):
            os.makedirs(output_folder)
        
        print (df)
        df.to_csv(f"{output_folder}{table.name}")
