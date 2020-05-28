#!/bin/bash

function info { echo -e "\033[0;36m$*\033[0;m"; }
function verbose { echo -e "\033[0;33m$*\033[0;m"; }
function error { echo -e "\033[0;31m$*\033[0;m"; }
function success { echo -e "\033[0;32m$*\033[0;m"; }

if [ ! -f secrets.env ]; then
  error "Missing secrets.env"
  info "HOST=
PORT=
USERNAME=
PASSWORD=
DB=
"
  exit 1
fi

source secrets.env
DATE=$(date +'%Y-%m-%d')
verbose mongodump --host=$HOST --port=$PORT --username=... --password=... --db=$DB --out=dump.$DATE
mongodump --host=$HOST --port=$PORT --username=$USERNAME --password=$PASSWORD --db=$DB --out=dump.$DATE
