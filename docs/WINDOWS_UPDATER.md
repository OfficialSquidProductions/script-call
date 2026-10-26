# Windows portable updater

The published `0.3.16-windows.preview.1` ZIP is manual-download only. It cannot
bootstrap this updater through a feed: its update-install IPC is disabled. A new
manual bootstrap download is required. Existing projects are imported explicitly;
the bootstrap never adopts, overwrites or deletes an old preview folder.

## Separate trust and installation paths

The existing Mac updater and NSIS Authenticode checks remain unchanged. A paid
Windows signing identity is not a prerequisite for cryptographic update
authenticity in this separate portable path. It uses the SAME pinned Ed25519 public
key as Script Call, signed payload metadata, signed size/SHA-512 and a signed map
of every extracted file's size/SHA-256. No replacement production key is created.
Windows may still block an unsigned executable: stop and report that outcome.
No security setting, security prompt or download-origin metadata is bypassed.

The channel is `windows-portable-preview`, app identity
`org.squidproductions.scriptcall.windows-preview`, with strictly ordered versions
such as `0.3.17-windows.preview.1`. Stable NSIS/Mac manifests cannot be consumed by
this path. The manifest binds platform, CPU, minimum OS, bootstrap protocol,
data epoch, expiry, notes, artifact URL and complete file layout. Network responses
are bounded; redirects must stay HTTPS. ZIP links, traversal, alternate streams,
device names, duplicate case-insensitive paths and expansion beyond signed sizes
are rejected. Downloaded extracted files receive Internet-zone metadata on Windows.

## Transaction and data preservation

The root launcher/runtime stays fixed. `versions/<generation>/` holds verified
payloads; `data/<generation>/` holds application profiles. `.portable-update/`
contains the atomic active pointer, signed metadata, journal and startup receipts.
The bootstrap verifies installed file hashes before every launch, even when a
historical installed manifest has expired. Expiry is enforced for new downloads
and installation; expired metadata does not brick an already accepted version.

Download does not install. The editor exposes Download and Save/back up/restart.
The launcher waits for the old app to exit, copies its closed profile into a new
data generation, writes the transaction journal, then atomically replaces the
active pointer. The new app opens only the copied profile and acknowledges after
the renderer has loaded its production. The editor is shown after acceptance.

If trial startup fails, recovery restores the previous executable AND untouched
previous profile. Failed trial data is retained separately. Recovery refuses to
switch while the trial PID is still alive. After acceptance, later user edits
are never silently reverted. Automatic rollback is NOT a promise to undo arbitrary
irreversible data migrations: unsupported data epochs/bootstrap protocols require
a manual migration/bootstrap. Old generations are retained; automatic cleanup and
storage quotas are not implemented. Users need space for an archive, new payload
and copied profile. Interruption tests simulate commit boundaries, not physical
power-loss durability across every filesystem/hardware combination.

## Build, candidate and existing-key signing

Build on Windows with locked dependencies in a dedicated checkout:

```text
node -e "require('./tools/package_windows.cjs').build({out:'build/managed-portable-new',managed:true,version:'0.3.17-windows.preview.1'})"
node tools/portable_release.cjs build/managed-portable-new/win-unpacked build/portable-candidate-new release-notes.txt
```

The second command creates an unsigned metadata candidate and payload ZIP. It does
not sign or publish. The payload ZIP is NOT a user-facing bootstrap download.
Transfer those exact files and immutable source commit to the existing signing Mac.
The owner-coordinated command validates the package, uses the existing Keychain
helper and verifies the returned signature against the pinned public key:

```text
node tools/sign_portable_release.cjs portable-candidate.json Script-Call-VERSION-win32-x64-payload.zip signed-portable.json
```

No key export is needed. Assemble the new bootstrap with `bootstrap()` exported
from `tools/portable_release.cjs`, supplying the signed envelope and the existing
public-key/artifact-base configuration plus a dedicated preview manifest URL.
The launcher contains only the public key. A null manifest URL keeps checks
disabled until the production signing/publication handoff is ready.

Do not publish a placeholder feed. Verify the signed production payload and
bootstrap, publish only the separate preview artifacts, verify public downloaded
hashes, then publish the signed preview manifest. Preserve Mac stable/Latest and
all existing feeds. A genuine production-key/public-feed upgrade remains a release
gate; injected fixture responses do not satisfy it.

## Validation

`tests/portable-updates.test.cjs` covers malformed/signature/hash failures,
platform/channel/downgrade/expiry/size rules, ZIP traversal and links, interrupted
journal/pointer commits, copied data recovery, a live-child recovery guard and an
actual Windows file lock on the pointer. `tests/portable-native-desktop.cjs` uses
real packaged applications and update IPC with signed fixture responses to test
download, consent, backup, process exit/relaunch, acknowledgement and project IDs.
`tests/portable-native-recovery.cjs` tests a deliberately crashing candidate which
modifies only its copied profile before exit, then verifies native rollback.

Fixture signing keys are ephemeral and never used for production. Fixture builds
contain a clearly named test-only fetch shim and must NEVER be published. Test
results are written under `verification/windows/`; native payloads/profiles are
under `tmp/`. The current public preview remains unchanged by this development.

Recorded Windows x64 acceptance on 2026-10-26: 209 unit tests passed, 3 skipped;
19 existing desktop checks passed on managed-portable-02; 4 native upgrade checks
and 2 native failure/recovery checks passed. The standalone bootstrap visibly
opened the preserved synthetic production and closed cleanly. The final build's
57 source hashes matched the checkout; its 402-file clean payload contains no
fixture fetch shim. Production-key signing and live public feed acceptance remain
pending. No production feed or replacement website download was published.
