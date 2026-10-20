#!/usr/bin/env python3
"""Create a local Apple Silicon Script Call bundle, never a published release."""
from pathlib import Path
import shutil,subprocess,plistlib,json,hashlib,datetime
root=Path(__file__).resolve().parents[1]
version=json.loads((root/'package.json').read_text())['version']
source=root/'.runtime/electron/Electron.app'
if not source.exists():raise SystemExit('Electron 44.9.1 runtime is missing. See PROTOTYPE.md.')
out=root/'build/mac/Script Call.app';out.parent.mkdir(parents=True,exist_ok=True)
stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
staging=out.with_name('Script Call-staging-'+stamp+'.app')
shutil.copytree(source,staging,symlinks=True)
resources=staging/'Contents/Resources';app=resources/'app';app.mkdir()
for name in ['desktop','core','web']:shutil.copytree(root/name,app/name)
(app/'fixtures').mkdir()
for name in ['last-light.json','scenic-quiet.json','The Last Light.fountain']:shutil.copy2(root/'fixtures'/name,app/'fixtures'/name)
shutil.copy2(root/'package.json',app/'package.json')
lock=json.loads((root/'package-lock.json').read_text())
production=set()
for name,entry in lock['packages'].items():
 if name.startswith('node_modules/') and not entry.get('dev'):
  parts=name.split('/');production.add('/'.join(parts[:3] if parts[1].startswith('@') else parts[:2]))
for name in sorted(production):shutil.copytree(root/name,app/name)
for name in ['LICENSE','LICENSES.chromium.html']:shutil.copy2(root/'.runtime/electron'/name,resources/('Electron-'+name))
shutil.copy2(root/'THIRD_PARTY_NOTICES.md',resources/'THIRD_PARTY_NOTICES.md')
shutil.copy2(root/'LICENSE',resources/'Script-Call-MIT-LICENSE.txt')
shutil.copytree(root/'licenses',resources/'licenses')
icons=root/'tmp/CallSheet.iconset';icons.mkdir(parents=True,exist_ok=True)
for n in [16,32,128,256,512]:
 for factor in [1,2]:
  name=f'icon_{n}x{n}'+('@2x' if factor==2 else '')+'.png'
  subprocess.run(['sips','-z',str(n*factor),str(n*factor),str(root/'web/assets/SP_PURPLE.png'),'--out',str(icons/name)],check=True,stdout=subprocess.DEVNULL)
subprocess.run(['iconutil','-c','icns',str(icons),'-o',str(resources/'CallSheet.icns')],check=True)
plist=staging/'Contents/Info.plist';info=plistlib.loads(plist.read_bytes())
(staging/'Contents/MacOS/Electron').rename(staging/'Contents/MacOS/Script Call')
info.update({'CFBundleExecutable':'Script Call','CFBundleName':'Script Call','CFBundleDisplayName':'Script Call','CFBundleIdentifier':'org.squidproductions.callsheet.prototype','CFBundleShortVersionString':version,'CFBundleVersion':version,'CFBundleIconFile':'CallSheet.icns','NSHumanReadableCopyright':'Squid Productions - local prototype; not a signed public release.'})
plist.write_bytes(plistlib.dumps(info))
subprocess.run(['codesign','--force','--deep','--sign','-',str(staging)],check=True,capture_output=True)
verify=subprocess.run(['codesign','--verify','--deep','--strict',str(staging)],capture_output=True,text=True)
if verify.returncode:raise SystemExit(verify.stderr)
# The launch target only changes after the new bundle has been signed and verified.
if out.exists():out.rename(out.with_name('Script Call-previous-'+stamp+'.app'))
staging.rename(out)
manifest={'app':str(out),'architecture':'darwin-arm64','electron':'44.9.1','version':version,'signing':'Local ad-hoc signature only. No Developer ID identity, notarization, credentials or release feed.','codesignVerification':'passed','sourceHashes':{str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for folder in ['desktop','core','web','fixtures'] for p in (root/folder).rglob('*') if p.is_file()}}
(root/'verification/mac-build.json').write_text(json.dumps(manifest,indent=2))
print(out)
