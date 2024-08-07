# To enable ssh & remote debugging on app service change the base image to the one below
# FROM mcr.microsoft.com/azure-functions/python:4-python3.11-appservice
FROM mcr.microsoft.com/azure-functions/python:4-python3.11

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true \
    AzureFunctionsWebHost__hostid=carrot-worker

# Set a working directory
WORKDIR /app/workers

# Copy pyproject.toml and poetry.lock
COPY pyproject.toml poetry.lock ./

# Install Poetry
RUN pip install poetry

# Export requirements from pyproject.toml and install them
RUN poetry config warnings.export false \
    && poetry config virtualenvs.create false
# Delete the requirements.txt related code, due to errors there, deleted --> worked???

COPY . /home/site/wwwroot