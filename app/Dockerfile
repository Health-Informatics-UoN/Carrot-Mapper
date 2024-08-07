FROM python:3.11-slim
LABEL authors="Roberto Santos"

ENV PYTHONUNBUFFERED 1

EXPOSE 8000

RUN apt-get update && \
    apt-get install -y \
        vim \
        htop \
        wait-for-it \
        binutils \
        gettext \
        libpq-dev \
        gcc \
        graphviz \
        git

# Install rustup to allow install of cryptography package
RUN curl -y --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Create django user
RUN addgroup -q django && \
    adduser --quiet --ingroup django --disabled-password django

# Create /api directory for mounting
USER root
RUN mkdir /api
WORKDIR /api
RUN chown -R django:django /api

# Install PyPI packages as django user
USER django
ENV PATH=/home/django/.local/bin:$PATH

# Copy pyproject.toml and poetry.lock
COPY ./api/pyproject.toml /api/pyproject.toml
COPY ./api/poetry.lock /api/poetry.lock

# Copy shared package
COPY ./shared /shared

# Install Poetry
RUN pip install poetry

# Export requirements from pyproject.toml and install them
RUN poetry config virtualenvs.create false \
    && poetry export --format requirements.txt --output /api/requirements.txt --without-hashes \
    && pip install --no-cache-dir -r /api/requirements.txt

# Copy react-client-app directory
USER root
COPY ./react-client-app /react-client-app
RUN chown -R django:django /react-client-app

# Install nvm as django user
USER django
WORKDIR /react-client-app
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
ENV NVM_DIR "/home/django/.nvm"
RUN [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" && nvm install 12.18.3 && npm install

# Copy entrypoint as root, elevate it to executable, then give it over to django user
USER root
COPY ./entrypoint.sh /entrypoint.sh
RUN chmod u+x /entrypoint.sh
RUN chown -R django:django /entrypoint.sh

# Set the working directory to /api
WORKDIR /api
ENTRYPOINT ["/entrypoint.sh"]

# Return to django user to run the container as this user by default
USER django
