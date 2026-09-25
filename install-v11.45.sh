#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
node apply-v11.45-consolidated.js
npm run build
printf '\nV11.45 consolidée et contrôlée. Lancez ensuite : npm start\n'
