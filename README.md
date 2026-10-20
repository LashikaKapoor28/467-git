# Team 467 GitLab

Local recovery of https://team467-git.base44.app, retrieved October 20, 2026.

## Run on Windows

From this folder in PowerShell:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\start.ps1
```

Open http://localhost:4670. Keep the terminal running; press Ctrl+C to stop.
Use `-Port 8080` after the script filename to choose another port.
No Node.js installation or build step is needed for this recovered version.

## Included files

- `index.html`: original published HTML entry point.
- `assets/index-Ds5au_fa.js`: actual published application JavaScript, including React, interface components, simulator logic, and the Base44 SDK. It is bundled and minified.
- `assets/index-BObOBgAM.css`: original published styles.
- `reference.html`: unchanged copy of the downloaded page for reference.
- `manifest.json`: local web app manifest.
- `start.ps1`: local static server with SPA route fallback and an HTTP proxy to the original Base44 app.

The visual application uses its actual deployed code; it was not redrawn from a screenshot. Fonts and images referenced by that code still load from their original internet URLs.

## Local customizations

The app now uses blue branding. The VS Code activity bar includes **Pull requests**, with a recommended terminal walkthrough and an optional sidebar form. The terminal shows the next command and lets you click it to fill the input before editing and pressing Enter. It guides cloning, creating a feature branch, editing files, staging, committing, pushing, and opening a PR.

The simulated terminal also supports:

```text
gh pr create --base main --title "Add robot vision" --body "What changed, why, and how it was tested" --reviewer "Classmate full name"
```

`--reviewer` is optional; use a classmate's full classroom name. This creates a classroom simulator PR in the existing Base44 backend. It checks for uncommitted changes, unpushed commits, and existing open PRs before creating one. It does not run the real GitHub CLI on your computer.

Editable feature code is in `assets/team467-enhancements.js`, with styles in `assets/team467-enhancements.css`. `apply-local-enhancements.ps1` documents the bounded integration points in the recovered bundle and the blue palette conversion; it is safe to rerun. `reference.html` stays unchanged as the original reference. Launch the customized app through `index.html` using the server.

Browser checks: open http://localhost:4670/assets/tests/pull-requests.html while the server is running. The 19 checks use a mock backend for PR operations, so they do not create live PRs. Signed-in, end-to-end classroom PR creation still needs verification with a team account.

## What still depends on Base44

This is a recovered frontend, not an independent export of the entire project. Base44 did not publish a JavaScript source map at the bundle's `.map` URL. Original JSX/TSX component files, entity schemas, database contents, secrets, and server function implementations are not included in the public deployment.

The launcher forwards API calls to the existing app. Signing in, team records, classroom progress, and operations such as `pushBranch`, `mergePullRequest`, and `submitReview` therefore still require the original backend and its access permissions. Operations performed through this local app can change live team data.

Browser login callbacks/cookies may require Base44 configuration for localhost. The launcher does not proxy WebSocket upgrades, so real-time subscriptions are not supported by this local server. An authenticated browser session and multiplayer behavior have not been verified. This version is not an offline replacement.

For normal component-level development or an independent backend, export the original project using Base44's code download or GitHub integration and bring that source into this repository. Keep the recovered assets until the export has been compared with the live app.
