# Script Call releases

Source: https://github.com/OfficialSquidProductions/script-call — private. A source push updates the repository only. It does not distribute binaries or activate automatic updates.

## Current delivery status

Script Call 0.3.0 builds and runs locally on Apple Silicon. The complete update policy/controller is implemented and tested, including real Electron updater metadata parsing; native installation of a signed live release has not been tested. The local app is ad-hoc signed. The authorized Keychain context exposes the existing Developer ID Application identity for team FZ298DXLS3. The initial sandbox-only probe could not see it. No new Apple signing identity is needed; notarization access for this release still needs to be exercised with the established setup. Windows execution, Windows Authenticode verification and a live two-version upgrade remain untested.

A separate Developer ID signed baseline archive is prepared locally at `build/release/Script-Call-0.3.0.xcarchive`; its code signature was verified. It has not been notarized or uploaded. The ordinary launcher still uses the local ad-hoc build. No publisher key, new credentials, signing certificate, persistent permission or cloud service was created. `desktop/update-config.json` is disabled until the following are approved and available:

- An existing approved **per-app Ed25519 signing key** (or action-specific authorization to provision one). Commit only its PEM public key; keep the private key outside the repo and app. The release tool can read the approved per-app login Keychain item `org.squidproductions.script-call.release-signing` / `ed25519-v1` directly into memory, or an existing approved file via `SCRIPT_CALL_UPDATE_KEY_FILE`. It never generates or stores a key.
- Access to the existing Developer ID / notarization setup for Script Call; Windows needs an approved signing certificate with the exact full subject in `publisherName`.
- A client-accessible HTTPS release endpoint. The private GitHub source repo and its private assets cannot be read anonymously by clients. Choose an approved existing authenticated distribution service with user sign-in, or explicitly approve public release-only distribution. Do not make source or assets public merely to unblock updates. No paid service or new legal terms are authorized.

## Configuration and native build

Set `enabled`, the `stable` channel, `publicKey`, `manifestUrl`, `artifactBaseUrl` and (for Windows) `publisherName` in `desktop/update-config.json`. `manifestUrl` can contain `{platform}` and `{arch}`, for example an approved static endpoint ending in `/stable/{platform}-{arch}.json`. The signed envelope at each URL contains that platform's artifact. `artifactBaseUrl` must be a permanent credential-free HTTPS prefix ending in `/`; only signed URLs under this prefix are accepted. HTTPS-only metadata redirects are bounded. Signed metadata expires after at most 31 days. Refresh its envelope before expiry without changing an immutable versioned artifact; existing running versions refuse downgrades and same-version offers.

The initial enabled release must be installed manually to establish its trusted public key. Existing 0.2.x builds cannot acquire an updater through a source push. A later key rotation must first ship a trusted app carrying the new public key through the existing signed release chain.

Use the existing authorized signing environment; never put tokens/certificates/passwords in `package.json` or the app. Preserve `appId`, profile name, origin and archive formats.

```sh
npm ci
npm test
npm run test:desktop
npm run test:gcasper
npm run test:import
npm run build:release:mac
# On the supported Windows host, with its existing signing setup:
npm run build:win
```

The Mac signing configuration grants only the V8 JIT entitlement required by Electron, without device or personal-data entitlements. `python3 tools/sign_mac.py --app PATH_TO_PREPARED_APP --identity EXISTING_DEVELOPER_ID` can sign a separate prepared bundle with an existing identity. Mac release preparation checks Developer ID signing, Gatekeeper acceptance, stapled notarization, bundle ID and version. Notarize and staple using your established release setup before preparation. The tool creates the ZIP itself from the checked bundle, avoiding an unchecked supplied archive. Name it `Script-Call-VERSION-darwin-ARCH.zip`. Local `build:mac` uses ad-hoc signing and intentionally cannot pass release preparation. Windows preparation requires an Authenticode-valid installer whose signer matches the pinned full subject; the native NSIS updater rechecks the signature during download. Rename its installer to `Script-Call-VERSION-win32-ARCH.exe`.

## Prepare immutable versioned artifacts

Increase `package.json` version and add nonempty `release-notes/VERSION.txt`. Update the lockfile with npm. Run on the matching native OS. Pass a new ZIP output path for Mac, the signed bundle, the target architecture, notes and the output root:

```sh
# macOS: uses the approved per-app login Keychain item by default.
# Other platforms or an existing approved file: set SCRIPT_CALL_UPDATE_KEY_FILE.
npm run release:prepare -- build/Script-Call-0.3.1-darwin-arm64.zip 'build/release/mac-arm64/Script Call.app' arm64 release-notes/0.3.1.txt build/releases
# On Windows, use an existing signed NSIS installer and '-' for the app-bundle argument:
npm run release:prepare -- build/Script-Call-0.3.1-win32-x64.exe - x64 release-notes/0.3.1.txt build/releases
```

