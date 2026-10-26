# Windows updater implementation and release gates

The published `0.3.16-windows.preview.1` portable ZIP is manual-download only.
It cannot bootstrap automatic updates: its embedded preview profile rejects
download/install IPC, its version is a prerelease, and the shared stable manifest
policy accepts stable versions and Windows `.exe` installers only. Publishing a
ZIP or website link does not alter an already downloaded client.

## Chosen upgrade path

Use the existing electron-updater NSIS installed-app path, per-user and without
elevation, rather than overwriting a running portable application. The first
update-capable Windows application therefore requires a manual installation.
Import an exported portable project into the installed application; never adopt
or remove the preview folder implicitly.

Retain Ed25519 signed metadata, approved artifact destination, platform/CPU and
minimum-OS checks, SHA-512 download validation, Authenticode verification against
approved full publisher subjects, and explicit Download then Save/back up/restart
consent. A strict native verifier now also rejects unavailable PowerShell,
malformed results, errors, unsigned files, mismatched subjects and wrong paths.
The dependency's existing signature verification remains active after that gate.
The child PowerShell resets only its inherited module search path so PowerShell 7
modules do not prevent Windows PowerShell from loading its standard modules.

## Current blockers and required evidence

- `desktop/update-config.json` has `publisherName: null`. No approved Windows
  signing identity has been supplied. The current executable is unsigned and was
  correctly rejected by native Authenticode verification. Do not turn off this
  gate or create/trust a test certificate on a user's machine.
- Obtain an approved signing workflow and full publisher subject through the
  owner. This work did not discover, export, generate or configure credentials.
- Produce two properly signed NSIS fixtures on an isolated test identity and
  installation path; confirm old-to-new download, replacement, relaunch and
  preservation of project IDs, backups, preferences and original issued PDFs.
- Simulate interruption, locked files, failed install and failed startup in a
  disposable environment. Atomic replacement and rollback are NOT yet verified;
  backup creation is not equivalent to executable rollback. Do not enable a
  stable Windows feed until those gates are implemented and demonstrated.
- Sign the Windows manifest through the existing publisher workflow; the
  existing private metadata key may require the owner's Mac. No key transfer is
  needed merely to build or test the application. Do not publish placeholder
  manifests, replace Mac feeds, or change the existing metadata trust key.
- Configure a real Windows release feed only when native acceptance passes.
  The stable publisher currently publishes one platform at a time: review its
  multi-platform release assembly before publishing alongside Mac assets.

## Evidence

On 2026-10-26, 16 targeted updater/signature tests passed on Windows x64. These
cover signed-envelope policy, checksum tampering, explicit consent and backup
gates with a simulated transport, plus read-only Authenticode rejection of the
actual unsigned preview. They are not evidence of a successful signed installer
upgrade. The published preview artifact is unchanged by this development work.

```powershell
$env:CALLSHEET_UNSIGNED_PREVIEW = '<absolute path to unsigned preview exe>'
node --test tests/updates.test.cjs tests/windows-signature.test.cjs
```
