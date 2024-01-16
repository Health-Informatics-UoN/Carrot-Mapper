### Table of Contents
1. [Introduction](#introduction)
1. [Getting Started](#getting-started)
1. [Custom Styling](#custom-styling)
   1. [CSS](#css)
   2. [JavaScript](#javascript)

# Introduction
This repository contains information and code for the CaRROT-Mapper system. This is a containerised 
Django/React webapp and associated Azure Functions which facilitates the generation of rules mapping
datasets to the OMOP standard through manual and automated means.

# Getting Started <a name="getting-started"></a>

See the Developer Quickstart at the [CaRROT documentation](https://hdruk.github.io/CaRROT-Docs/CaRROT-Mapper/quickstart-webapp/).

# Custom Styling <a name="custom-styling"></a>

The folder `api/static/` contains static folders that can be used to store custom `css` and `javascript`. Files contained within are then made publically accessable, i.e. viewable by the frontend code, for example:
```html
<img src="{% static 'images/coconnect-logo.png' %}"...>
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
