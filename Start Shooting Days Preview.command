#!/bin/zsh
set -e
cd "${0:A:h}"
# The --preview bundle embeds its own dedicated profile, even on direct launch.
unset CALLSHEET_DATA_DIR
exec "$PWD/build/shooting-days-preview/Script Call.app/Contents/MacOS/Script Call"
