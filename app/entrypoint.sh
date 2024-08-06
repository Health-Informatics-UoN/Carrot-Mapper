#!/bin/bash

# Run npm build
export PATH=$PATH:/home/django/.nvm/versions/node/v12.18.3/bin
cd /react-client-app
npm run build

# Wait until DB is available
wait-for-it ${COCONNECT_DB_HOST}:${COCONNECT_DB_PORT} -- echo "Database is ready! Listening on ${COCONNECT_DB_HOST}:${COCONNECT_DB_PORT}"

cd /api

# Load OMOP table and field names into the database
# python manage.py loaddata mapping
# if [ $? -ne 0 ]; then
#     echo "Error loading mapping data"
#     exit 1
# fi

# # Create superuser
# python manage.py createsuperuser
# if [ $? -ne 0 ]; then
#     echo "Error creating superuser"
#     exit 1
# fi

# Collect static files for serving
rm -rf staticfiles
mkdir staticfiles
python manage.py collectstatic
python manage.py migrate

# Set tmp dir to be in-memory for speed. Pass logs to stdout/err as Docker will expect them there
gunicorn --config gunicorn.conf.py --worker-tmp-dir /dev/shm --timeout 600 --log-file=- --bind :8000 --workers 3 config.wsgi:application --reload