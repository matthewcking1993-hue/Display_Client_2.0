#!/usr/bin/env bash
set -euo pipefail

if [[ -n "${IOS_CERTIFICATE:?}" ]]; then
  echo "Using signing assets from environment"
fi

npm ci
npm run build:ios
