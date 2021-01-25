import secrets
import csv




dataproviders=[]
salts=[]
input_string=input("Enter data providers: ")
print("\n")
dplist=input_string.split()
print( " New providers:", dplist)


if input_string!="":
    with open('salts.csv','a+', newline='') as f:
        csv_writer=csv.writer(f)
        for word in dplist:
            csv_writer.writerow([word])
else:
    print("no new data providers")
f.close()

with open('salts.csv','r') as file:
    csv_reader=csv.DictReader(file, delimiter=',')
   
    for lines in csv_reader:
        dataproviders.append(lines['dataprovider'])
    txt=input("Compute new salt?(Y/N) ")
    if txt=="Y":
        for i in dataproviders:
            salt=secrets.token_hex(64)
            salts.append(salt)
    else:
        for lines in csv_reader:
            salts.append(lines['salt'])
file.close()



data=zip( dataproviders,
      salts)
     
      
      

print (len(dataproviders))
print(len(salts))
zip(*dataproviders)
print(data)
fields=["dataprovider","salt"]
with open('salts.csv','w') as newfile:
     writer=csv.writer(newfile)
     writer.writerow(fields)
     for word in data:
         writer.writerow(word)
newfile.close()

    