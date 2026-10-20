# Third-party notices

Script Call is local-first desktop software for Squid Productions. The supplied SP logo remains unchanged and is not licensed for unrelated use.

- Electron 44.9.1: MIT and bundled Chromium/third-party notices. The local app includes `Electron-LICENSE` and `Electron-LICENSES.chromium.html` in Contents/Resources. Runtime download and SHA-256 are recorded in `verification/dependencies.json`.
- fflate 0.8.2: MIT. Full license is retained in `node_modules/fflate/LICENSE` and copied with the package into the app.
- SunCalc 1.9.0: BSD-2-Clause. Full copyright, conditions and disclaimer are retained in `node_modules/suncalc/LICENSE` and copied with the package into the app. Copyright (c) 2014, Vladimir Agafonkin.
- Node.js and SQLite are bundled by Electron; their notices remain in the Electron distribution.

Futura and Reross are resolved from installed fonts. Their binaries are not copied into the app or source archive. App font redistribution and cross-platform embedding rights require separate review before a public release.

The G-Casper-style print template bundles the unmodified Montserrat and Nunito variable fonts from the official Google Fonts repository under SIL Open Font License 1.1. Full copyright and license text are retained in `web/assets/fonts/Montserrat-OFL.txt` and `web/assets/fonts/Nunito-OFL.txt`. These fonts are embedded locally in previews and PDFs; rendering makes no font-service requests. This does not change installed-font discovery for the original Narrative template.

Built-in fictional demo data is extracted read-only from the user's released Squid Productions fixture pair: Production Desk 1.5.10 / Scenic 1.4.22 share The Last Light (eight scenes, sixteen shots). No saved user workspace is read or copied. `fixtures/provenance.json` records exact release and installed app source paths, hashes, source identities and illustrative additions. Quiet Hours is retained only as a separately labeled historical example from the older Desktop source branch.

The G-Casper-style template is an original implementation informed by Prodigium's public documentation and a user-authorized read-only working-sheet reference. No G-Casper formulas, scripts, logos, artwork or private production records are bundled. Reference scope and adaptations are in `planning/reference/G-Casper-Implementation.md`.

The Production Desk importer includes the MIT-licensed v1 validateUSS function from film-native.js, copyright Squid Productions. The full license is retained in licenses/Production-Desk-MIT.txt. electron-updater 6.8.9 (MIT) and its dependencies retain their original licenses in the app node_modules tree.

## Public release license scope

The root MIT license covers Squid Productions' original project code and included fictional demo fixtures, including The Last Light screenplay and stable source/import IDs. The existing Production Desk validator keeps its original MIT copyright/license notice. No third-party material is relicensed: Electron/Chromium/Node, fflate, SunCalc, electron-updater and their dependencies retain their own licenses; Montserrat and Nunito remain SIL OFL 1.1. The SP logo and app icon are Squid Productions branding supplied for Script Call builds and distribution; the code's MIT license grants no unrelated branding or trademark endorsement rights. No G-Casper workbook, workbook formulas/scripts, private production records, screenshots of private reference workbooks or commercial font files are included in this repository or release.
