#!/bin/bash

wait-for-it ${COCONNECT_DB_HOST}:${COCONNECT_DB_PORT} -- echo "Database is ready! Listening on ${COCONNECT_DB_HOST}:${COCONNECT_DB_PORT}"

cd /api

python /api/manage.py collectstatic
ls -R /api/staticfiles
python /api/manage.py runserver 0.0.0.0:8000

#while :; do echo 'Hit CTRL+C'; sleep 1; done
