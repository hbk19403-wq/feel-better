#!/bin/bash
ulimit -n 65536
export PATH="/Applications/Codex.app/Contents/Resources/cua_node/bin:$PATH"
export EXPO_PUBLIC_API_URL="http://localhost:3001"
cd "$(dirname "$0")"
exec node_modules/.bin/expo start --web --port 8082
