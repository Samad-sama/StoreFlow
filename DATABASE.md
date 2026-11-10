# StoreFlow Database Documentation

## 1. Schema Overview

The database is defined in `src/database/schema.ts` and managed via Dexie.js (IndexedDB). It mirrors the intended schema for the future SQLite desktop engine.

### Tables

1. **`products`**:
   - `id`: Primary key (UUID string)
   - `name`, `sku`, `barcode`, `description`, `imageUrl`, `additionalImages`
   - `categoryId`, `brandId`, `supplierId` (Foreign keys)
   - `purchasePrice`, `sellingPrice`, `wholesalePrice`, `discount`, `discountType`, `taxRate`
   - `quantity`, `minimumStock`, `unit`, `status` (`active` | `archived` | `draft`)
   - `customAttributes`, `hasVariants`, `expirationDate`, `isDemo`, `createdAt`, `updatedAt`

2. **`productVariants`**:
   - `id`, `productId`, `name`, `sku`, `barcode`, `purchasePrice`, `sellingPrice`, `quantity`, `attributes`

3. **`categories`**:
   - `id`, `name`, `description`, `parentId`, `icon`, `imageUrl`, `sortOrder`, `isDemo`

4. **`brands`**:
   - `id`, `name`, `description`, `logoUrl`, `isDemo`

5. **`customers`**:
   - `id`, `name`, `phone`, `email`, `address`, `notes`, `totalPurchases`, `outstandingBalance`, `credit`, `status`, `isDemo`

6. **`suppliers`**:
   - `id`, `name`, `phone`, `email`, `address`, `contactPerson`, `notes`, `outstandingBalance`, `status`, `isDemo`

7. **`sales`**:
   - `id`, `saleNumber`, `customerId`, `customerName`, `employeeId`
   - `subtotal`, `discountAmount`, `taxAmount`, `totalAmount`, `paidAmount`, `changeAmount`
   - `status` (`completed` | `held` | `cancelled` | `refunded`), `notes`, `isDemo`, `createdAt`, `updatedAt`

8. **`saleItems`**:
   - `id`, `saleId`, `productId`, `variantId`, `productName`, `sku`, `quantity`, `unitPrice`, `purchasePrice`, `discount`, `taxRate`, `taxAmount`, `totalAmount`

9. **`payments`**:
   - `id`, `saleId`, `purchaseId`, `type`, `method` (`cash` | `card` | `bank_transfer` | `other`), `amount`, `reference`, `notes`, `isDemo`, `createdAt`

10. **`refunds`**:
    - `id`, `saleId`, `amount`, `reason`, `items` (array with `saleItemId`, `quantity`, `returnToStock`), `status`, `isDemo`, `createdAt`

11. **`purchases` & `purchaseItems`**:
    - Purchase orders with suppliers, items, total cost, and receipt status.

12. **`expenses` & `expenseCategories`**:
    - Operating expenses with category, description, date, and payment method.

13. **`inventoryMovements`**:
    - Complete traceability record: `productId`, `productName`, `type` (`purchase` | `sale` | `adjustment` | `return` | `damaged` | `lost` | `initial`), `quantity`, `previousQuantity`, `newQuantity`, `reason`, `referenceId`, `referenceType`, `createdAt`.

14. **`cashRegisterSessions`**:
    - Cash drawer opening/closing sessions, expected vs actual cash balances.

15. **`appSettings`**:
    - Key-value store configuration.

---

## 2. Transaction Integrity Rules

- **Sale Completion**: Must execute in a single read-write atomic transaction:
  1. Record `Sale`
  2. Record `SaleItem` rows
  3. Record `Payment`
  4. Deduct `Product.quantity`
  5. Insert `InventoryMovement` rows
  6. Update `Customer.totalPurchases`
- **Sale Refund**:
  1. Update `Sale.status = 'refunded'`
  2. Record `Refund`
  3. Re-increment `Product.quantity`
  4. Insert compensatory `InventoryMovement` rows
