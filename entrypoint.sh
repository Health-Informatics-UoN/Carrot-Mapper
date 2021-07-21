#!/bin/bash
echo "wait"
wait-for-it ${COCONNECT_DB_HOST}:${COCONNECT_DB_PORT} -- echo "Database is ready! Listening on ${COCONNECT_DB_HOST}:${COCONNECT_DB_PORT}"

cd /api
ls -al
echo "rm"
rm -rf staticfiles
echo "mkdir"
mkdir staticfiles
ls staticfiles
python /api/manage.py collectstatic
ls staticfiles
# Set tmp dir to be in-memory for speed. Pass logs to stdout/err as Docker will expect them there
gunicorn --worker-tmp-dir /dev/shm --log-file=- --bind :8000 --workers 3 api.wsgi:application
