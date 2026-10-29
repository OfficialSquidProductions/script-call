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

## Production-key acceptance on 2026-10-29

Both Mac-signed envelopes for source `b5a6e6a` verified against the existing pinned
key, with exact candidate contents and all 402 payload files. Native predownloaded
.1 to .2 upgrade preserved a synthetic production and acknowledged startup.
Journal recovery and deliberate termination of the isolated .2 child before
acknowledgement restored .1 and its original data, retaining failed trial data.

Real HTTPS acceptance then found that GitHub release assets redirect to
`release-assets.githubusercontent.com` with signed query parameters. The previous
transport applied the stricter manifest-URL rule to these redirects and rejected
the download. The corrected transport permits those queries only on that exact
HTTPS CDN origin when the initial URL is github.com. Other redirects must remain
on the initial origin without queries. Credentials, fragments, non-default ports,
HTTP and lookalike hosts remain rejected; signatures, hashes, size limits and the
query-free signed artifact URL policy are unchanged. Three focused regression
tests cover this distinction and bounded redirect chains.

The corrected payloads require new existing-key signatures and a new manual
bootstrap. Do not advertise the old signed .1/.2 payloads as functional automatic
updaters. The website download and Mac stable feed have not changed in this run.

## Completed production publication, 2026-10-29

The signing and publication gates described above are now complete for the
corrected x64 portable preview. Payload source is
`d9de1e11345de3e2dc37cec5f01441f61c06d056`; the manual bootstrap starts on
`0.3.17-windows.preview.3` and updates to `.4`. Existing-key signatures and both
402-file payloads were verified on Windows. The clean bootstrap contains 499
files, with no fixture shim or user production data.

Native acceptance passed for production-key upgrade, startup acknowledgement,
project identity/content preservation, copied-profile recovery after interrupted
startup, retention of failed trial data, and standalone root-launcher startup and
clean exit. Genuine unauthenticated HTTPS tests passed through both the GitHub
release manifest and the final website feed: check, download/hash validation,
explicit install, backup, relaunch, Internet-zone preservation and up-to-date
status. Recovery also passed using the exact publicly downloaded payload.

The full Windows unit suite passed 212 tests with 3 existing skips. Public website
home/download pages passed desktop (1440px) and mobile (390px) link/overflow checks.
The public bootstrap was re-downloaded without authentication and matched all
318,226,624 bytes and SHA-256
`49994bfa9aae4c47b57d653eb1daa1942eeb69d97dce5765fb6a0faf92d6ca79`.

- [Bootstrap and release notes](https://github.com/OfficialSquidProductions/script-call-updates/releases/tag/v0.3.17-windows.preview.3)
- [Update payload](https://github.com/OfficialSquidProductions/script-call-updates/releases/tag/v0.3.17-windows.preview.4)
- [Signed Windows preview feed](https://scriptcall.squidproductions.org/updates/windows-portable-preview-x64.json)
- Website commit: `7a5b46db78bfde1e424abbfc1f037835185196ff`.

Both releases are prereleases and did not replace GitHub Latest. Mac latest
release ID and every asset digest were verified unchanged. No Mac feed, installed
application or user project was modified. The earlier `.2` transport-failing
acceptance release was restored to draft. The corrected `.4` was temporarily
published for live acceptance only after explicit owner approval, and retained
public after success. Approval review initially blocked that publication; no
bypass was used.

Limits remain: unsigned executable, x64 portable only; no installer/file
association acceptance, ARM64 validation, complete screen-reader/DPI matrix,
new live Mac round trip, or irreversible migration rollback guarantee. This is
not a declaration of full stable Windows parity. A manual bootstrap download and
explicit import are required for users of the older update-disabled preview.
