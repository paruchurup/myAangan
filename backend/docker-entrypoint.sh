#!/bin/sh
# Fix ownership of the uploads volume mount (runs as root briefly)
mkdir -p /app/uploads/photos
chown -R myaangan:myaangan /app/uploads
chmod -R 755 /app/uploads

# Drop to non-root user and start Spring Boot
exec su-exec myaangan java \
  -Dspring.datasource.hikari.initializationFailTimeout=60000 \
  -jar /app/app.jar
