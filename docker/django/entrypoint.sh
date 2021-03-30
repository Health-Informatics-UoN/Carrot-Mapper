#!/bin/bash

wait-for-it ${POSTGRES_HOST}:${POSTGRES_PORT} -- echo "Database is ready! Listening on ${POSTGRES_HOST}:${POSTGRES_PORT}"

cd /api

python /api/manage.py runserver 0.0.0.0:8000

#while :; do echo 'Hit CTRL+C'; sleep 1; done
