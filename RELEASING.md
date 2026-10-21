# Script Call releases

Source: https://github.com/OfficialSquidProductions/script-call — public. Original code and fictional demo fixtures are MIT licensed; third-party licenses and branding notices remain in THIRD_PARTY_NOTICES.md.

Binary assets and signed update metadata: https://github.com/OfficialSquidProductions/script-call-updates. A source push does not ship an update.

## Current status and website coordination

**0.3.3 is the current public, signed and notarized Apple Silicon release (macOS 13+).** The actual native 0.3.1 → 0.3.3 test passed: anonymous signed bootstrap, shipped update UI, signed public ZIP download, native bundle replacement/relaunch, Gatekeeper/ticket/signature checks, and reopening the same isolated store without launcher environment variables. The pending edit, Narrative template, Production Desk model/import IDs/local performer, recovery backup and original issued PDF bytes survived. The before/after PDF SHA-256 was `a97df42a8c7ac8d8244a0748100a6908d02c0d359c7fd2aafc106d3d4737e01b`. A fresh included Last Light demo still had 8 scenes, 16 shots and 3 days with stable IDs; branding and preview images decoded with no renderer errors.

The earlier 0.3.1 → 0.3.2 test found a resource-permission bug after native installation changed bundle ownership. Version 0.3.2 remains superseded/prerelease and must not be reactivated. Version 0.3.3 normalizes only shipped public resource modes before signing; the source logo, user data and Keychain material remain unchanged. Release preflight rejects private resource modes. The publisher uploads to a draft and verifies every remote asset digest/size before promoting latest.

Local evidence is in `verification/live-update-0.3.1-to-0.3.3/result.json`, `verification/script-call-public-0.3.3.json` and `verification/script-call-notarized-local-bootstrap.json` (ignored because local paths and fictional issued PDF evidence are not release inputs). Core/update/release safety tests: 56 passed; desktop: 19; G-Casper: 12; source and packaged Production Desk importer: 11 each.

