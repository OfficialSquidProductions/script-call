# Script Call website and update routing contract

Confirmed public website hostname: `https://scriptcall.squidproductions.org/`.

Public source and MIT license: `https://github.com/OfficialSquidProductions/script-call`.

Public release assets repository: `https://github.com/OfficialSquidProductions/script-call-updates`.

The Squarespace task owns website/DNS/redirect edits. The application task does not assume Squarespace serves raw signed metadata. Test the exact routes without signing in before embedding the website feed URL in production binaries.

| Purpose | Permanent GitHub backend URL |
|---|---|
| Signed stable Mac Apple Silicon metadata | `https://github.com/OfficialSquidProductions/script-call-updates/releases/latest/download/stable-darwin-arm64.json` |
| Latest notarized Mac download (same bytes as versioned ZIP) | `https://github.com/OfficialSquidProductions/script-call-updates/releases/latest/download/Script-Call-Mac.zip` |
| Release notes/checksums | `https://github.com/OfficialSquidProductions/script-call-updates/releases/latest` |
| Immutable versioned update binary | `https://github.com/OfficialSquidProductions/script-call-updates/releases/download/vVERSION/Script-Call-VERSION-darwin-arm64.zip` |

Recommended website routes: `/updates/stable-darwin-arm64.json` redirects via HTTPS to the signed metadata backend above; `/download/mac` redirects via HTTPS to the stable download alias above. A redirect is sufficient: the app follows bounded HTTPS redirects and verifies the Ed25519 envelope itself. It must receive JSON bytes, not a Squarespace HTML page/login/challenge. No private client token is required. Artifact URLs inside signed manifests remain immutable GitHub URLs and are checked against the approved GitHub release prefix.

Before final app notarization/public bootstrap: verify website HTTPS certificate, unauthenticated redirect chain and raw metadata signature; verify download alias SHA-512 equals the notarized versioned ZIP. Then embed `https://scriptcall.squidproductions.org/updates/stable-{platform}-{arch}.json` as the manifest entry point. Retain the GitHub signed metadata backend for any existing test/bootstrap clients that already contain its URL.

Current status: no binary release had been published when this contract was prepared. Unshipped 0.3.1 candidates contain the direct GitHub metadata URL; the website entry point is not yet committed to a production app. No live client migration is needed yet.
