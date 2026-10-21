#!/usr/bin/env python3
"""Archive an existing Script Call bundle with an existing Developer ID identity."""
from pathlib import Path
import argparse,plistlib,shutil,subprocess,sys,datetime
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--app',required=True,type=Path);p.add_argument('--out',required=True,type=Path);p.add_argument('--identity',required=True);p.add_argument('--team',required=True);a=p.parse_args()
info=plistlib.loads((a.app/'Contents/Info.plist').read_bytes())
if info['CFBundleIdentifier']!='org.squidproductions.callsheet.prototype' or a.out.exists():raise SystemExit('Choose Script Call and a fresh archive output path.')
target=a.out/'Products/Applications'/a.app.name;target.parent.mkdir(parents=True);shutil.copytree(a.app,target,symlinks=True)
subprocess.run([sys.executable,str(Path(__file__).with_name('sign_mac.py')),'--app',str(target),'--identity',a.identity],check=True)
metadata={'ArchiveVersion':2,'CreationDate':datetime.datetime.utcnow(),'Name':'Script Call','SchemeName':'Script Call','ApplicationProperties':{'ApplicationPath':'Applications/'+a.app.name,'CFBundleIdentifier':info['CFBundleIdentifier'],'CFBundleShortVersionString':info['CFBundleShortVersionString'],'CFBundleVersion':info['CFBundleVersion'],'SigningIdentity':a.identity,'Team':a.team}}
(a.out/'Info.plist').write_bytes(plistlib.dumps(metadata));print(a.out)
