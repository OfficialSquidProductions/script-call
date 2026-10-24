#!/bin/zsh
set -e
cd "${0:A:h}"
unset CALLSHEET_DATA_DIR CALLSHEET_PREVIEW_HIDDEN
exec "$PWD/build/availability-preview/Script Call.app/Contents/MacOS/Script Call"
