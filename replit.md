# My Docs by NM

A premium offline document wallet app for Android — scan, store, and manage your documents and cards locally on your device.

## Run & Operate

- `pnpm --filter @workspace/my-docs run dev` — run the Expo dev server
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Required env: none (fully offline app, no backend needed)

## Stack

- Expo SDK 54 + React Native 0.81
- expo-router (file-based routing)
- expo-camera (document scanning)
- expo-file-system (local image storage)
- expo-secure-store (PIN storage)
- expo-image-manipulator (image enhancement)
- expo-blur + expo-linear-gradient (glassmorphism UI)
- react-native-reanimated (3D flip animations)
- AsyncStorage (document metadata persistence)
- pnpm workspaces, TypeScript 5.9

## Where things live

- `artifacts/my-docs/` — Expo mobile app
- `artifacts/my-docs/app/` — screens (home, scanner, document viewer, settings, PIN)
- `artifacts/my-docs/context/` — DocumentContext (CRUD), PinContext (PIN lock)
- `artifacts/my-docs/components/` — shared UI (GlassCard, FlipCard, PinPad, ScanOverlay, etc.)
- `artifacts/my-docs/constants/colors.ts` — dark glassmorphism design tokens

## Architecture decisions

- Fully offline: no backend, no auth, no network requests. AsyncStorage + expo-file-system for all persistence.
- Dark-only UI: `userInterfaceStyle: "dark"` in app.json forces dark mode always.
- Document images saved to `FileSystem.documentDirectory/mydocs/` for permanent local storage.
- PIN stored in expo-secure-store (platform keychain); falls back to AsyncStorage on web.
- 3D card flip uses react-native-reanimated `withSpring` + `interpolate` for a realistic perspective flip.

## Product

- **Home screen**: dark glassmorphism UI, search bar, grid of saved docs, FAB scan button
- **Scanner**: live camera view with animated scan overlay, front→back capture flow, image enhancement
- **Document viewer**: realistic 3D flip card animation (tap to flip front/back)
- **Settings**: PIN lock toggle, change PIN, delete all documents
- **PIN lock**: 4-digit PIN pad shown on launch when PIN is enabled

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Package versions must match Expo SDK 54 expectations (expo-camera ~17.0.x, expo-file-system ~19.0.x, etc.)
- expo-secure-store is polyfilled on web via AsyncStorage fallback
- Shadow* style props show a warning on web — harmless, web is not the primary target

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `expo` skill for Expo-specific guidelines and gotchas
