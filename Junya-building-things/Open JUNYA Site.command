#!/bin/bash
# Double-click me in Finder to open the JUNYA site locally
cd "$(dirname "$0")"
# start the local server if it isn't running
if ! curl -s -o /dev/null http://localhost:8787/; then
  nohup python3 -m http.server 8787 >/dev/null 2>&1 &
  sleep 1
fi
open "http://localhost:8787/"
