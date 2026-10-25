# Scene editor enhancement

Introduced in Script Call 0.3.12, based on released 0.3.11 (`778cc21`) and local
feature commit `cb5009a`. Release QA uses disposable profiles and installations;
the installed user app and real productions are untouched.

## Scene cards and recovery

Scenes use the same native disclosure-card presentation as locations. Closed cards
show scene number and title/slugline. Individual keyboard disclosure, Collapse all
and Expand all are supported. The open state is saved locally by production and
stable scene ID. New scenes open for editing; title edits update the header.
Presentation preferences are not exported with a portable production.

Delete Scene is at the bottom of each expanded card. A named confirmation explains
the linked schedule count, backup and recovery. Cancel makes no change. Confirm
soft-deletes only that scene; its full record, script, shots, cast membership,
location, length and raw schedule links/times/order remain stored. Independent
personal calls are retained and should be reviewed explicitly. Other schedule
times are not shifted. Draft/advance schedules, page totals and availability omit
the deleted scene. Schedule movement skips retained hidden links.

Restore is available through Deleted scenes beside Add scene, or Settings & help →
Deleted scenes. It reactivates retained links and original IDs without overwriting
later unrelated edits. The existing member/location recovery entry remains intact.
A database backup precedes deletion and restoration. There is no permanent purge.
Issued snapshots and original PDF bytes remain immutable. Deleting the last scene
leaves a safe empty active scene register and draft schedule, with calls retained.

The optional `recordTrash.scenes` extension does not rewrite legacy projects on
read. Portable archives containing that extension declare reader7, including an
imported empty extension, to prevent older readers from reviving or rejecting
unannounced fields. Restoring the last deleted scene removes the extension and its
reader7 requirement; other feature reader requirements can remain. Production Desk
reimport preserves flagged scenes and reports source conflicts rather than
reviving or overwriting them.

## Page lengths

Length (pages) accepts page units, while storage stays integer eighths (0–8000):

| Enter | Stored eighths | Display after commit |
| --- | ---: | --- |
| `2 3/8` | 19 | `2 3/8` |
| `3/8` | 3 | `3/8` |
| `2` | 16 | `2` |
| `2.375` | 19 | `2 3/8` |
| `1/2` or `4/8` | 4 | `4/8` |

Fractions must equal an exact whole number of eighths. Equivalent/improper
fractions and exact decimals are accepted; negative values, malformed/incomplete
text, `1/3`, `2.33`, zero denominators and values above 1000 pages are rejected
without rounding. Labels explicitly distinguish page units from stored eighth
counts. Existing saved lengths retain their values and totals.

Typing does not normalize or autosave a partial length. Blur, Tab, Enter or an
explicit navigation/save commits a valid value. Invalid text remains visible with
an inline accessible error and the last saved value unchanged. Invalid navigation,
Save and graceful close wait for correction or Escape. Escape cancels that length
edit and restores its current stored display. Other ordinary form autosaves retain
the last valid length; there is no invalid text in project exports. G-Casper and
Original Narrative continue to render their existing exact eighth-based values.

## Verification

- 130 unit tests passed, two optional private-provenance checks skipped, zero fail.
  Includes all 8001 supported eighth values round-tripping, exact parser boundaries,
  malformed/incomplete rejection, linked schedule/call/advance/availability handling,
  last scene, stale/repeated operations, backup failure atomicity, reopen, legacy
  registers, reader7 portable archives, source reimport, totals and both renderers.
- Native CUA Mac QA used only the embedded dedicated preview profile and a clearly
  named synthetic production. It covered default closed cards, keyboard disclosure,
  Expand all/Collapse all, open/closed state after relaunch and recovery; mixed,
  fraction-only, whole and exact-decimal editing; preserved partial slash/space
  input, invalid blur/save/quit handling, Escape and normal Tab focus; real issue,
  cancel/delete, last-scene empty state, restart, Settings Restore and page totals.
- An actual native-issued G-Casper PDF and frozen snapshot were compared before
  deletion and after restoration. PDF SHA-256:
  `d76dbeec2cfae25bdd4706f033ad96e80f65ffd1529c419aa8c7f22ea63b49a7`.
  Native entry lengths 19 + 3 eighths produced total `2 6/8`; deleting the first
  scene produced `0 3/8`, deleting both produced zero, restoring returned `2 6/8`.
  Calls stayed present. Original raw IDs/times/links/lengths were restored exactly,
  retaining the deliberately created later draft.
- The actual UI-exported deleted-scene archive was imported into another disposable
  store and restored. Scene/person/location IDs and original PDFs remained exact;
  revision IDs were remapped normally for a project copy. Reader requirement went
  from7 to2 after all scene flags were restored in that synthetic fixture.
- The separate local preview is ad-hoc signed. Direct launch embeds dedicated projects,
  preferences, logs, diagnostics, crash and backup storage; update installation is
  disabled. The installed app remains the already published0.3.11;
  none of these local scene changes were installed and no real production was edited.

Evidence: `verification/scene-feature-unit.txt`, `scene-feature-isolation.json`,
`scene-feature-native-proof.json`, `scene-feature-integrity.json` and the final
feature report. The subsequent explicitly authorized 0.3.12 release passed129 exact-build Mac UI
checks, packaged smoke and28 real 0.3.11→0.3.12 native-upgrade checks, in addition
to130 unit tests. The public release is Developer ID signed and Apple notarized.
See RELEASING.md for exact evidence. Windows, Intel Mac, physical touch and formal
screen-reader QA remain untested. The user app was not replaced by release QA.
