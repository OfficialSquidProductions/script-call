Windows portable updater preview

This is an unsigned Windows x64 preview with a separate, cryptographically signed
portable update channel. A new manual bootstrap download is required; the earlier
0.3.16-windows.preview.1 portable app cannot acquire this updater automatically.

Extract the full bootstrap ZIP into a writable folder and launch the root Script
Call Windows Preview.exe. Export projects from the older preview and import them
explicitly. Keep independent backups. Do not launch files inside versions/.

Updates require your Download and Save/back up/restart choices. Release signatures
and file hashes are verified before installation. Failed trial startup restores
the previous application and untouched profile. Accepted updates do not silently
roll back subsequent edits. Older data/app generations remain on disk for recovery.

The Windows executable remains unsigned. If Windows blocks execution, stop rather
than bypassing its protections. Mac stable releases and updates are unchanged.
ARM64, installer/file associations and irreversible data migrations are outside
this portable preview. Production-key/public-feed acceptance must pass before
this candidate replaces the existing website download.
