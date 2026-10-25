# Script Call releases

Source: https://github.com/OfficialSquidProductions/script-call — public. Original code and test-only fictional fixtures are MIT licensed; third-party licenses and branding notices remain in THIRD_PARTY_NOTICES.md.

Binary assets and signed update metadata: https://github.com/OfficialSquidProductions/script-call-updates. A source push does not ship an update.

## 0.3.9 release validation

0.3.9 adds native editable crew Department suggestions with the exact 17 requested presets. Existing/custom department strings, IDs and crew grouping are not normalized. Keyboard filtering/selection, mouse selection, Escape and normal focus remain native behavior. Cast fields stay unchanged.

The Mac department test uses `tests/support/native-popup-keyboard.cjs` for popup navigation. In the recorded 0.3.9 probe, CDP fill/typing delivered trusted ArrowDown/Enter DOM events to a focused, visible field but left `cam`; Electron `webContents.sendInputEvent` key-down/up selected `CAMERA`, matching native CUA input. This corrects test input routing for the native popup. It never assigns a DOM input value, and the original CAMERA/focus/save/PDF assertions remain required. Native popup QA needs a visible, focused isolated window. No shipping code changed for this correction. Evidence: `verification/0.3.9-input-probe.json` and the corrected department suite log.

Native acceptance authenticates the public ZIP, extracts it unchanged, then makes an ordinary user-owned disposable installation with `tests/support/native-upgrade-fixture.cjs`. Every file and symlink is compared to the extracted public app and signature/staple/Gatekeeper checks are repeated. The archived fixture used in the first 0.3.9 attempt restored OS-local app-management metadata and reported nonwritable despite owner write modes; a byte-identical ordinary copy passed all security checks and reported writable. No file modes, attributes or security settings are changed. Privileged/helper paths remain separate from this user-owned fixture. Optional `CALLSHEET_UPGRADE_DIAGNOSTICS=1` records passive native events and app lifecycle; it does not replace the updater or weaken native replacement assertions.

Release gates use disposable profiles/copies of the exact signed app: all unit and desktop regressions including department inputs, PDF/portable preservation, plus a real 0.3.8 → 0.3.9 native upgrade that preserves legacy custom department values and exercises the new combo box. Keep the candidate prerelease until acceptance passes. Windows, Intel Mac and Linux distributions remain unvalidated.

## 0.3.8 release validation

0.3.8 makes Add Day propose the date after the final active production-order record, independent of sidebar sorting and selection. Manual date entry and Duplicate Day remain supported. Calendar arithmetic is UTC date based; first-day/unusable-date fallback retains today. Existing records are not changed.

The exact notarized build passed **101 unit checks** (two optional private-provenance checks skipped), **88 Mac UI checks**, and packaged smoke. The real **0.3.7 → 0.3.8 native upgrade passed all 19 checks** using the public candidate ZIP and actual replacement/relaunch in a disposable installation. It preserved pending edits, templates, exact PDFs, import/person/day IDs, availability, backups and preferences; preexisting production recovery records remained restorable. The upgraded app verified new date defaults, cancellation, repeated additions and reopening without changing original day records or PDF bytes. No renderer errors occurred. Original/restored PDF SHA-256: `efa0686a33bf3a8a1c7e675ab8c96619248763eb92fe19c85f95584fb181b0da`.

Apple accepted job `36554c52-ad5a-4476-8654-eaaed47e78cd`. Signature, staple and Gatekeeper passed. The immutable ZIP is 131,309,530 bytes, SHA-256 `01255aa3aeb9257b8fac9985d99067b7cce9d808f9ff031e5fa9bf1040127ad3`. The existing Ed25519 key authenticates SHA-512. Metadata expires 2026-11-24T00:46:54.291Z. Evidence: `verification/0.3.8-release-checkpoint.json`, exact-build regression logs and `verification/live-update-0.3.7-to-0.3.8/result.json`. Windows, Intel Mac and Linux distributions remain unvalidated. Tests never replace the installed user app or touch real projects; no domains, credentials or historical releases change.

