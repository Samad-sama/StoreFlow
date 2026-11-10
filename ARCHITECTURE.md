# StoreFlow System Architecture

## 1. Architectural Philosophy

StoreFlow is engineered with a **Web-First, Desktop-Ready** paradigm. The core application logic and UI are completely platform-agnostic, interfacing with the operating system through an abstraction layer (`PlatformAdapter`).

```
┌─────────────────────────────────────────────────────────────┐
│                       React 18 Frontend                     │
│   (App Shell, Router, Tailwind, Lucide, Recharts, i18n)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│        UI State Store        │    │      Business Services       │
│      (Zustand + Persist)     │    │  (Validation, Calculations)  │
└──────────────────────────────┘    └──────────────┬───────────────┘
                                                   │
                                                   ▼
                                    ┌──────────────────────────────┐
                                    │    Platform Adapter Layer    │
                                    │      (PlatformAdapter)       │
                                    └──────┬────────────────┬──────┘
                                           │                │
                    ┌──────────────────────┘                └──────────────────────┐
                    ▼                                                              ▼
     ┌─────────────────────────────┐                                ┌─────────────────────────────┐
     │      Web Implementation     │                                │      Desktop (Tauri 2)      │
     │  - IndexedDB (Dexie.js)     │                                │  - SQLite Local DB          │
     │  - Browser Blob Download    │                                │  - Rust Native FS           │
     │  - window.print()           │                                │  - Native Print Spooler     │
     │  - Web Notifications API    │                                │  - Native OS Notifications  │
     └─────────────────────────────┘                                └─────────────────────────────┘
```

---

## 2. Platform Adapter Specification

Located in `src/database/adapters/types.ts`:

- `saveFile(data: Blob, filename: string): Promise<string>`
- `readFile(path: string): Promise<Blob>`
- `print(content: string): Promise<void>`
- `showNotification(title: string, body: string): Promise<void>`
- `createBackup(): Promise<Blob>`
- `restoreBackup(data: Blob): Promise<void>`

The current web implementation uses `WebAdapter` (`src/database/adapters/web.ts`). When desktop development is authorized, a `TauriAdapter` will be swapped in without modifying any UI components or page logic.

---

## 3. State Management & Persistence Strategy

- **Application & UI State**: Managed via `Zustand` (`src/stores/appStore.ts`) with `persist` middleware storing theme, language, store information, and first-run status in `localStorage`.
- **Relational Domain Entities**: Managed via **Dexie.js** (`IndexedDB`) with type-safe schema definitions, indexes, and live query subscriptions (`useLiveQuery`).
- **Data Integrity**: Financial transactions and stock changes use Dexie atomic transactions (`db.transaction('rw', ...)`) ensuring all updates commit together or roll back cleanly.
