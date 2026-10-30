#!/bin/sh
set -eu

java -jar /app/app.jar --spring.main.web-application-type=none --app.command=migrate
exec java -jar /app/app.jar "$@"