## 0.3.7 release validation

0.3.7 adds Settings & Help → Delete Production with a named, scoped confirmation and a recoverable Deleted productions → Restore workflow. SQLite tombstones retain the complete original production and issued revision/PDF bytes; unrelated productions, app settings and external files remain unchanged. Backup precedes delete/restore; deleting the last active production creates one blank. Stale versions, repeated clicks and an active PDF issue fail safely. This additive change keeps older project files and availability/import identities compatible.

Release gates use disposable profiles and separate bundle copies only. The feature unit suite covers atomic rollback, legacy databases, exact issued PDFs/portable archives, import matching and retained recovery records; the Mac UI suite covers cancel, confirmation scope, repeated clicks, stale selection/version, backup failure, active PDF issue, restart and last-production restore. The native 0.3.6 → 0.3.7 acceptance test additionally checks deletion/recovery of an upgraded production with exact project/PDF contents and an unrelated imported production intact. Publish only after all exact-build and native-upgrade gates pass.

The exact notarized build passed **96 unit checks** (two optional private-provenance checks skipped), **81 Mac UI checks** (19 general, 12 G-Casper, 12 importer, 8 reporting/crash, 11 shooting-day, 11 availability, 8 production-deletion) and packaged smoke. The real **0.3.6 → 0.3.7 native upgrade passed all 17 checks**, using the public candidate ZIP and actual Squirrel replacement/relaunch in a disposable installation. Pending edits, import/local person IDs, availability, templates, exact issued PDF bytes, backup contents and update/warning preferences survived. The upgraded app then confirmed/canceled/deleted/restored the upgraded production across restart, preserving unrelated import data and original PDF bytes. No renderer errors occurred. Original/restored PDF SHA-256: `a45e073c3ccf0f63e361abef0b1ae2d1f1db90074c68d6b2dbd5227b7b63dea1`.

Apple accepted job `e8918c18-2956-49c6-b149-92b8ba1458c3`; signature, staple and Gatekeeper passed. The immutable ZIP is 131,309,334 bytes, SHA-256 `0b178461a24ea6c95f232f9d575e6967d12b61ed2580994cbe5a4dbf53445058`. The existing Ed25519 key authenticates its SHA-512. Metadata expires 2026-11-24T00:14:47.662Z. Local evidence: `verification/0.3.7-release-checkpoint.json`, exact-build regression logs and `verification/live-update-0.3.6-to-0.3.7/result.json`.

Apple Silicon/macOS 13+ is the supported validated target; Windows, Intel Mac and Linux distributions remain unvalidated. Preserve the installed user app and real projects, old releases, support email, domains and credentials. No App Store submission is part of this release.

## 0.3.6 release validation

0.3.6 combines cast/crew availability with removal of bundled Last Light and legacy Quiet Hours demo loaders/resources. Fresh profiles and new productions are blank. Existing saved/imported projects, stable source/person/day IDs, availability, templates, issued PDFs and portable archives remain supported. Synthetic fixtures live under `tests/fixtures/` only.

The exact signed/notarized app passed 89 unit/update/release checks (two optional private-provenance checks skipped), 19 general desktop, 12 G-Casper, 12 importer, 8 reporting/crash, 11 shooting-day and 11 availability checks, plus packaged smoke. The real **0.3.5 → 0.3.6 native upgrade passed all 16 checks**, including actual public download/native replacement/relaunch, the same custom profile without launcher environment, pending save, exact issued PDF bytes, import IDs/model/local edits, manually recorded availability, recovery backup contents, update preferences, warning suppression/reset across restart and blank new productions. No renderer errors occurred. Original/after PDF SHA-256: `a1c1580998c7bfd02d06bc924c06fd5ba24904da69245d888697a0481c196f26`.

