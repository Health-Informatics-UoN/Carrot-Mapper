import secrets
import csv

salt=secrets.token_hex(64)

fields=["salt"]
with open('salts/salts.csv','w') as newfile:
     writer=csv.writer(newfile)
     writer.writerow(fields)
     writer.writerow([salt])
newfile.close()