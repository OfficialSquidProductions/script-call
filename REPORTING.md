# Script Call bug and crash reporting — 0.3.4

Recipient: **alexanderhosier@squidproductions.org**. Stable 0.3.4 is signed/notarized and passed real signed 0.3.3 → 0.3.4 native acceptance. The anonymous stable ZIP/feed and unmodified old/new native clients were also verified after publication.

## Use the app or isolated local preview

Installed 0.3.3 users can choose Check for updates, Download update, then Save, back up & restart now. The current running app is left intact until the user chooses installation.

For separate local testing, double-click `Start Script Call Preview.command`. It launches `build/reporter-preview/Script Call.app` with its own `.reporter-preview-data` store. The normal `Start Script Call.command`, running released app, original `.local-data`, projects, template choices and issued PDFs are preserved. The preview includes The Last Light and legacy demo; loading a demo creates a separate production. This is a local ad-hoc signed build, not a notarized release. Do not replace a normal installation with it for update validation.

Build again with `npm run build:reporter-preview`. This explicit output path avoids replacing the normal launcher bundle. Use Node 24+, the locked production dependencies and the existing verified Mac Electron runtime as described in RELEASING.md. No dependency or credential was added for reporting.

## Reporting flow

Choose **Report a Bug** in the sidebar or **Help → Report a Bug…**. Enter a description and reproduction steps, optionally include the sanitized diagnostic summary, then **Review report**. The full read-only text and exact recipient are shown before any sharing action. Edit details, copy the reviewed text, export a `.txt` file, or explicitly request a draft in the existing default mail client.

No SMTP/mail credentials are embedded. No automatic email or telemetry is sent. Opening a mail draft is not proof of delivery; review and send it yourself in the mail client. A missing or failing client, or a mail link longer than the conservative 1,800-character URI limit, leaves the full copy/export fallback available. Reports are never silently truncated for the mail link. Copy/export use the same immutable reviewed text; preview tokens expire after 30 minutes.

## Diagnostics and privacy

The app records renderer errors/rejected promises, main rejected promises and uncaught-exception monitoring, unexpected operating-system/utility failures, native renderer crashes, and genuine I/O/programming failures in app requests. Expected user validation errors are not logged. Uncaught-exception monitoring preserves Node's default fatal behavior. App startup failures are recorded when local storage can be reached.

Automatic reports contain only app/event version, OS kernel/platform/architecture, Electron/Chromium versions, timestamps, fixed failure/error categories, whitelisted error codes and at most five app-owned source filename/line locations. They never read project/script/media contents, personal contacts, environment variables, hostnames, raw error messages, console history, absolute paths, or crash-memory dumps. Common credentials, URLs, email addresses and personal paths in user-entered descriptions are redacted. Review your own wording: arbitrary sensitive prose cannot be recognized reliably by a redaction rule.

A private per-profile `diagnostics/` folder contains a maximum 40-event/32-KB event journal plus one small lifecycle marker. Folder/file modes are 0700/0600 on macOS. Identical consecutive failures are throttled for 10 seconds. Events expire after 14 days; expired entries are removed on opening and hourly while the app runs. Dismissal removes pending alerts and persists across restart; retained sanitized events expire normally. Five report drafts are held in memory only, not saved automatically.

Clean shutdown is recorded only after normal shutdown/close-save handling. A native renderer crash is labeled as such. An unclean lifecycle marker after a dead main process is labeled **session-interrupted**, with cause unknown: crash, force quit and power loss cannot be distinguished reliably without collecting more data. It does not assert a confirmed crash. A nonblocking notice on next launch offers review or dismissal. Nothing is transmitted on startup. Failed diagnostic storage leaves manual reporting usable and explains that local recording is unavailable.

## Validation

- `npm test`: 68 unit/regression tests, including privacy redaction, retention, private modes, corrupt logs, clean/interrupted sessions, immutable preview expiry, mail-client failure and full copy/export fallback.
- `npm run test:reporter`: packaged native acceptance in a new disposable `tmp/reporter-native-*` profile. Generates real renderer errors and promise failures, crashes only that test renderer with Chromium's `Page.crash`, reopens, verifies the complete saved demo model/template and reviews the report. Abruptly terminates only the exact isolated main PID to verify unknown interruption classification. Mail and clipboard operations are stubbed; no test email is sent and the user's clipboard is not changed.
- Existing desktop: 19 checks, including exact original issued-PDF preservation and restart data.
- Existing G-Casper: 12 checks, including front/back and Letter/A4 PDFs and restart templates.
- Packaged Production Desk importer: 11 checks, including reviewed reimport, ID/local-edit preservation and exact existing production preservation.

Local evidence lives under `verification/reporter-desktop/`, `verification/reporter-native-test.log`, `verification/reporter-unit-tests.txt` and the regression logs. Test profiles and evidence are ignored by Git. Never point crash tests at the user's live profile or canonical released executable.

## Release validation and future releases

The exact Developer ID signed/notarized 0.3.4 app passed the eight reporting checks with `CALLSHEET_REPORTER_EXECUTABLE` selecting its exported executable. The real signed 0.3.3 → 0.3.4 native update passed 14 checks: metadata, download, native replacement/relaunch, identical issued PDF bytes, saved pending edit, template/import model/IDs, backup, demo/images and reporting review. No test email was sent. Source/config matches the signed bundle; only publisher tooling, tests and documentation changed after its build.

The release workflow first uploads a prerelease, leaving stable clients untouched until acceptance passes. Native acceptance selects its signed version-specific public metadata only inside the disposable old test process; Ed25519, SHA-512 and native code-signature checks remain unchanged. Stable promotion requires matching native-acceptance artifact evidence and re-verifies every remote asset digest/size. See RELEASING.md for tested commands. Existing updater trust/configuration/storage IDs remain unchanged. No new credentials, paid services, keys or security permissions are needed.

Native reporting was tested on Apple Silicon macOS. Windows mail-client integration and native crash behavior require testing on Windows; existing Windows signing/distribution limitations remain.