Apple accepted job `4a5bce70-3ce7-4a65-94fb-2c7cd9ed79db`. Signature, staple and Gatekeeper checks passed. The ZIP is 131,307,874 bytes, SHA-256 `d708080ac132707cd161ab480a732f50223a5293b8dfd1d695309fcaaf6230d8`; its SHA-512 is authenticated by the existing Ed25519 update key. Metadata expires 2026-11-23T22:21:38.131Z. Evidence: `verification/0.3.6-release-checkpoint.json`, exact-build regression logs and `verification/live-update-0.3.5-to-0.3.6/result.json`. Promotion still requires matching native acceptance evidence and public asset verification.

Apple Silicon/macOS 13+ is validated. Windows, Intel Mac and Linux distributions remain unvalidated. The installed user app, real projects, domain/DNS settings and old releases remain unchanged. No new credentials were created.

## Previous 0.3.5 status and website coordination

**0.3.5 was the previous public stable Developer ID signed and Apple-notarized release.** It adds stable-ID shooting-date editing, recoverable deletion, confirmation suppression and Reset Warnings, and the seven-record sidebar with a scrollable calendar-week overview. G-Casper, Original Narrative, both demos, Production Desk import/reimport, local reviewed reporting and the existing update trust key remain included.

The exact notarized app passed 73 unit/update/release checks, 19 general desktop checks, 12 G-Casper checks, 12 packaged import/reimport checks, 8 reporter/crash checks, 11 shooting-day checks and packaged smoke QA. The real signed **0.3.4 → 0.3.5 native upgrade passed all 15 checks**, including actual bundle replacement/relaunch, the same profile without launcher environment, pending save, original issued PDF bytes, import IDs/model/local edits, the contents of the recovery backup, update preferences, and warning suppression/reset across restart. PDF SHA-256 before/after: `05e57b7926443c7f98a088902ff260bc686e75f693bfaa7bd0ca9ca26729c946`.

Anonymous public verification passed: the stable alias ZIP matches the immutable artifact at **131,315,002 bytes**, SHA-256 `3e4c8b888174ba051032a36fa6e52163b0027b8eed37318b227787352e82a04f`; its SHA-512 matches the Ed25519-signed feed. Unmodified signed 0.3.4 offers 0.3.5 through the production feed; unmodified 0.3.5 reports current. Local evidence: `verification/live-update-0.3.4-to-0.3.5/result.json`, `verification/0.3.5-notarization.json`, `verification/script-call-public-0.3.5.json` and the exact-build regression logs. Apple accepted job `29e15617-40d9-43e2-8685-667779cd21a2`. Signed metadata expires 2026-11-21T23:39:49.696Z.