- [Stable download](https://github.com/OfficialSquidProductions/script-call-updates/releases/latest/download/Script-Call-Mac.zip)
- [Immutable 0.3.3 ZIP](https://github.com/OfficialSquidProductions/script-call-updates/releases/download/v0.3.3/Script-Call-0.3.3-darwin-arm64.zip)
- [Release notes](https://github.com/OfficialSquidProductions/script-call-updates/releases/tag/v0.3.3)
- [Signed stable feed](https://github.com/OfficialSquidProductions/script-call-updates/releases/latest/download/stable-darwin-arm64.json)

Older update-disabled prototypes require one manual bootstrap installation. For the existing workspace, save/close the old app and run `Start Script Call.command`; the verified notarized bundle is already staged at `build/mac/Script Call.app` and the launcher retains `.local-data`. General fresh installations extract the ZIP and move Script Call.app to a writable installation location. Once update-enabled, the app checks after startup and daily; users choose download and **Save, back up & restart**. Automatic install-on-quit is disabled.
The website is reported live at https://scriptcall.squidproductions.org/; the website task manages its downloads/help/release pages and gh-pages branch. Its `/updates/` is HTML, so the app intentionally retains the signed GitHub JSON feed. Read [the routing contract](docs/WEBSITE-ROUTING.md); never substitute an HTML landing page for machine metadata.

Windows has no verified signing publisher or native runtime/installer test. Do not distribute a Windows update until those checks pass.

## Local signing key and trust

The approved per-app Ed25519 key is stored in the local encrypted, non-synchronizing login Keychain: service `org.squidproductions.script-call.release-signing`, account `ed25519-v1`. Existing Developer ID/Apple account setup is reused; no new Apple credentials or broad access grants were created. The signed `tools/release-key.swift` helper creates that item once and refuses replacement. It exposes only public-key and signature operations; private key bytes stay in the helper/Keychain. Normal Keychain access controls remain in effect.

The helper is compiled locally as `.runtime/script-call-release-key` and signed with the existing Developer ID and stable identifier `org.squidproductions.scriptcall.releasekey`. Publisher commands use it by default; `SCRIPT_CALL_RELEASE_HELPER` can select the same approved helper at another path. The helper is never bundled into client apps. Only its PEM public key is embedded in `desktop/update-config.json`. An existing explicitly approved key file remains supported via `SCRIPT_CALL_UPDATE_KEY_FILE`; do not create or export a plaintext key file for this Mac workflow. Never upload keys or credentials to GitHub or clients.

The first enabled version must be installed manually to establish the trusted public key. Key rotation must ship through the existing trusted chain, or require a manual trust-reset install. Losing the key requires a manual trust reset unless a separate recovery copy was explicitly approved.

## Build, sign and notarize

Use Node.js 24+ and the locked dependencies. Run `npm ci`, `npm test`, `npm run test:desktop`, `npm run test:gcasper`, `npm run test:import` and the packaged smoke test. `CALLSHEET_PLAYWRIGHT`/`CALLSHEET_ELECTRON` can select already installed test tools. All tests use temporary stores; never use a real production folder as a test profile.

The prepared Apple Silicon workspace uses `npm run build:mac` to stage an ad-hoc local bundle from its verified Electron runtime. A clean configured release environment can use `npm run build:release:mac`. The Mac signing configuration includes only the V8 JIT entitlement needed by Electron. No device/personal-data entitlements or disabled library validation are required.

Create a separate signed archive using the existing identity/team:

```sh
python3 tools/archive_mac.py --app 'build/mac/Script Call.app' --out build/release/Script-Call-VERSION.xcarchive --identity EXISTING_DEVELOPER_ID --team EXISTING_TEAM
xcodebuild -exportArchive -archivePath build/release/Script-Call-VERSION.xcarchive -exportOptionsPlist /existing/nonsecret/developer-id-upload-options.plist -exportPath build/notarization/VERSION
xcodebuild -exportNotarizedApp -archivePath build/release/Script-Call-VERSION.xcarchive -exportPath build/notarized/VERSION
```

Use existing Xcode authentication and manual developer-id options. Upload success alone is not notarization acceptance: confirm the archive's `Submissions/*/notarization-log.json` says Accepted, then verify the exported app with `codesign --verify --deep --strict`, `xcrun stapler validate` and `spctl --assess --type execute`. Stop for user action if new credentials, permissions, terms or costs are required. Do not add automatic provisioning grants to work around an account problem.

## Prepare immutable artifacts

Increase `package.json` and lockfile versions and write release notes. Preserve the app ID, origin, profile, SQLite/archive schema, recovery filename and stable demo/import IDs. Include The Last Light and legacy demo. Do not replace an already published versioned artifact.

```sh
npm run release:prepare -- build/Script-Call-VERSION-darwin-arm64.zip 'build/notarized/VERSION/Script Call.app' arm64 release-notes/VERSION.txt build/releases
```

The command checks the exact Developer ID signed, notarized bundle and architecture, makes its ZIP, hashes it and signs the release envelope with the Keychain helper. Output: `build/releases/VERSION/darwin-arm64/` containing the immutable versioned ZIP, `stable.json`, `stable-darwin-arm64.json`, release notes and `SHA512SUMS`. Metadata authenticates identity, version, stable channel, expiry, architecture, minimum kernel version, artifact URL, byte size and SHA-512. Artifact URLs include `/releases/download/vVERSION/`.

## Publish and verify

Commit/push source, then publish prepared artifacts with existing GitHub authentication. Keep first-time website download activation pending until real native acceptance passes; tag the exact source revision after acceptance. Do not move an existing tag:

```sh
git push origin main
npm run release:publish -- build/releases/VERSION/darwin-arm64
# Run tests/live-update.cjs against signed notarized N and N+1, then:
git tag vVERSION
git push origin vVERSION
```

The publisher verifies the exact approved public updates repository, the manifest signature and artifact hash, refuses existing releases, and uploads only reviewed release files. The updates repository's own tags refer to minimal release metadata; the source tag lives in the public source repository. No CI runner, new subscription or paid hosting is used. The website task owns the download buttons; they should point to the verified stable download URL above. The native app uses the signed GitHub feed directly. Keep versioned files immutable; maintain the stable download alias as a byte-identical copy of the current versioned ZIP.

Native acceptance uses signed notarized N and N+1, actual metadata/download/install/relaunch, an isolated persisted custom store, local edits, both templates, Production Desk import IDs, an issued PDF byte hash and a new separate Last Light demo after upgrade. Record signature/ticket/Gatekeeper checks and exact public URLs/hashes. Also test offline, invalid signatures/hashes, wrong OS/architecture/channel and failed save/backup handling.

## Data safety and recovery

Native macOS restart need not retain launcher environment variables. An explicit `CALLSHEET_DATA_DIR` choice is therefore remembered in a user-private installation-local `.script-call-profile-USER.json` beside the app, outside its signed bundle. Native bundle replacement preserves it. If the setting cannot be persisted, installation is blocked; malformed/shared settings refuse silent fallback. No project data is moved. Ordinary installations retain the legacy Call Sheet Prototype profile and `local-projects/` path. The original project launcher retains `.local-data/`.

Updating saves edits and creates a consistent SQLite backup before restart. Automatic install-on-quit is disabled. Failed saves/backups or an active PDF issue block installation. Preserve the previous signed app and backups for manual recovery; do not auto-downgrade or overwrite current databases.

Signed metadata expires after 30 days to limit replay. Publish a new, tested version with fresh metadata when shipping subsequent changes; expired/offline checks fail gracefully and never remove the installed app. Preserve the signing Keychain item and existing Developer ID account. No new hosting subscription or signing credentials are required.
