# Script Call

A Squid Productions Software

Script Call **0.3.1** is local-first Electron software for production records, daily call sheets, schedule and cast/crew calls, G-Casper-style front/back layouts, Original Narrative templates, PDF export and immutable issued revisions. Production Desk project import and reviewed three-way reimport are included. Existing demo scene/shot IDs, project formats and template choices are preserved.

## Run locally

On this prepared Apple Silicon workspace, double-click **Start Script Call.command**. **Start Call Sheet.command** remains a compatible launcher. Both use the existing `.local-data/` folder. The local app is `build/mac/Script Call.app`. This build is ad-hoc signed for local testing, not a notarized distribution release.

From a clean checkout, use Node.js 24 or newer and npm:

```sh
npm ci
npm start
npm test
npm run test:desktop
npm run test:gcasper
npm run test:import
```

Desktop tests require Playwright (`CALLSHEET_PLAYWRIGHT` can point to an installed Playwright module) and an Electron executable (`CALLSHEET_ELECTRON`). For this prepared workspace `npm run build:mac` repackages the verified `.runtime/electron` runtime. For a release build use `npm run build:release:mac` or `npm run build:win` with the established signing environment. See [RELEASING.md](RELEASING.md).

## Data compatibility

The native app ID remains `org.squidproductions.callsheet.prototype`. The default profile remains **Call Sheet Prototype** under the OS application-data directory; its projects remain in `local-projects/`. `CALLSHEET_DATA_DIR`, the `callsheet://` origin, SQLite schema, database name and `.callsheet` archive format are unchanged. Branding does not move or rewrite existing stores. The desktop launcher continues using `.local-data/` in this folder.

Production Desk imports are previewed before commitment, backed up before changes, and merged against the prior imported baseline. Manual edits, explicit blanks, saved layouts and issued days win. Original issued PDF bytes remain in SQLite and portable archives. Keep the original `.productiondesk` export for its embedded original PDF attachments. A changing import never auto-issues a sheet. No real productions, output PDFs, private samples, development sibling snapshots or local profiles are tracked in this repository.

## Updates

The updater implementation uses `electron-updater`, an Ed25519-signed metadata envelope and SHA-512 artifact verification. It checks only compatible stable versions for the current platform and architecture, refuses downgrades, and requires native code-signature checks. Automatic checks run after startup and daily when enabled; download and restart require a choice. Installation flushes pending edits and makes a SQLite backup. Failed or offline checks keep the current app usable.

**The source is public under MIT and the approved update endpoint is configured.** Mac release notarization and the real two-version upgrade are being verified before marking live delivery complete. Windows signing/runtime remain unverified. The approved per-app Ed25519 key remains in the local login Keychain; only its public key ships. Clients contain no GitHub token. Source commits do not ship an update. [Release instructions and blockers](RELEASING.md) describe the complete preparation and publication commands.

The fictional Last Light fixture is the shared released Squid Productions example: 8 scenes, 16 shots, 3 shooting days, scene 8 unscheduled. Quiet Hours remains a separately labeled legacy example. Third-party licenses and font notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## License

Squid Productions’ original code and included fictional demos are MIT licensed. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for unchanged third-party font/dependency licenses and branding notices. The Last Light demo remains included with its stable scene, shot and import IDs.
