import glob
import pandas as pd
import hashlib
import numpy as np
import secrets

# List raw CSV filepaths
input_files = glob.glob("data/*.csv")
saltfile="salts/salts.csv"
# Using hashlib to create a sha256 hash of the 'id' column
# Creates a column called sha256 wich hashes 'id'
results = []
sdf=pd.read_csv(saltfile)
for filename in input_files:
    for salt in sdf['salt']:

    
    
        df = pd.read_csv(filename)
        #Create a salt for each dataset
        #Append it to user id
        # cryptogen=secrets.token_hex(64)
        # print(cryptogen)
        df['salt']=df['id']+ str(salt)        
        #Hash the salted user id
        df['sha256'] = [hashlib.sha256(val.encode('UTF-8')).hexdigest() for val in df['salt']]
        results.append(df)

print(results[0])
print(results[1])
