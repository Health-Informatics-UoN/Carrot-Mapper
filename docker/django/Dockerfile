FROM python:3.8
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
        default-jre

RUN addgroup -q django && \
    adduser --quiet --ingroup django --disabled-password django

RUN mkdir /api

WORKDIR /api

COPY requirements.txt /requirements.txt

COPY entrypoint.sh /entrypoint.sh

USER django

ENV PATH=/home/django/.local/bin:$PATH

RUN pip install -r /requirements.txt

USER root

RUN apt-get install graphviz -y
COPY co-connect-tools/requirements.txt /requirements-cc.txt
RUN pip install -r /requirements-cc.txt

COPY co-connect-tools /coconnect
RUN ls /coconnect
RUN pip install -e /coconnect

USER django
RUN echo "hiya"

