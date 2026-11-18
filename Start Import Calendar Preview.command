#!/bin/zsh
# Separate development bundle with an embedded disposable profile.
preview_root="${0:A:h}"
unset CALLSHEET_DATA_DIR
exec "$preview_root/build/shooting-days-preview/Script Call.app/Contents/MacOS/Script Call"
