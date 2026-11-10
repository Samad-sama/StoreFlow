import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Product, Customer } from '@/database/schema';
import { useAppStore } from '@/stores/appStore';
import { usePOSStore, CartItem, POSPaymentMode } from '@/stores/posStore';
import { formatCurrency, formatNumber, generateId, safeDecimal } from '@/lib/utils';
import { printInvoice } from '@/lib/invoicePrinter';
import {
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Percent,
  CheckCircle2,
  X,
  UserPlus,
  Printer,
  FileText,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  ShoppingCart,
  DollarSign,
  AlertCircle,
  Tag,
  ArrowRight,
  ShieldCheck,
  Edit2,
  Clock,
} from 'lucide-react';

export const POS: React.FC = () => {
  const { t, i18n } = useTranslation(['common', 'nav']);
  const isArabic = i18n.language === 'ar';
  const {
    storeName,
    storePhone,
    storeAddress,
    currency,
    currencyLocale,
    enableTax,
    setEnableTax,
    taxRate,
    language,
  } = useAppStore();

  // Persistent POS store
  const {
    cart,
    selectedCustomerId,
    cartDiscount,
    cartDiscountType,
    paymentMode,
    receivedInput,
    partialPaidInput,
    heldOrders,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateUnitPrice,
    setSelectedCustomerId,
    setCartDiscount,
    setPaymentMode,
    setReceivedInput,
    setPartialPaidInput,
    clearCart,
    holdOrder,
    resumeOrder,
    deleteHeldOrder,
  } = usePOSStore();

  // Dexie live queries
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const customers = useLiveQuery(() => db.customers.toArray()) ?? [];

  // Local UI states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isHeldOrdersOpen, setIsHeldOrdersOpen] = useState(false);
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [editingPriceProductId, setEditingPriceProductId] = useState<string | null>(null);
  const [customPriceInput, setCustomPriceInput] = useState<string>('');

  // Quick Customer Form
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Last Completed Sale for printing
  const [completedSale, setCompletedSale] = useState<any>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Selected customer object
  const currentCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  // Filtered Products Catalog
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search);
      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const isAvailable = p.status === 'active';
      return matchSearch && matchCat && isAvailable;
    });
  }, [products, search, selectedCategory]);

  // Barcode quick scan handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    const matched = products.find(
      (p) =>
        p.barcode === search.trim() ||
        p.sku.toLowerCase() === search.trim().toLowerCase()
    );

    if (matched) {
      addToCart(matched);
      setSearch('');
    }
  };

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (cartDiscount <= 0) return 0;
    if (cartDiscountType === 'percentage') {
      return safeDecimal(subtotal * (cartDiscount / 100));
    }
    return safeDecimal(Math.min(cartDiscount, subtotal));
  }, [subtotal, cartDiscount, cartDiscountType]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  // Strict tax calculation: 0 if enableTax is false or taxRate <= 0
  const effectiveTaxRate = enableTax && taxRate > 0 ? taxRate : 0;
  const taxAmount = useMemo(() => {
    if (effectiveTaxRate <= 0) return 0;
    return safeDecimal(taxableAmount * (effectiveTaxRate / 100));
  }, [taxableAmount, effectiveTaxRate]);

  const totalAmount = useMemo(() => {
    return safeDecimal(taxableAmount + taxAmount);
  }, [taxableAmount, taxAmount]);

  // Payment Breakdown
  const { actualPaid, changeDue, debtAdded } = useMemo(() => {
    if (paymentMode === 'full_cash') {
      const rec = receivedInput === '' ? totalAmount : parseFloat(receivedInput) || 0;
      if (rec >= totalAmount) {
        return { actualPaid: totalAmount, changeDue: safeDecimal(rec - totalAmount), debtAdded: 0 };
      } else {
        return { actualPaid: rec, changeDue: 0, debtAdded: safeDecimal(totalAmount - rec) };
      }
    } else if (paymentMode === 'full_card' || paymentMode === 'full_transfer') {
      return { actualPaid: totalAmount, changeDue: 0, debtAdded: 0 };
    } else if (paymentMode === 'full_debt') {
      return { actualPaid: 0, changeDue: 0, debtAdded: totalAmount };
    } else if (paymentMode === 'partial_debt') {
      const p = parseFloat(partialPaidInput) || 0;
      const validPaid = Math.min(totalAmount, Math.max(0, p));
      return { actualPaid: validPaid, changeDue: 0, debtAdded: safeDecimal(totalAmount - validPaid) };
    }
    return { actualPaid: totalAmount, changeDue: 0, debtAdded: 0 };
  }, [paymentMode, receivedInput, partialPaidInput, totalAmount]);

  // Start editing line item price
  const startEditPrice = (item: CartItem) => {
    setEditingPriceProductId(item.product.id);
    setCustomPriceInput(item.unitPrice.toString());
  };

  const applyCustomPrice = (productId: string) => {
    const p = parseFloat(customPriceInput);
    if (!isNaN(p) && p >= 0) {
      updateUnitPrice(productId, p);
    }
    setEditingPriceProductId(null);
  };

  // Quick Customer Creation
  const handleQuickCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newId = generateId();
    const now = new Date().toISOString();

    await db.customers.add({
      id: newId,
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      email: '',
      address: newCustAddress.trim(),
      notes: isArabic ? 'عميل تم إنشاؤه من شاشة البيع' : 'Created from POS',
      totalPurchases: 0,
      outstandingBalance: 0,
      credit: 0,
      status: 'active',
      isDemo: false,
      createdAt: now,
      updatedAt: now,
    });

    setSelectedCustomerId(newId);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setIsQuickCustomerOpen(false);
  };

  // Finalize Sale Transaction
  const handleConfirmCheckout = async () => {
    if (cart.length === 0) return;

    if (debtAdded > 0 && !selectedCustomerId) {
      alert(
        isArabic
          ? 'يرجى اختيار عميل مسجل لتسجيل المتبقي كدَين في ذمته.'
          : 'Please select a registered customer to record unpaid debt.'
      );
      return;
    }

    const saleId = generateId();
    const saleNumber = `INV-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const custName = currentCustomer ? currentCustomer.name : (isArabic ? 'عميل كاش عادي' : 'Cash Customer');

    const saleItemsData = cart.map((item) => ({
      id: generateId(),
      saleId,
      productId: item.product.id,
      variantId: null,
      productName: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      purchasePrice: item.product.purchasePrice || 0,
      discount: item.discount,
      discountType: item.discountType,
      taxRate: effectiveTaxRate,
      taxAmount: effectiveTaxRate > 0 ? safeDecimal(item.unitPrice * (effectiveTaxRate / 100)) : 0,
      totalAmount: safeDecimal(item.unitPrice * item.quantity),
      createdAt: now,
    }));

    await db.transaction(
      'rw',
      [db.sales, db.saleItems, db.payments, db.inventoryMovements, db.products, db.customers],
      async () => {
        // 1. Insert Sale Record
        await db.sales.add({
          id: saleId,
          saleNumber,
          customerId: selectedCustomerId || null,
          customerName: custName,
          employeeId: null,
          subtotal,
          discountAmount,
          taxAmount,
          totalAmount,
          paidAmount: actualPaid,
          changeAmount: changeDue,
          status: 'completed',
          notes: debtAdded > 0 ? (isArabic ? `دَين مسجل: ${formatCurrency(debtAdded, currency, currencyLocale)}` : `Debt: ${debtAdded} DA`) : '',
          isDemo: false,
          createdAt: now,
          updatedAt: now,
        });

        // 2. Insert Sale Items
        await db.saleItems.bulkAdd(saleItemsData);

        // 3. Insert Payment Record
        if (actualPaid > 0) {
          const method =
            paymentMode === 'full_card'
              ? 'card'
              : paymentMode === 'full_transfer'
              ? 'bank_transfer'
              : 'cash';

          await db.payments.add({
            id: generateId(),
            saleId,
            purchaseId: null,
            type: 'sale',
            method,
            amount: actualPaid,
            reference: `PAY-${saleNumber}`,
            notes: isArabic ? 'دفعة فاتورة مبيعات' : 'Sales payment',
            isDemo: false,
            createdAt: now,
          });
        }

        // 4. Update Inventory
        for (const item of cart) {
          const prod = await db.products.get(item.product.id);
          if (prod) {
            const oldQty = prod.quantity;
            const newQty = Math.max(0, oldQty - item.quantity);

            await db.products.update(item.product.id, {
              quantity: newQty,
              updatedAt: now,
            });

            await db.inventoryMovements.add({
              id: generateId(),
              productId: item.product.id,
              variantId: null,
              productName: item.product.name,
              type: 'sale',
              quantity: -item.quantity,
              previousQuantity: oldQty,
              newQuantity: newQty,
              reason: isArabic ? `بيع فاتورة #${saleNumber}` : `Sale invoice #${saleNumber}`,
              referenceId: saleId,
              referenceType: 'sale',
              isDemo: false,
              createdAt: now,
            });
          }
        }

        // 5. Update Customer Total Purchases & Outstanding Debt
        if (selectedCustomerId && currentCustomer) {
          const newDebt = currentCustomer.outstandingBalance + debtAdded;
          const newTotalPurchases = (currentCustomer.totalPurchases || 0) + totalAmount;

          await db.customers.update(selectedCustomerId, {
            outstandingBalance: newDebt,
            totalPurchases: newTotalPurchases,
            updatedAt: now,
          });
        }
      }
    );

    // Prepare print payload
    const finalCustDebt = currentCustomer
      ? currentCustomer.outstandingBalance + debtAdded
      : 0;

    const printPayload = {
      storeName: storeName || 'StoreFlow',
      storePhone: storePhone || '0550 00 00 00',
      storeAddress: storeAddress || (isArabic ? 'الجزائر العاصمة' : 'Alger'),
      saleNumber,
      date: new Date().toLocaleString(isArabic ? 'ar-DZ' : 'fr-FR'),
      customerName: custName,
      customerPhone: currentCustomer?.phone,
      customerAddress: currentCustomer?.address,
      items: cart.map((it) => ({
        name: it.product.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalAmount: it.unitPrice * it.quantity,
        unit: it.product.unit || (isArabic ? 'قطعة' : 'Pcs'),
      })),
      subtotal,
      discountAmount,
      taxAmount,
      taxRate: effectiveTaxRate,
      totalAmount,
      paidAmount: actualPaid,
      remainingDebt: debtAdded,
      customerTotalDebt: finalCustDebt,
      changeDue,
      language: (language as any) || 'ar',
    };

    setCompletedSale(printPayload);
    setIsCheckoutOpen(false);
    setIsReceiptOpen(true);
    clearCart();
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-5rem)] gap-4 animate-fade-in">
      {/* LEFT: Products Catalog and Quick Search */}
      <div className="flex-1 flex flex-col apple-card overflow-hidden border border-black/[0.06] dark:border-white/[0.08]">
        {/* Search Bar & Barcode Scanner */}
        <div className="p-4 border-b border-black/[0.05] dark:border-white/[0.06] flex items-center gap-3">
          <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
            <Search
              size={18}
              className="absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground stroke-[2.2]"
            />
            <input
              ref={barcodeInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isArabic
                  ? 'امسح الباركود أو ابحث باسم السلعة، رمز SKU...'
                  : 'Scan barcode or search product name, SKU...'
              }
              className="w-full h-12 ps-10 pe-10 bg-black/[0.025] dark:bg-white/[0.035] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/25 focus:bg-card transition-all"
              autoFocus
            />
            <Barcode
              size={18}
              className="absolute end-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60"
            />
          </form>

          {/* Held Orders Quick Badge */}
          {heldOrders.length > 0 && (
            <button
              onClick={() => setIsHeldOrdersOpen(true)}
              className="h-12 px-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-2 hover:bg-amber-500/20 cursor-pointer transition-all"
            >
              <Clock size={16} />
              <span>{heldOrders.length} {isArabic ? 'طلبات معلقة' : 'Held'}</span>
            </button>
          )}
        </div>

        {/* Categories Bar */}
        <div className="px-4 py-2.5 border-b border-black/[0.05] dark:border-white/[0.06] flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-black/[0.03] dark:bg-white/[0.04] text-muted-foreground hover:text-foreground'
            }`}
          >
            {isArabic ? 'جميع الفئات' : 'All Categories'}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-black/[0.03] dark:bg-white/[0.04] text-muted-foreground hover:text-foreground'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.quantity <= 0;
            return (
              <div
                key={p.id}
                onClick={() => !isOutOfStock && addToCart(p)}
                className={`p-4 rounded-2xl border flex flex-col justify-between transition-all select-none ${
                  isOutOfStock
                    ? 'opacity-40 border-dashed border-red-500/30 bg-red-500/5 cursor-not-allowed'
                    : 'border-black/[0.05] dark:border-white/[0.06] bg-card hover:border-primary/50 hover:shadow-md active:scale-[0.98] cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <span className="text-[11px] font-mono font-bold text-muted-foreground">
                      {p.sku}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOutOfStock
                          ? 'bg-red-500/15 text-red-600'
                          : p.quantity <= p.minimumStock
                          ? 'bg-amber-500/15 text-amber-600'
                          : 'bg-emerald-500/15 text-emerald-600'
                      }`}
                    >
                      {p.quantity} {p.unit || (isArabic ? 'قطعة' : 'Pcs')}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-foreground leading-snug line-clamp-2">
                    {p.name}
                  </h4>
                </div>

                <div className="mt-3 pt-2.5 border-t border-black/[0.04] dark:border-white/[0.05] flex items-center justify-between">
                  <span className="text-base font-black text-primary tabular-nums">
                    {formatCurrency(p.sellingPrice, currency, currencyLocale)}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Plus size={16} />
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              <ShoppingBag size={40} className="mx-auto text-muted-foreground/40 mb-2" />
              <p className="font-bold text-sm text-foreground">
                {isArabic ? 'لا توجد منتجات متطابقة' : 'No products found'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: POS CART & BILLING PANEL */}
      <div className="w-full lg:w-[420px] flex flex-col apple-card overflow-hidden border border-black/[0.06] dark:border-white/[0.08]">
        {/* Customer Selector & Quick Add */}
        <div className="p-3.5 border-b border-black/[0.05] dark:border-white/[0.06] bg-black/[0.015] dark:bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="flex-1 h-11 px-3 bg-card border border-black/[0.08] dark:border-white/[0.1] rounded-2xl text-xs font-bold text-foreground outline-none cursor-pointer"
            >
              <option value="">{isArabic ? '👤 عميل كاش عادي (افتراضي)' : '👤 Regular Cash Customer'}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.outstandingBalance > 0 ? `(دين: ${formatCurrency(c.outstandingBalance, currency, currencyLocale)})` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsQuickCustomerOpen(true)}
              className="h-11 px-3 bg-card hover:bg-black/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl text-primary font-bold text-xs flex items-center gap-1 cursor-pointer"
              title={isArabic ? 'إضافة عميل جديد' : 'New Customer'}
            >
              <UserPlus size={16} />
            </button>
          </div>

          {/* Customer Debt Badge if has debt */}
          {currentCustomer && currentCustomer.outstandingBalance > 0 && (
            <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between text-amber-700 dark:text-amber-400 font-bold">
              <span>{isArabic ? 'رصيد الديون السابقة للعميل:' : 'Previous Customer Debt:'}</span>
              <span className="tabular-nums">
                {formatCurrency(currentCustomer.outstandingBalance, currency, currencyLocale)}
              </span>
            </div>
          )}
        </div>

        {/* Cart Items List with Price Override */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-bold text-foreground leading-tight line-clamp-1">
                  {item.product.name}
                </span>
                <span className="text-sm font-black text-foreground shrink-0 tabular-nums">
                  {formatCurrency(item.unitPrice * item.quantity, currency, currencyLocale)}
                </span>
              </div>

              {/* Price adjustment row */}
              <div className="flex items-center justify-between text-xs pt-1">
                {editingPriceProductId === item.product.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={customPriceInput}
                      onChange={(e) => setCustomPriceInput(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-20 h-8 px-2 rounded-xl bg-card border-2 border-primary text-xs font-black tabular-nums outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => applyCustomPrice(item.product.id)}
                      className="px-2 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-bold cursor-pointer"
                    >
                      {t('common:save')}
                    </button>
                    <button
                      onClick={() => setEditingPriceProductId(null)}
                      className="px-2 py-1 text-muted-foreground text-xs cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditPrice(item)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary font-bold cursor-pointer p-1 rounded-lg hover:bg-primary/10 transition-colors"
                    title={isArabic ? 'انقر لتخفيض أو تعديل السعر' : 'Click to discount or edit price'}
                  >
                    <span>{formatCurrency(item.unitPrice, currency, currencyLocale)}</span>
                    <Edit2 size={12} className="opacity-60" />
                    {item.unitPrice < item.originalPrice && (
                      <span className="text-[10px] text-emerald-600 bg-emerald-500/15 px-1.5 py-0.2 rounded-md font-extrabold">
                        {isArabic ? 'مخفض' : 'Discounted'}
                      </span>
                    )}
                  </button>
                )}

                {/* Quantity Stepper */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-8 h-8 rounded-xl bg-card hover:bg-black/[0.05] border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center font-bold text-foreground cursor-pointer shadow-xs"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-7 text-center font-black text-sm tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-8 h-8 rounded-xl bg-card hover:bg-black/[0.05] border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center font-bold text-foreground cursor-pointer shadow-xs"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="ms-1 p-1.5 text-muted-foreground hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <ShoppingCart size={44} className="opacity-20 mb-3 stroke-[1.5]" />
              <p className="text-sm font-bold text-foreground">
                {isArabic ? 'سلة الطلبات فارغة' : 'Cart is empty'}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {isArabic
                  ? 'انقر على المنتجات أو امسح الباركود لإضافتها للطلب'
                  : 'Click items or scan barcodes to add to cart'}
              </p>
            </div>
          )}
        </div>

        {/* Cart Totals, Tax Toggle & Checkout Trigger */}
        <div className="p-4 border-t border-black/[0.05] dark:border-white/[0.06] bg-black/[0.015] dark:bg-white/[0.02] space-y-3">
          <div className="space-y-1.5 text-xs tabular-nums font-semibold">
            <div className="flex justify-between text-muted-foreground">
              <span>{t('common:subtotal')}</span>
              <span className="text-foreground">{formatCurrency(subtotal, currency, currencyLocale)}</span>
            </div>

            {/* Tax with quick enable/disable toggle */}
            <div className="flex items-center justify-between text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span>{isArabic ? 'الضريبة (TVA)' : 'Tax (TVA)'}:</span>
                <button
                  onClick={() => setEnableTax(!enableTax)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold cursor-pointer transition-all ${
                    enableTax && taxRate > 0
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-black/[0.05] dark:bg-white/[0.08] text-muted-foreground'
                  }`}
                  title={isArabic ? 'انقر لتفعيل أو إلغاء الضريبة' : 'Toggle tax'}
                >
                  {enableTax && taxRate > 0 ? `${taxRate}% (${isArabic ? 'مفعلة' : 'ON'})` : (isArabic ? 'معطلة (0%)' : 'OFF')}
                </button>
              </div>
              <span className="text-foreground font-bold">
                {taxAmount > 0 ? formatCurrency(taxAmount, currency, currencyLocale) : isArabic ? '0.00 د.ج' : '0.00 DA'}
              </span>
            </div>

            <div className="pt-2 border-t border-black/[0.05] dark:border-white/[0.06] flex justify-between items-baseline">
              <span className="text-sm font-bold text-foreground">{t('common:total')}</span>
              <span className="text-2xl font-black text-primary">
                {formatCurrency(totalAmount, currency, currencyLocale)}
              </span>
            </div>
          </div>

          {/* Action Buttons: Hold, Clear, Pay */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <button
              disabled={cart.length === 0}
              onClick={() => holdOrder()}
              className="py-3 px-2 bg-black/[0.04] dark:bg-white/[0.06] text-foreground hover:bg-black/[0.07] rounded-2xl text-xs font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
              title={isArabic ? 'تعليق السلة لخدمة عميل آخر' : 'Hold Cart'}
            >
              <Pause size={14} />
              <span>{isArabic ? 'تعليق' : 'Hold'}</span>
            </button>

            <button
              disabled={cart.length === 0}
              onClick={() => {
                if (confirm(isArabic ? 'مسح عناصر السلة بالكامل؟' : 'Clear all items?')) {
                  clearCart();
                }
              }}
              className="py-3 px-2 bg-black/[0.04] dark:bg-white/[0.06] text-red-600 hover:bg-red-500/10 rounded-2xl text-xs font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
              title={isArabic ? 'إلغاء وتفريغ السلة' : 'Clear Cart'}
            >
              <Trash2 size={14} />
              <span>{isArabic ? 'مسح' : 'Clear'}</span>
            </button>

            <button
              disabled={cart.length === 0}
              onClick={() => setIsCheckoutOpen(true)}
              className="col-span-2 py-3 px-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-md shadow-primary/25 disabled:opacity-40 cursor-pointer transition-all"
            >
              <span>{isArabic ? 'دفع / تسجيل الطلب' : 'Pay / Checkout'}</span>
              <ArrowRight size={16} className="rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* CHECKOUT MODAL: Cash, Card, Debt, Partial Debt */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-6 text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/[0.05] dark:border-white/[0.06] pb-3">
              <h2 className="text-lg font-extrabold text-foreground tracking-tight">
                {isArabic ? 'إتمام الدفع واختيار السداد' : 'Checkout & Payment'}
              </h2>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Total Display */}
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center">
              <span className="text-xs font-bold text-muted-foreground block">
                {isArabic ? 'المبلغ الإجمالي المستحق' : 'Total Amount Due'}
              </span>
              <div className="text-3xl font-black text-primary mt-1 tabular-nums">
                {formatCurrency(totalAmount, currency, currencyLocale)}
              </div>
            </div>

            {/* Payment Modes */}
            <div>
              <label className="block text-xs font-bold mb-2 text-foreground">
                {isArabic ? 'طريقة السداد' : 'Payment Mode'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { mode: 'full_cash' as const, label: isArabic ? 'نقداً (كاش)' : 'Full Cash', icon: Banknote },
                  { mode: 'full_card' as const, label: isArabic ? 'بطاقة بنكية' : 'Card', icon: CreditCard },
                  { mode: 'full_debt' as const, label: isArabic ? 'على الحساب (دَين)' : 'On Credit', icon: AlertCircle },
                  { mode: 'partial_debt' as const, label: isArabic ? 'دفع جزئي + دَين' : 'Partial Debt', icon: DollarSign },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMode === m.mode;
                  return (
                    <button
                      key={m.mode}
                      type="button"
                      onClick={() => setPaymentMode(m.mode)}
                      className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 text-center font-extrabold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-black/[0.06] dark:border-white/[0.08] text-muted-foreground hover:bg-black/[0.02]'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-[11px] leading-tight">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Fields: Cash Received or Partial Payment */}
            {paymentMode === 'full_cash' && (
              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">
                  {isArabic ? 'المبلغ المستلم من الزبون' : 'Cash Received'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={receivedInput}
                    onChange={(e) => setReceivedInput(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder={totalAmount.toString()}
                    className="w-full h-12 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border-2 border-primary/40 focus:border-primary text-lg font-black text-foreground tabular-nums outline-none"
                    autoFocus
                  />
                  <span className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground pointer-events-none">
                    {isArabic ? 'د.ج' : 'DA'}
                  </span>
                </div>
                {changeDue > 0 && (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 font-bold flex justify-between">
                    <span>{t('common:changeDue')}:</span>
                    <span className="text-base font-black tabular-nums">
                      {formatCurrency(changeDue, currency, currencyLocale)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {paymentMode === 'partial_debt' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-foreground">
                    {isArabic ? 'المبلغ المدفوع الآن *' : 'Amount Paid Now *'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min={0}
                      max={totalAmount}
                      value={partialPaidInput}
                      onChange={(e) => setPartialPaidInput(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      placeholder="0.00"
                      className="w-full h-12 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border-2 border-primary/40 focus:border-primary text-lg font-black text-foreground tabular-nums outline-none"
                      autoFocus
                    />
                    <span className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground pointer-events-none">
                      {isArabic ? 'د.ج' : 'DA'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex justify-between font-bold text-amber-700 dark:text-amber-400">
                  <span>{isArabic ? 'المتبقي كدَين على العميل:' : 'Remaining Debt:'}</span>
                  <span className="font-black text-sm tabular-nums">
                    {formatCurrency(debtAdded, currency, currencyLocale)}
                  </span>
                </div>
              </div>
            )}

            {paymentMode === 'full_debt' && (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-700 dark:text-amber-400 font-bold text-center">
                <span>{isArabic ? 'سيتم تسجيل كامل الفاتورة كدَين على حساب العميل:' : 'Full invoice recorded as customer debt:'}</span>
                <div className="text-xl font-black mt-1 tabular-nums">
                  {formatCurrency(debtAdded, currency, currencyLocale)}
                </div>
              </div>
            )}

            {/* Confirm Checkout Button */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-black/[0.05]">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="px-5 py-2.5 rounded-2xl font-bold text-xs text-muted-foreground hover:bg-muted cursor-pointer"
              >
                {t('common:cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckout}
                className="px-6 py-3 rounded-2xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25 cursor-pointer"
              >
                {isArabic ? 'تأكيد العملية وإصدار الفاتورة' : 'Confirm & Print Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED SALE RECEIPT / FACTURE MODAL */}
      {isReceiptOpen && completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h3 className="text-xl font-black text-foreground">
                {isArabic ? 'تمت عملية البيع بنجاح!' : 'Sale Completed Successfully!'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isArabic ? `رقم الفاتورة: #${completedSale.saleNumber}` : `Invoice: #${completedSale.saleNumber}`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] text-xs space-y-2 text-start">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isArabic ? 'العميل' : 'Customer'}:</span>
                <span className="font-bold text-foreground">{completedSale.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isArabic ? 'المبلغ الإجمالي' : 'Total'}:</span>
                <span className="font-black text-primary">
                  {formatCurrency(completedSale.totalAmount, currency, currencyLocale)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isArabic ? 'المدفوع' : 'Paid'}:</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(completedSale.paidAmount, currency, currencyLocale)}
                </span>
              </div>
              {completedSale.remainingDebt > 0 && (
                <div className="flex justify-between font-bold text-amber-600 dark:text-amber-400">
                  <span>{isArabic ? 'المتبقي كدَين' : 'Debt Remaining'}:</span>
                  <span>{formatCurrency(completedSale.remainingDebt, currency, currencyLocale)}</span>
                </div>
              )}
            </div>

            {/* Print Format Options */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => printInvoice({ ...completedSale, format: 'thermal' })}
                className="flex items-center justify-center gap-2 py-3 px-3 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] rounded-2xl text-xs font-bold text-foreground cursor-pointer transition-all"
              >
                <Printer size={16} />
                <span>{isArabic ? 'وصل حراري (80mm)' : 'Thermal Receipt'}</span>
              </button>
              <button
                onClick={() => printInvoice({ ...completedSale, format: 'a4' })}
                className="flex items-center justify-center gap-2 py-3 px-3 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] rounded-2xl text-xs font-bold text-foreground cursor-pointer transition-all"
              >
                <FileText size={16} />
                <span>{isArabic ? 'فاتورة رسمية (A4)' : 'Official Facture A4'}</span>
              </button>
            </div>

            <button
              onClick={() => {
                setIsReceiptOpen(false);
                setCompletedSale(null);
              }}
              className="w-full py-3 bg-primary text-primary-foreground rounded-2xl text-xs font-bold hover:bg-primary/90 shadow-md shadow-primary/20 cursor-pointer"
            >
              {isArabic ? 'بدء طلب جديد' : 'Start New Sale'}
            </button>
          </div>
        </div>
      )}

      {/* HELD ORDERS DRAWER */}
      {isHeldOrdersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.05] pb-3">
              <h3 className="text-base font-bold text-foreground">
                {isArabic ? 'الطلبات المعلقة' : 'Held Carts'} ({heldOrders.length})
              </h3>
              <button
                onClick={() => setIsHeldOrdersOpen(false)}
                className="p-1 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {heldOrders.map((ho) => (
                <div
                  key={ho.id}
                  className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-foreground">{ho.name}</h4>
                    <span className="text-[11px] text-muted-foreground">
                      {ho.date} • {ho.cart.length} {isArabic ? 'أصناف' : 'items'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        resumeOrder(ho.id);
                        setIsHeldOrdersOpen(false);
                      }}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs cursor-pointer"
                    >
                      {isArabic ? 'استعادة' : 'Resume'}
                    </button>
                    <button
                      onClick={() => deleteHeldOrder(ho.id)}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-xl cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* QUICK CUSTOMER MODAL */}
      {isQuickCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-sm rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-6 text-xs">
            <div className="flex items-center justify-between border-b border-black/[0.05] pb-3 mb-4">
              <h3 className="text-base font-bold text-foreground">
                {isArabic ? 'إضافة عميل سريعاً' : 'Quick Add Customer'}
              </h3>
              <button
                onClick={() => setIsQuickCustomerOpen(false)}
                className="p-1 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickCustomerSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold mb-1 text-foreground">
                  {isArabic ? 'الاسم الكامل *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder={isArabic ? 'اسم العميل...' : 'Customer name...'}
                  className="w-full h-11 px-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] text-xs font-bold outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-foreground">
                  {isArabic ? 'رقم الهاتف' : 'Phone'}
                </label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="05 / 06 / 07..."
                  className="w-full h-11 px-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] text-xs font-bold tabular-nums outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-foreground">
                  {isArabic ? 'المدينة / العنوان' : 'City / Address'}
                </label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder={isArabic ? 'الجزائر العاصمة، وهران...' : 'City...'}
                  className="w-full h-11 px-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] text-xs font-bold outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.05]">
                <button
                  type="button"
                  onClick={() => setIsQuickCustomerOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-muted-foreground hover:bg-muted cursor-pointer"
                >
                  {t('common:cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs cursor-pointer shadow-xs"
                >
                  {isArabic ? 'حفظ واختيار' : 'Save & Select'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
