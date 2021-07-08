#!/bin/bash

wait-for-it ${COCONNECT_DB_HOST}:${COCONNECT_DB_PORT} -- echo "Database is ready! Listening on ${COCONNECT_DB_HOST}:${COCONNECT_DB_PORT}"

cd /api

rm -rf staticfiles/
mkdir staticfiles

python /api/manage.py collectstatic

python /api/manage.py runserver 0.0.0.0:8000
