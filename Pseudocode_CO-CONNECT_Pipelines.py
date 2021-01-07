#R code for converting .xlsx to .csv
#setwd() #set path of the file
#library("readxl")
#library(dplyr)
#my_data <- read_excel("Basic_Example.xlsx")
#write.csv(my_data, 'data.csv')

#python Code
#source https://medium.com/better-programming/using-python-to-convert-worksheets-in-an-excel-file-to-separate-csv-files-7dd406b652d7
import csv
import xlrd
import sys

#pipeline of getting white rabbit scan report .xlsx into rabbit in a hat
def ConnectDatabaseToWhiteRabbitAndGetWhiteRabbitOutput():
    #NOTE: figure out how to get White Rabbit to work from terminal
    return WhiteRabbitScanReportFile

#pipeline of getting white rabbit scan report .xlsx into rabbit in a hat
def InputWhiteRabbitScanReportIntoRabbitInAHat():
    #NOTE: figure out how to get Rabbit in a Hat to start from terminal

#pipeline of getting rabbit in a hat output as .html or .docx
def InputWhiteRabbitScanReportIntoRabbitInAHat():
    #NOTE: figure out how the format of the Rabbit in a Hat output is set up

#piepline of getting white rabbit scan report to be converted into multiple .csv files
def WhiteRabbitExceltoCSV(excel_file, csv_file_base_path):
    workbook = xlrd.open_workbook(excel_file)
    csv_files= []
    for sheet_name in workbook.sheet_names():
    #NOTE: customize script to handle merged cells
        print 'processing - ' + sheet_name
        worksheet = workbook.sheet_by_name(sheet_name)
        csv_file_full_path = csv_file_base_path + sheet_name.lower().replace(" - ", "_").replace(" ","_") + '.csv'
        csv_file = open(csv_file_full_path, 'wb')
        writetocsv = csv.writer(csv_file, quoting = csv.QUOTE_ALL)
        for rownum in xrange(worksheet.nrows):
            writetocsv.writerow(
                list(x.encode('utf-8') if type(x) == type(u'') else x for x in worksheet.row_values(rownum))
            )
        csv_files.append(csv_file)
        csvfile.close()
    return csv_files

#pipeline of white rabbit .csv files and optional data dictionary to Usagi
def WhiteRabbitOutputCSVToUsagi(csv_files, data_dictionary= None):
    #this usagi_input_csv_file file contain the source_code, source_description, and frequencies to help Usagi with the mapping
    usagi_input_csv_file = open(csv_file_full_path, 'w')
    for csv_file in csv_files:
        file_input = csv.reader(csv_file)
        for row in file_input:
            #pricess file_input so only source_code, source_description, and frequencies are extracted and written to new csv files
            usagi_input_csv_file.writerow(list(row))
    #once usagi_input_csv_file is filled, we can then input it into Usagi from the terminal and open its GUI.
    #NOTE: this function must also account for the data dictionary somehow, when it is present
    return usagi_input_csv_file
