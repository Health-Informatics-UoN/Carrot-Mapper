# azure_functions_settings.py

import os

from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.environ.get("SECRET_KEY")

# Add the database settings
DATABASES = {
    "default": {
        "ENGINE": os.getenv("COCONNECT_DB_ENGINE"),
        "HOST": os.getenv("COCONNECT_DB_HOST"),
        "PORT": os.getenv("COCONNECT_DB_PORT"),
        "NAME": os.getenv("COCONNECT_DB_NAME"),
        "USER": os.getenv("COCONNECT_DB_USER"),
        "PASSWORD": os.getenv("COCONNECT_DB_PASSWORD"),
        "TEST": {
            "NAME": "throwawaydb",
        },
    }
}
