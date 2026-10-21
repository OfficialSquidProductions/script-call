# Script Call releases

Source: https://github.com/OfficialSquidProductions/script-call — public. Original code and fictional demo fixtures are MIT licensed; third-party licenses and branding notices remain in THIRD_PARTY_NOTICES.md.

Binary assets and signed update metadata: https://github.com/OfficialSquidProductions/script-call-updates. A source push does not ship an update.

## Current status and website coordination

**0.3.4 is notarized and its real signed 0.3.3 → 0.3.4 native upgrade passed.** It adds local bug/crash reporting to alexanderhosier@squidproductions.org with full review, explicit mail draft and copy/export fallback. The public candidate is awaiting stable promotion; no report is sent automatically.

Native acceptance passed all 14 checks, including real download/native replacement/relaunch, the same custom data store without launcher environment, pending edit, Narrative template, exact issued PDF bytes, import IDs/local edits, backup, demo/images and the reporting review flow. PDF SHA-256 before/after: `ff98e07218ccad06355bd2ce928871d54003dd27aabac6fb3e763cf267b12378`. The exact signed/notarized app also passed all eight isolated reporting/crash checks. Unit/update/release checks: 68; existing desktop: 19; G-Casper: 12; packaged importer: 11. Local evidence: `verification/live-update-0.3.3-to-0.3.4/result.json`, `verification/script-call-0.3.4-notarized-reporter.json` and release logs.

- [Stable download](https://github.com/OfficialSquidProductions/script-call-updates/releases/latest/download/Script-Call-Mac.zip)
- [Immutable 0.3.4 ZIP](https://github.com/OfficialSquidProductions/script-call-updates/releases/download/v0.3.4/Script-Call-0.3.4-darwin-arm64.zip)
- [Release notes](https://github.com/OfficialSquidProductions/script-call-updates/releases/tag/v0.3.4)
- [Signed stable feed](https://github.com/OfficialSquidProductions/script-call-updates/releases/latest/download/stable-darwin-arm64.json)

Apple Silicon, macOS 13+. Older update-disabled prototypes need one manual bootstrap. Currently running 0.3.3 users can install through Check for updates after stable promotion; the existing local app and original `.local-data` have not been replaced or opened by release tests. Automatic install-on-quit remains disabled. Version 0.3.2 remains superseded/prerelease after its historical asset-permission bug; never reactivate or overwrite its files.

The website at https://scriptcall.squidproductions.org/ uses the stable download alias. Its release/help text needs the 0.3.4 reporting information; this task does not redesign or edit gh-pages. Its `/updates/` is HTML, so the app retains the signed GitHub JSON feed. Windows/Intel signing and native distribution remain unvalidated.

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

The CLI requires an explicit candidate or promotion operation. Candidate publication uploads to a draft, verifies every asset digest/size, then marks it prerelease with `latest=false`; stable clients keep the previous release. Use existing GitHub authentication only.

```sh
npm run release:publish -- build/releases/VERSION/darwin-arm64 --candidate
CALLSHEET_UPGRADE_FROM=PREVIOUS CALLSHEET_UPGRADE_TO=VERSION CALLSHEET_CANDIDATE_FEED=https://github.com/OfficialSquidProductions/script-call-updates/releases/download/vVERSION/stable-darwin-arm64.json node tests/live-update.cjs
# Review/stage source and secrets, commit and push main after checks pass.
git push origin main
npm run release:publish -- build/releases/VERSION/darwin-arm64 --promote verification/live-update-PREVIOUS-to-VERSION/result.json
# Verify public stable metadata/alias and unmodified old/new native clients, then:
git tag vVERSION
git push origin vVERSION
```

Replace PREVIOUS/VERSION with exact versions. The pre-promotion native test routes only the disposable old process's metadata fetch to the exact public candidate URL; no distributed app config or trust check is changed. The actual public ZIP download and Squirrel native code-signature/install/restart path are exercised. Promotion requires a passed result for this version, matching artifact SHA-512 and native relaunch PID, then verifies the public candidate inventory/digests again before selecting latest. Refuse existing versioned artifacts instead of overwriting them. If a check fails, leave the candidate prerelease and stable unchanged; preserve evidence.

Verify the final public path anonymously: Ed25519 metadata signature, alias byte count/SHA-512 equal to the immutable ZIP, Developer ID/staple/Gatekeeper, and an unmodified previous client discovering the new version through the stable feed. The updates repository's tags refer to minimal release metadata; the corresponding source tag lives in the public MIT source repository. No new CI, subscription or paid hosting is used. Keep `/updates/` HTML out of the native feed. The website should use the stable download alias and update release text only after promotion.

Native acceptance uses signed notarized N and N+1, actual metadata/download/install/relaunch, an isolated persisted custom store, local edits, both templates, Production Desk import IDs, an issued PDF byte hash and a new separate Last Light demo after upgrade. Record signature/ticket/Gatekeeper checks and exact public URLs/hashes. Also test offline, invalid signatures/hashes, wrong OS/architecture/channel and failed save/backup handling.

## Data safety and recovery

Native macOS restart need not retain launcher environment variables. An explicit `CALLSHEET_DATA_DIR` choice is therefore remembered in a user-private installation-local `.script-call-profile-USER.json` beside the app, outside its signed bundle. Native bundle replacement preserves it. If the setting cannot be persisted, installation is blocked; malformed/shared settings refuse silent fallback. No project data is moved. Ordinary installations retain the legacy Call Sheet Prototype profile and `local-projects/` path. The original project launcher retains `.local-data/`.

Updating saves edits and creates a consistent SQLite backup before restart. Automatic install-on-quit is disabled. Failed saves/backups or an active PDF issue block installation. Preserve the previous signed app and backups for manual recovery; do not auto-downgrade or overwrite current databases.

Signed metadata expires after 30 days to limit replay. Publish a new, tested version with fresh metadata when shipping subsequent changes; expired/offline checks fail gracefully and never remove the installed app. Preserve the signing Keychain item and existing Developer ID account. No new hosting subscription or signing credentials are required.
