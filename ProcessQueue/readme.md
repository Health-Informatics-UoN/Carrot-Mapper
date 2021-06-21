# ProcessQueue Trigger - Python

**ProcessQueue** refers to the Azure QueueTrigger function which executes  when a new message appears in the Scan Report queue. 

## Triggering the function
When a White Rabbit Scan Report file is uploaded on the site, it is saved into Azure Blob Storage and a message is send to the storage Queue, which triggers the ProcessQueue function

The function downloads the file from blob storage into a BytesIO object and iterates through the file using openpyxl and saves the tables, fields and values to the relevant django models.

