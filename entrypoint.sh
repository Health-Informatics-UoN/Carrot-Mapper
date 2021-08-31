#!/bin/bash

# export NVM_DIR="/home/django/.nvm"
# [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
export PATH=$PATH:/home/django/.nvm/versions/node/v12.18.3/bin

npm run build

wait-for-it ${COCONNECT_DB_HOST}:${COCONNECT_DB_PORT} -- echo "Database is ready! Listening on ${COCONNECT_DB_HOST}:${COCONNECT_DB_PORT}"

cd /api
rm -rf staticfiles
mkdir staticfiles

python /api/manage.py collectstatic

# Set tmp dir to be in-memory for speed. Pass logs to stdout/err as Docker will expect them there
gunicorn --worker-tmp-dir /dev/shm --timeout 600 --log-file=- --bind :8000 --workers 3 api.wsgi:application
