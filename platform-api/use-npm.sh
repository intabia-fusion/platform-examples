#!/usr/bin/env bash
#
# Switch @intabia-fusion/api dependency back to the npm registry.
# Usage:
#   ./use-npm.sh             # uses ^1.0.0
#   ./use-npm.sh 1.2.3       # pin exact version
#
set -euo pipefail

cd "$(dirname "$0")"

VERSION="${1:-^1.0.0}"
echo "Using npm registry: @intabia-fusion/api@${VERSION}"

node -e "
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json','utf8'));
p.dependencies['@intabia-fusion/api'] = '${VERSION}';
fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
"

rm -rf node_modules package-lock.json
npm install
echo "Done. @intabia-fusion/api -> ${VERSION}"
