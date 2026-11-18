#!/usr/bin/env python3
"""Re-export the non-sensitive fixture through an installed source checkout.

No source workspace or installed app is opened. PDF blobs go to a temporary
consumer-local directory, and only the requested output fixture is written.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import tempfile

parser = argparse.ArgumentParser()
parser.add_argument('source_root', type=Path, help='Production Desk windows-src directory')
parser.add_argument('output', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[2]
sys.dont_write_bytecode = True
sys.path.insert(0, str(args.source_root.resolve()))
from project_file import import_project, export_project
fixture = json.loads((root / 'tests/fixtures/last-light.productiondesk').read_bytes())
with tempfile.TemporaryDirectory(prefix='productiondesk-export-') as tmp:
    datafile = Path(tmp) / 'disposable-data.json'
    workspace = import_project(datafile, fixture)
    raw = export_project(datafile, workspace)
args.output.write_bytes(raw)
print(json.dumps({'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest(),
                  'exporterSHA256': hashlib.sha256((args.source_root / 'project_file.py').read_bytes()).hexdigest()}))
