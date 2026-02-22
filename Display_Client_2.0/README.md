# KDS Device Shell

A cross-platform kiosk wrapper built with Capacitor + React that loads an existing Kitchen Display System (KDS) URL while enforcing kiosk policies, device registration, and diagnostics across Electron (Windows), Android, and iOS targets.

## Highlights

- 🔐 **Persistent device identity** stored per-platform (Electron store, Android SharedPreferences, iOS Keychain via Capacitor Preferences).
- 🌐 **Embedded display surface** that injects the device UUID and metadata into the remote page via query params, custom headers (Electron), and `postMessage`.
- 🧭 **Device metadata + registration** collected on boot and POSTed to `/api/devices/register`; recurring heartbeats hit `/api/devices/heartbeat`.
- 🛡️ **Kiosk hardening**: fullscreen, context-menu/shortcut suppression, watchdog reloads, network auto-recover, Windows auto-start, Android overlay permission request, iOS Guided Access hints.
- 🧰 **Admin panel (PIN gated)** showing UUID, station assignment, heartbeat history, diagnostics, and JSON log export.
- 📦 **Multi-platform build scripts**: `npm run build:windows`, `npm run build:android`, `npm run build:ios` plus CI helper scripts for signing.

## Getting Started

1. **Install prerequisites**
   - Node.js 18+
   - Android Studio (SDK 36) for APK builds
   - Xcode 15+ for iOS builds
   - Java 17 for Gradle
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure environment**
   - Copy `.env.example` to `.env` and set the values:
     ```env
     VITE_DISPLAY_URL=https://your-display.example.com
     VITE_API_BASE_URL=https://api.example.com
     VITE_HEARTBEAT_INTERVAL_MS=15000
     VITE_STATION_HINT=drive-thru
     VITE_ADMIN_PIN=2468
     ```
4. **Run locally**
   ```bash
   npm run dev
   ```
   - Electron development shell: `npm run dev:electron`

## Build Targets

| Platform | Command | Notes |
| --- | --- | --- |
| Electron (Windows) | `npm run build:windows` | Uses `electron-builder` → `release/` installer. Honors `CSC_*` env vars for signing. |
| Android APK (minSdk 23+) | `npm run build:android` | Generates `android/app/build/outputs/apk/release/`. Configure keystore env vars or sign manually. |
| iOS (13+) | `npm run build:ios` | Runs `xcodebuild` via Capacitor sync; open Xcode for signing/deployment. |

CI helper scripts live in `scripts/ci-*` and simply wrap the commands with signing env variables.

## Runtime Behavior

1. **Bootstrap**
   - Reads secure storage for an existing UUID; if missing, generates a v4 UUID and saves it per platform.
   - Collects metadata from Capacitor Device APIs (model, OS, orientation, touch support) or Electron main process.
   - POSTs to `/api/devices/register` with `{ deviceId, metadata, stationHint }`.
2. **Display embedding**
   - Loads `VITE_DISPLAY_URL` inside an iframe, appending `deviceId` and `station` query params.
   - Sends `{ deviceId, metadata }` to the iframe via `postMessage` repeatedly and whenever the page requests it with `kds/request-device-info`.
   - Electron additionally injects an `X-KDS-Device-ID` header for all requests to the display host.
3. **Heartbeat + watchdog**
   - Sends `/api/devices/heartbeat` on `VITE_HEARTBEAT_INTERVAL_MS`.
   - Network watcher triggers reloads when connectivity returns; watchdog forces reload when heartbeats fall behind >3 intervals.
4. **Admin panel**
   - Tap/click the floating dot (top-right) → enter PIN (`VITE_ADMIN_PIN`).
   - Review UUID, station, heartbeat timestamps, change station assignment, export logs, or close the panel.

## Platform Notes

- **Windows / Electron**
  - Auto-start is enabled via `auto-launch`. Use `scripts/register-shell.ps1 -ExecutablePath "C:\\Program Files\\KDS Device Shell\\KDS Device Shell.exe"` to register as a shell replacement (run elevated). `-Revert` restores Explorer.
  - Logging export uses the native save dialog; `.env` is copied into the packaged app via `extraResources`.
- **Android**
  - Manifest requests `SYSTEM_ALERT_WINDOW`, `WAKE_LOCK`, and locks the activity to `sensorLandscape` `singleTask`.
  - `MainActivity` enforces immersive mode, keep-screen-on, and prompts the overlay permission for operators.
- **iOS**
  - Idle timer disabled; Guided Access is requested on launch/activate, with hints defined in `Info.plist`.
  - Add your signing team + provisioning profiles in Xcode before archiving.

## Logging & Diagnostics

- `src/services/logService.ts` captures console output, registration responses, and heartbeat status.
- Admin panel shows the log count and exports the in-memory buffer as JSON either via the browser download or Electron native dialog.
- `scripts/ci-build-*.{ps1,sh}` illustrate how to feed signing material via environment variables for automated pipelines.

## Development Tips

- Update `.env` before running `npm run sync` so that both Capacitor and Electron builds embed the right display URL.
- To customize kiosk styling or admin UI, edit the CSS in `src/styles/global.css`.
- When packaging for production, ensure network policies (firewall/allowlist) permit outbound access for both `VITE_DISPLAY_URL` and `VITE_API_BASE_URL`.

## Known Gaps / Next Steps

- Header injection for the embedded page is currently implemented for Electron via `session.webRequest`. Native mobile WebViews would require a custom Capacitor plugin if headers are mandatory beyond the query parameter + window message.
- Shell replacement registration is scripted but should be validated in staging before enabling on live kiosks.
