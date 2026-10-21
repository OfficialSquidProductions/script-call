# Script Call releases

Source: https://github.com/OfficialSquidProductions/script-call — public. Original code and fictional demo fixtures are MIT licensed; third-party licenses and branding notices remain in THIRD_PARTY_NOTICES.md.

Binary assets and signed update metadata: https://github.com/OfficialSquidProductions/script-call-updates. A source push does not ship an update.

## Current status and website coordination

0.3.1 is an update-enabled bootstrap candidate. Its storage-safe Mac archive was accepted by Apple and exported with a notarization ticket. Full source/desktop/demo/import checks pass. Public binary publication is held while the separate Squarespace task verifies `https://scriptcall.squidproductions.org/` routing. The unshipped candidate currently embeds the supported direct GitHub signed-metadata URL. Read [the website routing contract](docs/WEBSITE-ROUTING.md) before committing a production website feed URL. Do not claim a live end-to-end upgrade until the native two-version test passes.

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

Commit/push source, tag its exact revision, then publish the prepared artifacts with existing GitHub authentication:

```sh
git push origin main
git tag vVERSION
git push origin vVERSION
npm run release:publish -- build/releases/VERSION/darwin-arm64
```

The publisher verifies the exact approved public updates repository, the manifest signature and artifact hash, refuses existing releases, and uploads only reviewed release files. The updates repository's own tags refer to minimal release metadata; the source tag lives in the public source repository. No CI runner, new subscription or paid hosting is used. The website task must verify its HTTPS redirects to the stable signed metadata and download backend before production bootstrap distribution. Keep versioned files immutable; maintain the stable download alias as a byte-identical copy of the current versioned ZIP.

Native acceptance uses signed notarized N and N+1, actual metadata/download/install/relaunch, an isolated persisted custom store, local edits, both templates, Production Desk import IDs, an issued PDF byte hash and a new separate Last Light demo after upgrade. Record signature/ticket/Gatekeeper checks and exact public URLs/hashes. Also test offline, invalid signatures/hashes, wrong OS/architecture/channel and failed save/backup handling.

## Data safety and recovery

Native macOS restart need not retain launcher environment variables. An explicit `CALLSHEET_DATA_DIR` choice is therefore remembered in a user-private installation-local `.script-call-profile-USER.json` beside the app, outside its signed bundle. Native bundle replacement preserves it. If the setting cannot be persisted, installation is blocked; malformed/shared settings refuse silent fallback. No project data is moved. Ordinary installations retain the legacy Call Sheet Prototype profile and `local-projects/` path. The original project launcher retains `.local-data/`.

Updating saves edits and creates a consistent SQLite backup before restart. Automatic install-on-quit is disabled. Failed saves/backups or an active PDF issue block installation. Preserve the previous signed app and backups for manual recovery; do not auto-downgrade or overwrite current databases.
