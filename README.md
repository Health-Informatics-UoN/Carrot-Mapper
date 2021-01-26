
# Introduction 
This repository includes a demo in three separate applications using Python,Java and C#, for the purpose of anonymising PII using salting and the SHA-256 hashing algorithm.

 - pseudoanon python file
 - Hashing_java 
 - Hashing (C#)

# Getting Started 
To run the code on this repository:

 1. Clone the repository and navigate to the project directory
 2. For the python code run the following command in your terminal:
	
```python
python pseudoanon.py
```
 3. For the Java project, navigate to Hashing_java and run: 
 ```
java -jar Hashing_java.jar
 ```
 
 4. For the C# project:
	 - Navigate to hashing folder
	 - Open hashing.csproj in Visual Studio 
	 - Run the app using the IDE
## Description

The code in this repository has the following functions:

 1. Takes in a number of datasets (For the purpose of the demo these are two datasets which include dummy data).
 2. Appends the Salt(generated seperately and stored in a CSV file) to the original string to be anonymised.
 3. Takes in the string with the salt and applies the SHA-256 hashing algorithm.
 4. Prints out the original string and the hashed string for visualisation purposes.
 