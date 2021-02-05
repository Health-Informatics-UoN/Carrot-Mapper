### Table of Contents
1. [Introduction](#introduction)
1. [Getting Started](#getting-started)
   1. [Manually](#manually)
   1. [Docker](#docker)
   1. [Refreshing](#refreshing) 
1. [Pages](#pages)
   1. [Admin](#admin)
   1. [Signup](#signup)
   1. [ScanReports](#scanreports)
1. [Custom Styling](#custom-styling)
   1. [CSS](#css)
   2. [JavaScript](#javascript)

# Introduction
This repository contains information and code for the CO-CONNECT Mapping Pipeline.

# Getting Started <a name="getting-started"></a>

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
#build the docker images, and start running (as daemon, remove `-d` for without) 
docker-compose up -d --build
# refresh migrations
docker-compose exec api python manage.py makemigrations
docker-compose exec api python manage.py migrate
# make superuser
docker-compose exec api python manage.py createsuperuser
```

To stop, without removing all the containers use `stop`:
```bash
docker-compose stop
```
You can alternatively use `down` to remove everything (changes made within the containers).

## Refreshing

A couple of tips for refreshing/cache clearing if you have picked up large changes..
* Remove `api/db.sqlite3`
* Remove migration files e.g. `0001_initial.py` from `api/mapping/migrations/`
  * :warning: keep `__init__.py`
  * :bulb: `ls api/mapping/migrations/ | grep -v __init__.py | xargs rm` 


# Pages

:warning: If you run manually the port is `8000`, with the docker container, port `8000` (in the container) is forwarded to `8080` (local)

## Admin 
Point to [http://127.0.0.1:8080/admin/](http://127.0.0.1:8080/admin/) to access the django admin.

## Signup
Sign up an account so that you're able to login
[http://127.0.0.1:8080/signup/](http://127.0.0.1:8080/signup/)

## ScanReports
To access the scanreports route, go to:
[http://127.0.0.1:8080/scanreports/](http://127.0.0.1:8080/scanreports/)

# Custom Styling <a name="custom-styling"></a>

The folder `api/static/` contains static folders that can be used to store custom `css` and `javascript`. Files contained within are then made publically accessable, i.e. viewable by the frontend code, for example:
```html
<img src="{% static 'images/cropped-LARGE_co-connect-logo-1-180x180.png' %}"...>
```

## CSS

Styling of elements and the modification of Bootstrap elements can be made in `api/static/style/custom.css`.

For example, to change the background style of the navbar..:
```css
/* make some snazy 90s-like theme for the nav bar */
.bg-co-connect {
    background:  linear-gradient(180deg,rgba(0,0,0,0) 0 96px, var(--co-connect-tertiary) 96px 100%),
		 linear-gradient(110deg,white 0 90px, var(--co-connect-primary-light) 150px , var(--co-connect-primary) 400px 80%,var(--co-connect-secondary));
}

/* change the navbar link colors  and mouse-over actions */
.nav-link{
	color:white !important;
    }
.nav-link:hover{
    color:rgba(256,256,256,0.5) !important;
}
```


## JavaScript
Any `js`, e.g. `jquery` ajax calls can be inserted in `api/static/javascript/custom.js`.