- [Stable download](https://github.com/OfficialSquidProductions/script-call-updates/releases/latest/download/Script-Call-Mac.zip)
- [Immutable 0.3.5 ZIP](https://github.com/OfficialSquidProductions/script-call-updates/releases/download/v0.3.5/Script-Call-0.3.5-darwin-arm64.zip)
- [0.3.5 release notes](https://github.com/OfficialSquidProductions/script-call-updates/releases/tag/v0.3.5)
- [Signed stable feed](https://github.com/OfficialSquidProductions/script-call-updates/releases/latest/download/stable-darwin-arm64.json)

The existing website uses the stable download alias; its `/updates/` stays HTML and is not the native feed. Bug/crash reports remain addressed to **alexanderhosier@squidproductions.org**, reviewed before sharing. Release tests used disposable profiles and installations; the installed user app and real projects were not replaced or opened. Apple Silicon/macOS 13+ is validated. Windows/Intel native distribution remains unvalidated. No new credentials, signing keys, domain or DNS settings are needed.

## Previous 0.3.4 release verification

**0.3.4 was the previous public stable notarized release; its real signed 0.3.3 → 0.3.4 native upgrade passed.** It adds local bug/crash reporting to alexanderhosier@squidproductions.org with full review, explicit mail draft and copy/export fallback. The tested candidate has been promoted after remote asset verification; no report is sent automatically.

Native acceptance passed all 14 checks, including real download/native replacement/relaunch, the same custom data store without launcher environment, pending edit, Narrative template, exact issued PDF bytes, import IDs/local edits, backup, demo/images and the reporting review flow. PDF SHA-256 before/after: `ff98e07218ccad06355bd2ce928871d54003dd27aabac6fb3e763cf267b12378`. The exact signed/notarized app also passed all eight isolated reporting/crash checks. Unit/update/release checks: 68; existing desktop: 19; G-Casper: 12; packaged importer: 11. Local evidence: `verification/live-update-0.3.3-to-0.3.4/result.json`, `verification/script-call-0.3.4-notarized-reporter.json` and release logs.

Final public verification passed: an anonymous stable alias ZIP matched the signed immutable artifact (131,308,390 bytes; SHA-256 `88103ffeec717dd6d05ad12f7221e2857ada9de4f570fdbbc5d709ce3d02942b`). Fresh unmodified signed 0.3.3/0.3.4 clients checked the production feed with no test metadata override: 0.3.3 offered 0.3.4, and 0.3.4 reported current. Evidence: `verification/script-call-public-0.3.4.json`.

- [Stable download](https://github.com/OfficialSquidProductions/script-call-updates/releases/latest/download/Script-Call-Mac.zip)
- [Immutable 0.3.4 ZIP](https://github.com/OfficialSquidProductions/script-call-updates/releases/download/v0.3.4/Script-Call-0.3.4-darwin-arm64.zip)
- [Release notes](https://github.com/OfficialSquidProductions/script-call-updates/releases/tag/v0.3.4)
- [Signed stable feed](https://github.com/OfficialSquidProductions/script-call-updates/releases/latest/download/stable-darwin-arm64.json)

Apple Silicon, macOS 13+. Older update-disabled prototypes need one manual bootstrap. Currently running 0.3.3 users can install through Check for updates; the existing local app and original `.local-data` have not been replaced or opened by release tests. Automatic install-on-quit remains disabled. Version 0.3.2 remains superseded/prerelease after its historical asset-permission bug; never reactivate or overwrite its files.

The website at https://scriptcall.squidproductions.org/ uses the stable download alias. The website now retains its 0.3.4 reporting guidance and visible support address; release/download text updates use the existing gh-pages workflow. Its `/updates/` is HTML, so the app retains the signed GitHub JSON feed. Windows/Intel signing and native distribution remain unvalidated.

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

Increase `package.json` and lockfile versions and write release notes. Preserve the app ID, origin, profile, SQLite/archive schema, recovery filename and stable demo/import IDs. Exclude test-only fixtures and demo scripts from shipping resources; preserve previously saved/imported project records. Do not replace an already published versioned artifact.

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

Native acceptance uses signed notarized N and N+1, actual metadata/download/install/relaunch, an isolated persisted custom store, local edits, both templates, Production Desk import IDs, an issued PDF byte hash, stable saved fixture records, availability, and blank new production after upgrade. Record signature/ticket/Gatekeeper checks and exact public URLs/hashes. Also test offline, invalid signatures/hashes, wrong OS/architecture/channel and failed save/backup handling.

## Data safety and recovery

Native macOS restart need not retain launcher environment variables. An explicit `CALLSHEET_DATA_DIR` choice is therefore remembered in a user-private installation-local `.script-call-profile-USER.json` beside the app, outside its signed bundle. Native bundle replacement preserves it. If the setting cannot be persisted, installation is blocked; malformed/shared settings refuse silent fallback. No project data is moved. Ordinary installations retain the legacy Call Sheet Prototype profile and `local-projects/` path. The original project launcher retains `.local-data/`.

Updating saves edits and creates a consistent SQLite backup before restart. Automatic install-on-quit is disabled. Failed saves/backups or an active PDF issue block installation. Preserve the previous signed app and backups for manual recovery; do not auto-downgrade or overwrite current databases.

Signed metadata expires after 30 days to limit replay. Publish a new, tested version with fresh metadata when shipping subsequent changes; expired/offline checks fail gracefully and never remove the installed app. Preserve the signing Keychain item and existing Developer ID account. No new hosting subscription or signing credentials are required.
