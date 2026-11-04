# How this works

There are 2 main parts of the app:

1. renderer: this is the HTML/Javascript-based UI rendered within the Electron container. This runs Vue.js, a React-like Javascript framework for rendering front-end.
2. main: includes the main app (written in Electron). Handles keyboard shortcuts, brings up the UI and overlays.

Note that these 2 both depend on each other, and one cannot run without the other.

# How to develop

The most up-to-date instructions can always be derived from CI:

[.github/workflows/main.yml](https://github.com/SnosMe/awakened-poe-trade/blob/master/.github/workflows/main.yml)

Here's what that looks like as of 2026-08-01.

```shell
cd renderer
npm ci
npm run dev

# In a second shell
cd main
npm ci
npm run dev
```

# How to build

```shell
cd renderer
npm ci
npm run build

cd ../main
npm ci
npm run build
# We want to sign with a distribution certificate to ensure other users can
# install without errors
CSC_NAME="Certificate name in Keychain" npm run package
```

# Releasing Woke PoE Trade (woke)

The app ships as "Woke PoE Trade": its own app id, data folder
(`%APPDATA%\woke-poe-trade`) and update feed (this repo's GitHub releases), so
it never mixes with a normal Awakened PoE Trade install. On first run it copies
data from `%APPDATA%\awakened-poe-trade` when that folder belongs to an earlier
build of this app (or just the settings when it's plain APT).

1. Bump `version` in `main/package.json`.
2. Push a tag `v<version>` (for example `v0.1.0`).
3. `.github/workflows/release.yml` builds the Windows installer and uploads it
   to a **draft** release. Players and the auto-updater only see it once the
   draft is published on GitHub.

`npm run package` in `main/` downloads the OCR data into `main/build/cv-ocr`
first (`build/fetch-ocr.mjs`), so map scan, essence scan and heist gem OCR work
without a manual download.

Useful flags: `--setup` opens the first-run setup window again, `--no-updates`
turns off update downloads. Crash reports are saved in
`%APPDATA%\woke-poe-trade\crash-reports`.
