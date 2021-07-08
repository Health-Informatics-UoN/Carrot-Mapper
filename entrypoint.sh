#!/bin/bash

wait-for-it ${COCONNECT_DB_HOST}:${COCONNECT_DB_PORT} -- echo "Database is ready! Listening on ${COCONNECT_DB_HOST}:${COCONNECT_DB_PORT}"

cd /api
echo "rm"
rm -rf staticfiles/{*,.*}
echo "rm-ed"
#echo "mkdir"
#mkdir staticfiles
#echo "mkdir-ed"
python /api/manage.py collectstatic

python /api/manage.py runserver 0.0.0.0:8000
