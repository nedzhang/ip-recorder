#!/bin/bash

# ip-recorder
#   A Node Express application to record requester's IP address

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

HTTP_PORT=58080

CONTAINER_NAME=ip-recorder-simple
CONTAINER_WORK_DIR=/opt/ip-recorder

# Docker run options:
#   expose container port 8080 as HTTP_PORT
#   mount current directory as CONTAINER_WORK_DIR in container
#   remove container upon exit (session-less)
#   run in background (deamon)
#   use syslog to persist log
#   use node:latest image
#   start the ip-record application with npm install && npm start

docker run \
    -p ${HTTP_PORT}:8080 \
    -v ${DIR}:${CONTAINER_WORK_DIR} \
    --name ${CONTAINER_NAME} \
    --rm \
    -d \
    --log-driver syslog \
    node \
    /bin/bash -c \
    "cd ${CONTAINER_WORK_DIR}/ \
    && npm install \
    && npm start"
