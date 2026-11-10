import Dexie, { type EntityTable } from 'dexie';

// ─── Entity Types ──────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  description: string;
  imageUrl: string;
  additionalImages: string[];
  categoryId: string | null;
  brandId: string | null;
  supplierId: string | null;
  purchasePrice: number;
  sellingPrice: number;
  wholesalePrice: number | null;
  discount: number;
  discountType: 'percentage' | 'fixed';
  taxRate: number;
  quantity: number;
  minimumStock: number;
  unit: string;
  status: 'active' | 'archived' | 'draft';
  customAttributes: Record<string, string>;
  hasVariants: boolean;
  expirationDate: string | null;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  barcode: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  attributes: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  icon: string;
  imageUrl: string;
  sortOrder: number;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  totalPurchases: number;
  outstandingBalance: number;
  credit: number;
  status: 'active' | 'archived';
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  contactPerson: string;
  notes: string;
  outstandingBalance: number;
  status: 'active' | 'archived';
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  saleNumber: string;
  customerId: string | null;
  customerName: string;
  employeeId: string | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  status: 'completed' | 'held' | 'cancelled' | 'refunded';
  notes: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  variantId: string | null;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  saleId: string | null;
  purchaseId: string | null;
  type: 'sale' | 'purchase' | 'refund' | 'expense' | 'customer_payment';
  method: 'cash' | 'card' | 'bank_transfer' | 'other';
  amount: number;
  reference: string;
  notes: string;
  isDemo: boolean;
  createdAt: string;
}

export interface Refund {
  id: string;
  saleId: string;
  amount: number;
  reason: string;
  items: { saleItemId: string; quantity: number; returnToStock: boolean }[];
  status: 'completed' | 'partial';
  isDemo: boolean;
  createdAt: string;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: 'pending' | 'received' | 'partial' | 'cancelled';
  notes: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  productName: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalAmount: number;
  createdAt: string;
}

export interface Expense {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  description: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'other';
  receiptUrl: string;
  date: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  isDemo: boolean;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'damaged' | 'lost' | 'transfer' | 'initial';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  referenceId: string | null;
  referenceType: 'sale' | 'purchase' | 'refund' | 'manual' | null;
  isDemo: boolean;
  createdAt: string;
}

export interface CashRegisterSession {
  id: string;
  openingBalance: number;
  closingBalance: number | null;
  expectedBalance: number | null;
  difference: number | null;
  salesTotal: number;
  refundsTotal: number;
  expensesTotal: number;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt: string | null;
  notes: string;
  isDemo: boolean;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
}

export interface AppSettings {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'sale' | 'payment' | 'backup' | 'info';
  title: string;
  message: string;
  isRead: boolean;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
}

// ─── Database ──────────────────────────────────────────────
export class StoreFlowDB extends Dexie {
  products!: EntityTable<Product, 'id'>;
  productVariants!: EntityTable<ProductVariant, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  brands!: EntityTable<Brand, 'id'>;
  customers!: EntityTable<Customer, 'id'>;
  suppliers!: EntityTable<Supplier, 'id'>;
  sales!: EntityTable<Sale, 'id'>;
  saleItems!: EntityTable<SaleItem, 'id'>;
  payments!: EntityTable<Payment, 'id'>;
  refunds!: EntityTable<Refund, 'id'>;
  purchases!: EntityTable<Purchase, 'id'>;
  purchaseItems!: EntityTable<PurchaseItem, 'id'>;
  expenses!: EntityTable<Expense, 'id'>;
  expenseCategories!: EntityTable<ExpenseCategory, 'id'>;
  inventoryMovements!: EntityTable<InventoryMovement, 'id'>;
  cashRegisterSessions!: EntityTable<CashRegisterSession, 'id'>;
  auditLogs!: EntityTable<AuditLog, 'id'>;
  appSettings!: EntityTable<AppSettings, 'id'>;
  notifications!: EntityTable<Notification, 'id'>;

  constructor() {
    super('StoreFlowDB');
    this.version(1).stores({
      products: 'id, name, sku, barcode, categoryId, brandId, supplierId, status, isDemo, createdAt',
      productVariants: 'id, productId, sku, barcode',
      categories: 'id, name, parentId, isDemo',
      brands: 'id, name, isDemo',
      customers: 'id, name, phone, email, status, isDemo',
      suppliers: 'id, name, phone, status, isDemo',
      sales: 'id, saleNumber, customerId, employeeId, status, isDemo, createdAt',
      saleItems: 'id, saleId, productId',
      payments: 'id, saleId, purchaseId, type, method, isDemo, createdAt',
      refunds: 'id, saleId, isDemo',
      purchases: 'id, purchaseNumber, supplierId, status, isDemo, createdAt',
      purchaseItems: 'id, purchaseId, productId',
      expenses: 'id, categoryId, date, isDemo, createdAt',
      expenseCategories: 'id, name, isDemo',
      inventoryMovements: 'id, productId, type, isDemo, createdAt',
      cashRegisterSessions: 'id, status, openedAt, isDemo',
      auditLogs: 'id, userId, entityType, createdAt',
      appSettings: 'id, key',
      notifications: 'id, type, isRead, createdAt',
    });
  }
}

export const db = new StoreFlowDB();
