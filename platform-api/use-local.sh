#!/usr/bin/env bash
#
# Switch @intabia-fusion/api dependency to a local tarball in ./tarballs/.
# Usage:
#   ./use-local.sh              # picks newest intabia-fusion-api-*.tgz in ./tarballs/
#   ./use-local.sh path.tgz     # use explicit tarball path
#
set -euo pipefail

cd "$(dirname "$0")"

if [[ "${1:-}" != "" ]]; then
  TARBALL="$1"
else
  TARBALL=$(ls -t tarballs/intabia-fusion-api-*.tgz 2>/dev/null | head -n1 || true)
fi

if [[ -z "${TARBALL}" || ! -f "${TARBALL}" ]]; then
  echo "Tarball not found."
  echo "Download intabia-fusion-api-*.tgz into ./tarballs/ first."
  echo "See README.md for where to get it."
  exit 1
fi

echo "Using local tarball: ${TARBALL}"

node -e "
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json','utf8'));
p.dependencies['@intabia-fusion/api'] = 'file:${TARBALL}';
fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
"

rm -rf node_modules package-lock.json
npm cache clean --force >/dev/null 2>&1 || true
npm install
echo "Done. @intabia-fusion/api -> file:${TARBALL}"
