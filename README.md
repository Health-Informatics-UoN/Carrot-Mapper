### Table of Contents
1. [Introduction](#introduction)
1. [Getting Started](#getting-started)
   1. [Manually](#manually)
   1. [Docker](#docker)
   1. [Refreshing](#refreshing) 
1. [Pages](#pages)
   1. [Admin](#admin)
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
3.	Create a new superuser for testing
4. Log into the admin area at localhost:8080/admin/ to view the data

## Docker

Copy `Teams Software Team -> files -> env files -> env` to the root of project and rename it to `.env`. Ensure that it 
contains all the variables from `sample-env.txt` from the repository. Then run the commands below.

```bash
#build the docker image, and tag it
#make sure you include . at the end of the command
docker build --tag <docker_image>:<tag> .

# run the app
docker run -it --volume $PWD/api:/api --env-file .env -p 8080:8000 <docker_image>

```

# Pages

:warning: If you run manually the port is `8000`, with the docker container, port `8000` (in the container) is forwarded to `8080` (local)

## Admin 
Point to [http://127.0.0.1:8080/admin/](http://127.0.0.1:8080/admin/) to access the django admin.


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