Output: `build/releases/VERSION/PLATFORM-ARCH/` with the versioned binary, `stable.json` signed envelope, release notes and `SHA512SUMS`. No unsigned artifact is silently promoted. Existing output directories are refused. The signature authenticates app ID, stable channel, version, dates, notes, architecture, minimum operating-system kernel version, exact artifact URL, byte size and SHA-512. The client exposes only derived verified metadata to the native updater on a random loopback URL. It never feeds an unverified remote YAML file to the native updater.

## Publish and verify

Commit source, push it, and create/push the immutable version tag using existing GitHub authentication:

```sh
git push origin main
git tag v0.3.1
git push origin v0.3.1
npm run release:publish -- build/releases/0.3.1/darwin-arm64
```

The publication command requires an already authenticated `gh` CLI (the prepared workspace also supports `.runtime/gh`, or set `SCRIPT_CALL_GH` to its path), verifies the exact private repository, refuses an existing release, requires the remote tag and uploads only the prepared binary, signed envelope and checksums. It creates a private GitHub Release, not a public distribution endpoint. For multiple architectures, combine reviewed assets under one release with distinct platform envelope names rather than overwrite `stable.json`; the supplied one-platform command deliberately refuses an existing release. Promote the signed platform envelope to the approved endpoint **after** its immutable binary is accessible there. No endpoint promotion runs automatically in this project. That final service-specific step depends on the approved distribution destination.

For client acceptance, install a signed version N with the enabled config into a temporary test profile. Publish signed N+1 to the approved endpoint. Verify check → review notes → download → save/backup/restart → N+1, then reopen the same project and confirm template choice, source/demo IDs and issued PDF hashes. Also test offline, tampered metadata/binary, wrong signer/channel/architecture, declined installation and interrupted download. Keep the old app and backup for recovery. Until this native two-version exercise passes, describe updates as implemented and locally tested, not live end-to-end verified.

## Recovery

Updates replace application code only; project stores remain outside the bundle. `autoInstallOnAppQuit` is false. Closing the update dialog leaves your current app running. Installation calls the renderer's existing save flush before requesting a main-process consistent SQLite backup; failed saves or backups block restart. A running PDF issue blocks installation. If a release regresses, preserve the data folder and use the prior signed app manually; do not auto-downgrade or restore databases over current work. Data migrations must retain backwards compatibility or supply a separately reviewed recovery procedure.

## Proposed smallest activation approval (not yet granted)

Approve one new per-app **Ed25519** key in this Mac's encrypted, non-synchronizing **login Keychain**, service `org.squidproductions.script-call.release-signing`, account `ed25519-v1`. The software key is read into the local signing process's memory only while the Keychain is unlocked; no plaintext key file, client secret, GitHub secret or uploaded key is proposed. Standard Keychain prompts remain in effect; no allow-all access grant. Only its PEM public key is committed and embedded in the Developer ID signed app. Losing the key requires a new manually installed trust bootstrap unless a separately approved recovery copy exists.

Recommended distribution is a new **public** `OfficialSquidProductions/script-call-updates` repository, while `OfficialSquidProductions/script-call` remains private. The proposed repository was not found during authenticated read-only checks; it has not been created. Public assets would be a notarized `Script-Call-VERSION-darwin-arm64.zip`, `stable-darwin-arm64.json`, `SHA512SUMS`, release notes, and minimal README/license notices. Tags in the public repository would reference only that minimal metadata, never the private source history. No Windows binary is proposed until its signing and native tests pass. No archives, debug logs, production records, issued PDFs, private samples or credentials would be uploaded.

The intended feed is `https://github.com/OfficialSquidProductions/script-call-updates/releases/latest/download/stable-{platform}-{arch}.json`. Artifacts live at `https://github.com/OfficialSquidProductions/script-call-updates/releases/download/vVERSION/Script-Call-VERSION-darwin-arm64.zip`. Everyone on the internet could download, inspect and copy the Electron app, including its shipped JavaScript/resources and fictional demos. Keeping Git history private does not make distributed Electron contents secret.

The first enabled release should be **0.3.1**, installed manually once to establish the public-key trust anchor; preserve the existing 0.3.0 source tag. A subsequent signed release must pass the actual two-version upgrade check before describing the updater as live verified. Existing Apple signing/notarization accounts are reused; Script Call code is uploaded to Apple for notarization, never private keys. Existing Xcode account metadata, Developer ID availability, prior accepted notarizations and matching developer-id upload/export options were verified without reading credential values. A current Apple server login has not been tested and no Script Call upload was attempted.

No additional paid hosting, CI runner, subscription or new credential is proposed: builds/signing run locally and distribution uses GitHub Releases with the existing Apple membership. GitHub's [free plan](https://github.com/pricing) supports public repositories; [release asset limits](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) allow files under 2 GiB and no total release/bandwidth limit. Stop for approval if a new charge, agreement, credential, access grant or visibility change is required.
