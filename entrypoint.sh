#!/bin/bash

npm run build

wait-for-it ${COCONNECT_DB_HOST}:${COCONNECT_DB_PORT} -- echo "Database is ready! Listening on ${COCONNECT_DB_HOST}:${COCONNECT_DB_PORT}"

cd /api
rm -rf staticfiles
mkdir staticfiles

python /api/manage.py collectstatic

# Set tmp dir to be in-memory for speed. Pass logs to stdout/err as Docker will expect them there
gunicorn --worker-tmp-dir /dev/shm --timeout 600 --log-file=- --bind :8000 --workers 3 api.wsgi:application
