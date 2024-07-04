# To enable ssh & remote debugging on app service change the base image to the one below
# FROM mcr.microsoft.com/azure-functions/python:4-python3.11-appservice
FROM mcr.microsoft.com/azure-functions/python:4-python3.11

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true \
    AzureFunctionsWebHost__hostid=carrot-worker

# Set a working directory
WORKDIR /app

# Copy pyproject.toml and poetry.lock
COPY pyproject.toml poetry.lock ./

# Install Poetry
RUN pip install poetry

# Export requirements from pyproject.toml and install them
RUN poetry config virtualenvs.create false \
    && poetry export --format requirements.txt --output /api/requirements.txt --without-hashes \
    && pip install --no-cache-dir -r /api/requirements.txt

COPY . /home/site/wwwroot