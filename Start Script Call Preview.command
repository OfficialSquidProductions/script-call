#!/bin/zsh
set -e
cd "${0:A:h}"
export CALLSHEET_DATA_DIR="$PWD/.reporter-preview-data"
exec "$PWD/build/reporter-preview/Script Call.app/Contents/MacOS/Script Call"
