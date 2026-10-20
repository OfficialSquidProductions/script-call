#!/usr/bin/env python3
"""Sign a prepared Script Call bundle with an existing Developer ID. No key creation."""
import argparse, plistlib, subprocess
from pathlib import Path

MAGIC={bytes.fromhex(s) for s in ('feedface','cefaedfe','feedfacf','cffaedfe','cafebabe','bebafeca','cafebabf','bfbafeca')}
def sign(app,identity):
    app=app.resolve()
    info=plistlib.loads((app/'Contents/Info.plist').read_bytes())
    if app.suffix!='.app' or info.get('CFBundleIdentifier')!='org.squidproductions.callsheet.prototype':
        raise ValueError('Choose a prepared Script Call .app copy.')
    paths=list(app.rglob('*'));binaries=[]
    for p in paths:
        if p.is_file() and not p.is_symlink():
            with p.open('rb') as f:
                if f.read(4) in MAGIC:binaries.append(p)
    bundles=[p for p in paths if p.is_dir() and not p.is_symlink() and p.suffix in ('.app','.xpc','.framework','.bundle') and any(p in b.parents for b in binaries)]
    entitlements=Path(__file__).resolve().parents[1]/'desktop/entitlements.mac.plist'
    for target in binaries+sorted(bundles,key=lambda p:len(p.parts),reverse=True)+[app]:
        command=['codesign','--force','--sign',identity,'--options','runtime','--timestamp']
        if target.suffix=='.app':command+=['--entitlements',str(entitlements)]
        subprocess.run(command+[str(target)],check=True,capture_output=True)
    subprocess.run(['codesign','--verify','--deep','--strict',str(app)],check=True)
    print('Developer ID signature verified with the required V8 JIT entitlement:',app)
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--app',required=True,type=Path);p.add_argument('--identity',required=True);args=p.parse_args();sign(args.app,args.identity)
