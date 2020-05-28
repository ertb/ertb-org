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
last=$(ls -d dump.[0-9]* | tail -n 1)

verbose mv $last/$DB $last/meteor
mv $last/$DB $last/meteor
trap "{ verbose mv $last/meteor $last/$DB; mv $last/meteor $last/$DB; }" EXIT

verbose mongorestore --port=3001 $last
mongorestore --port=3001 $last
