# Native Windows preview validation

This work starts at `d88702d9cac81e1dd4d44045b45f1a545f04c921` and retains
Script Call 0.3.16's shared editors, data format and stored issued PDFs.
It is a Windows x64 **preview**, not a stable Windows support claim.

## Build and isolation

On native Windows with the locked project dependencies:

```text
npm ci
npm test
npm run build:win -- build/windows-local-01
npm run build:win -- build/windows-portable-01 --portable
```

The first command builds the original fixed-location development preview.
The portable variant is named **Script Call Windows Preview**, has a separate
application ID and version `0.3.16-windows.preview.1`, and stores all data in
`Script Call Preview Data` beside its executable. Extract into a writable folder.
Move the entire closed folder to preserve its data. No installation marker is
written outside the portable folder. No default application/file associations
are registered. Update downloading and installation remain disabled; native
signature verification has not been weakened.

## Native acceptance harness

Set `CALLSHEET_WINDOWS_APP` to the absolute `win-unpacked` directory of a build.
`tests/support/windows-app.cjs` verifies its source manifest, copies it into a
fresh directory under this checkout's `tmp`, and changes only the test copy's
embedded profile configuration. It never selects an installed application.
Mac signing verification remains active in the Mac branches of existing tests.
Windows native popup tests send key-down/up events to the focused Electron
window and assert the actual selected value. Windows screenshot tests use visible
windows because hidden native windows did not reliably produce captures.

```text
node tools/test_windows_desktop.cjs desktop.cjs availability-desktop.cjs next-day-desktop.cjs crew-departments-desktop.cjs locations-on-call-desktop.cjs production-deletion-desktop.cjs shooting-days-desktop.cjs record-recovery-desktop.cjs scenes-desktop.cjs productiondesk-desktop.cjs production-enhancements-desktop.cjs contact-logistics-desktop.cjs personal-start-scroll-desktop.cjs schedule-calls-maps-desktop.cjs gcasper.cjs print.cjs windows-portable-desktop.cjs
```

Results and logs are written to `verification/windows/`. Results identify the
actual build used by each suite. File-picker overrides in automated tests are
not evidence of operating the native picker: native picker checks are recorded
separately. All productions, images, contacts and imports are synthetic fixtures.

The dense print test now exports all four layouts on A4 and Letter with 200 crew.
`tools/verify_windows_pdfs.py` uses development-only `pypdf` to verify page sizes,
all numbered crew rows and absence of footer-only pages. Visual review exposed a
Letter-layout stamp orphan; `break-before: avoid` and `break-inside: avoid` keep
the final stamp with preceding content. Previously issued PDFs remain stored
bytes and are not regenerated.

Unit-test cleanup closes SQLite handles before removing temporary directories.
POSIX unlinking had hidden the ordering problem on Mac; Windows rejects deleting
an open database. Assertions are retained, not skipped.

## Limits and stable-release gates

- Windows x64 was tested; Windows arm64 is not verified.
- This artifact is an unsigned portable preview, not an NSIS installer. Installer,
  uninstall/reinstall, file association registration and genuine signed updater
  replacement remain outstanding. Do not claim those acceptance gates passed.
- The publisher identity is unconfigured and stable automatic updates remain
  disabled. No credential setup or signing-service purchase is part of this work.
- Synthetic archive/Production Desk fixtures and reader-10 round trips verify the
  shared data contract on Windows. This run does not claim a new live Mac round trip.
- Native accessibility labels and keyboard flows were exercised. A full screen
  reader and operating-system DPI 100/150/200 percent matrix remains outstanding.
- Weather consent, normalization and error behavior use deterministic fixtures;
  no claim is made that a live NWS request succeeded in this run.
- Two initial test-runner processes exited before producing output; Windows
  application/Code Integrity logs yielded no matching event. Successful reruns
  are recorded separately; this is not evidence that every original attempt passed.
- Existing Mac releases, stable feeds and user profiles are not changed. Publish
  only as a clearly labeled prerelease with `latest=false`, preserving Mac assets.
  The established signed stable publisher is not suitable for an unsigned preview.

If Windows blocks execution, stop and report the actual message. Do not disable
Smart App Control/Defender, remove protections or bypass security prompts.
## Recorded acceptance on 2026-10-26

Windows x64: 198 unit tests passed, 3 skipped, 0 failed. The desktop matrix
finished with 17 successful suites and 172 named checks, plus eight dense PDF
exports. Most suites used portable preview 02; after the stamp-only pagination
fix, print, availability, portable relocation and production planning were
rerun on preview 03. Eight PDF content checks passed. Native Open imported the
synthetic planning archive as a separate production; native Save As exported an
issued PDF to a Unicode filename with SHA-256 identical to its original stored
PDF. Earlier native editing, Ctrl+S and project Save As also passed.

The final distributable is portable preview 03, version
`0.3.16-windows.preview.1`. Counts above describe Windows execution only.
