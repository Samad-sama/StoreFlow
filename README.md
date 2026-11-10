# StoreFlow — Universal Store Management System

> **A professional, Apple-inspired Store Management System built with React, Vite, TypeScript, and IndexedDB (Dexie.js), architected for desktop integration with Tauri 2 and SQLite.**

---

## 🌟 Key Highlights

- **Web-First Architecture**: Runs locally using standard `npm run dev` in any browser. No desktop packaging without explicit user authorization.
- **Multilingual & RTL-First**: Full native **Arabic (Default RTL)**, **English (LTR)**, and **French (LTR)** with instant reactive language switching.
- **Apple macOS-Inspired Design**: Soft rounded geometry, refined neutral palettes, clear typographic hierarchy, subtle shadows, and responsive layout.
- **Universal Business Support**: Configurable for fashion/clothing, supermarkets, electronics, phones, cosmetics, pharmacies, hardware, bookstores, and wholesale.
- **Local Persistence**: Powered by IndexedDB via **Dexie.js** with full offline capability, data persistence across refreshes, and atomic operations.
- **Future-Proof Desktop Boundary**: Abstracted `PlatformAdapter` isolating file system operations, database persistence, native printing, and backup restoration.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm (v9+)

### Installation & Development

```bash
# Clone and enter directory
cd ~/Documents/StoreFlow

# Install dependencies (already completed)
npm install

# Run the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Core Feature Modules

1. **Onboarding Wizard**: 4-step first-run configuration (Store info, business type, language, currency, tax rules, and sample demo data).
2. **Dashboard**: Real-time sales, net profit, inventory valuation, low-stock/out-of-stock alerts, and interactive Recharts charts.
3. **Products Management**: SKU, barcode scanning, category/brand tagging, purchase & selling prices, stock alerts, duplicate and archive workflows.
4. **Categories & Brands**: Nested categories and brands management with deletion protection.
5. **Inventory Management**: Stock overview, stock adjustment dialog with reason categorization, and full traceable movement history.
6. **Point of Sale (POS)**: Fast search, product grid, cart with discounts and tax, customer selection, multiple payment methods, hold/resume sales, atomic stock deduction, and printable receipt.
7. **Sales & Orders**: Full transaction history, details drawer, and stock-restoring refund handlers.
8. **Customers & Suppliers**: Customer debts, supplier balances, contact details, and transaction history.
9. **Purchases**: Purchase orders, receiving goods, and automatic inventory updates.
10. **Expenses**: Operating expenses tracking, categories, and P&L contribution.
11. **Reports & Analytics**: Daily/monthly sales trends, inventory valuation breakdown, and CSV data export.
12. **Employees & Permissions**: Role management (Owner, Manager, Cashier, Inventory) and audit visibility.
13. **Settings (macOS-Style)**: Master-detail sidebar with appearance (Light/Dark/System), regional settings, currency/tax config, database backup export/import, and demo data cleaning.

---

## 🧪 Testing

```bash
npm run test
```

## 🏗️ Production Build

```bash
npm run build
```
