#!/bin/bash
export PATH="/Users/ameyaswani/node/bin:$PATH"
cd "$(dirname "$0")"
exec node node_modules/.bin/vite --port 8083
