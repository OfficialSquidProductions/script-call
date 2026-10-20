#!/bin/zsh
set -e
cd "${0:A:h}"
export CALLSHEET_DATA_DIR="$PWD/.local-data"
exec "$PWD/build/mac/Script Call.app/Contents/MacOS/Script Call"
