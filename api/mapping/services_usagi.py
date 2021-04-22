

def build_usagi_index():
    # Use 'build' to create index for the first time.
    # Index stored in data/usagi/mainIndex
    p = subprocess.Popen(
        "java -jar Usagi.jar build usagi_build_index.properties",
        cwd="/data/usagi",
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )

    # Print console output to screen so you can see it's working (or not!)
    stdout = []
    while True:
        line = p.stdout.readline()
        if not isinstance(line, (str)):
            line = line.decode("utf-8")
        stdout.append(line)
        print(line)
        if line == "" and p.poll() != None:
            break


def run_usagi(scan_report_id):

    print("RUNNING USAGI....")

    # Grab data from DataDictionary
    # This filters out all entries in the dictionary
    # which are marked PatientID/DateEvent/Ignore
    dict = (
        DataDictionary.objects.filter(
            source_value__scan_report_field__scan_report_table__scan_report__id=scan_report_id
        )
        .filter(source_value__scan_report_field__is_patient_id=False)
        .filter(source_value__scan_report_field__is_date_event=False)
        .filter(source_value__scan_report_field__is_ignore=False)
        .exclude(source_value__value="List truncated...")
    )

    dict_df = pd.DataFrame.from_dict(
        dict.values(
            "source_value__scan_report_field__scan_report_table__scan_report__data_partner__name",
            "source_value__scan_report_field__scan_report_table__scan_report__dataset",
            "source_value__scan_report_field__scan_report_table__name",
            "source_value__scan_report_field__name",
            "source_value__value",
            "source_value__frequency",
            "dictionary_field_description",
            "dictionary_value_description",
        )
    )

    # Name columns
    dict_df.columns = [
        "DataPartner",
        "DataSet",
        "Table",
        "Field",
        "Value",
        "Frequency",
        "FieldDesc",
        "ValueDescription",
    ]

    df = dict_df

    # df = df.head(10)
    df.to_csv("/data/usagi/input/usagi_input_data.csv", index=False)

    # # Run Usagi
    # p = subprocess.Popen('java -jar dist/Usagi.jar run input/usagi.properties', cwd="/data/usagi", shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)

    # stdout = []
    # while True:
    #     line = p.stdout.readline()
    #     if not isinstance(line, (str)):
    #         line = line.decode('utf-8')
    #     stdout.append(line)
    #     print(line)
    #     if (line == '' and p.poll() != None):
    #         break

    # Clean up inputs
    # os.remove('/data/usagi/usagi_input/usagi_input_data.csv')
    # os.remove('/data/usagi/usagi_input/usagi.properties')

    print("USAGI FINISHED!")
