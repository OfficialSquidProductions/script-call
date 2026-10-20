#!/usr/bin/env python3
"""Explicit developer setup only. Normal app use never downloads dependencies."""
from pathlib import Path,PurePosixPath
import urllib.request,json,hashlib,base64,tarfile,io,subprocess,sys
root=Path(__file__).resolve().parents[1]
meta=json.loads((root/'tools/runtime-dependencies.json').read_text())
for name in ['fflate','suncalc']:
 m=meta[name];raw=urllib.request.urlopen(m['url'],timeout=60).read()
 assert hashlib.sha1(raw).hexdigest()==m['shasum']
 assert base64.b64encode(hashlib.sha512(raw).digest()).decode()==m['integrity'].split('-',1)[1]
 with tarfile.open(fileobj=io.BytesIO(raw),mode='r:gz') as archive:
  for entry in archive.getmembers():
   parts=PurePosixPath(entry.name).parts
   if not entry.isfile() or not parts or parts[0]!='package' or '..' in parts:continue
   p=root/'node_modules'/name/Path(*parts[1:]);p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(archive.extractfile(entry).read())
if sys.platform!='darwin':raise SystemExit('Dependencies installed. On Windows use npm install for Electron/build tooling; no Windows runtime is downloaded by this Mac setup helper.')
m=meta['electron'];target=root/'.runtime/electron-v44.9.1-darwin-arm64.zip';target.parent.mkdir(exist_ok=True)
if not target.exists() or hashlib.sha256(target.read_bytes()).hexdigest()!=m['sha256']:urllib.request.urlretrieve(m['url'],target)
assert hashlib.sha256(target.read_bytes()).hexdigest()==m['sha256']
subprocess.run(['ditto','-xk',str(target),str(root/'.runtime/electron')],check=True)
print('Verified Mac arm64 runtime and pinned dependencies are ready. No accounts, keys or releases were created.')
