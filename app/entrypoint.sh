#!/bin/bash

# Run npm build
export PATH=$PATH:/home/django/.nvm/versions/node/v12.18.3/bin
cd /react-client-app
npm run build

# Wait until DB is available
wait-for-it ${COCONNECT_DB_HOST}:${COCONNECT_DB_PORT} -- echo "Database is ready! Listening on ${COCONNECT_DB_HOST}:${COCONNECT_DB_PORT}"

cd /api

echo "Loading mapping data"
python manage.py loaddata mapping
if [ $? -ne 0 ]; then
    echo "Error loading mapping data"
    exit 1
fi

# Check if a superuser named 'admin' exists
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); exit(0) if User.objects.filter(username='admin', is_superuser=True).exists() else exit(1)"
if [ $? -eq 0 ]; then
  echo "Superuser already exists. Skipping creating superuser..."
else
  echo "Creating superuser..."
  python manage.py createsuperuser --noinput --username $DJANGO_SUPERUSER_USERNAME --email $DJANGO_SUPERUSER_EMAIL
  if [ $? -ne 0 ]; then
    echo "Error creating superuser"
    exit 1
  fi

  # Set superuser password
  echo "from django.contrib.auth import get_user_model; User = get_user_model(); user = User.objects.get(username='$DJANGO_SUPERUSER_USERNAME'); user.set_password('$DJANGO_SUPERUSER_PASSWORD'); user.save()" | python manage.py shell
fi

# Collect static files for serving
rm -rf staticfiles
mkdir staticfiles
python manage.py collectstatic
python manage.py migrate

# Set tmp dir to be in-memory for speed. Pass logs to stdout/err as Docker will expect them there
gunicorn --config gunicorn.conf.py --worker-tmp-dir /dev/shm --timeout 600 --log-file=- --bind :8000 --workers 3 config.wsgi:application --reload