# Introduction
This repository contains information and code for the CO-CONNECT Mapping Pipeline.

# Getting Started

## Manually
To run the mapping pipeline Django MVP:

1.	Clone this repository
2.	Create a Python virtual environment and install Django
3.	Create a new superuser for testing (python manage.py createsuperuser)
4.	Initialise the demo data (python manage.py loaddata initial_data/tables_app_data.json)
5.  Make migrations to load demo data into your local SQLite db
6.  Log into the admin area at http://127.0.0.1:8000/admin/ to view the data

## Docker

Copy .env file from Teams Software Team -> files -> .env to the root of project. Then run the commands below.

```bash
docker-compose up -d --build
docker-compose exec api python manage.py makemigrations
docker-compose exec api python manage.py migrate
```
