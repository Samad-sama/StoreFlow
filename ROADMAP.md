# StoreFlow Development Roadmap

## Phase 1 — Planning & Architecture ✅
- [x] Analyze requirements & define universal store model.
- [x] Create system architecture (`ARCHITECTURE.md`).
- [x] Design normalized relational database schema (`DATABASE.md`).
- [x] Specify platform abstraction layer (`PlatformAdapter`).

## Phase 2 — Foundation & Design System ✅
- [x] React 18 + Vite + TypeScript setup.
- [x] Tailwind CSS design tokens with Apple macOS aesthetic.
- [x] Trilingual engine (`i18next`): Arabic (Default RTL), English (LTR), French (LTR).
- [x] Theme engine: Light, Dark, System modes with instant persistence.
- [x] Dexie.js persistence adapter with atomic transactions.
- [x] Collapsible sidebar, topbar, global search, and routing shell.

## Phase 3 — Core Application Modules ✅
- [x] **Onboarding**: 4-step wizard with store info, business types, currency, tax rules, and sample demo data loader.
- [x] **Dashboard**: Live KPI cards, sales trends, net profit calculations, inventory valuation, stock alerts, and Recharts area charts.
- [x] **Products Management**: Full CRUD, SKU generation, barcode handling, category/brand filters, stock limits, and archive/duplicate actions.
- [x] **Categories & Brands**: Categorization with nested support and product deletion protection.
- [x] **Inventory Management**: Real-time stock status, manual stock adjustments (+ / - / set) with recorded reasons, and comprehensive movement audit history.
- [x] **Point of Sale (POS)**: Product catalog grid, search & barcode scanning, shopping cart with discounts and tax, customer assignment, payment modal (cash/card/bank transfer), receipt preview and print dialog.
- [x] **Sales & Invoices**: Order history, details drawer, printable invoices, and inventory-restoring refund handlers.
- [x] **Customers**: Profile management, debt/credit tracking, and purchase history.
- [x] **Suppliers & Purchases**: Supplier management and purchase order fulfillment with automatic stock increments.
- [x] **Expenses & Finance**: Expense tracking categorized by rent, utilities, supplies, and net profit calculations.
- [x] **Reports & Analytics**: Daily/monthly revenue, inventory valuation, and CSV export.
- [x] **Employees & Roles**: Role-based access (Owner, Manager, Cashier, Inventory) and audit visibility.
- [x] **Settings**: macOS-style master-detail settings, full JSON database backup & restore, and demo data cleaning.

## Phase 4 — Testing & Quality Assurance 🔄
- [x] TypeScript compiler zero-error verification (`tsc -b`).
- [x] Production bundle compilation (`vite build`).
- [ ] Automated business logic unit tests (Vitest).

## Phase 5 — Desktop Packaging (Future / Upon Explicit Approval) ⏳
- [ ] Configure Tauri 2.
- [ ] Connect SQLite database via Rust backend.
- [ ] Native file system and native receipt printer spooler.
- [ ] Build desktop installers (DO NOT EXECUTE without explicit user approval).
