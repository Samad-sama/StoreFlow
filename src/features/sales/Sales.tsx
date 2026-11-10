import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Sale, SaleItem } from '@/database/schema';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency, generateId } from '@/lib/utils';
import { printInvoice } from '@/lib/invoicePrinter';
import {
  Receipt,
  Search,
  Eye,
  RotateCcw,
  Printer,
  X,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  FileText,
} from 'lucide-react';

export const Sales: React.FC = () => {
  const { t, i18n } = useTranslation(['common', 'nav']);
  const { storeName, storePhone, storeAddress, currency, currencyLocale, language } = useAppStore();
  const isArabic = i18n.language === 'ar';

  const sales = useLiveQuery(() => db.sales.orderBy('createdAt').reverse().toArray()) ?? [];
  const saleItems = useLiveQuery(() => db.saleItems.toArray()) ?? [];

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'refunded' | 'cancelled'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'debt' | 'partial'>('all');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        s.saleNumber.toLowerCase().includes(search.toLowerCase()) ||
        s.customerName.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'all' || s.status === statusFilter;

      let matchPayment = true;
      const isFullPaid = s.paidAmount >= s.totalAmount;
      const isFullDebt = s.paidAmount === 0;
      const isPartialDebt = s.paidAmount > 0 && s.paidAmount < s.totalAmount;

      if (paymentFilter === 'paid') matchPayment = isFullPaid;
      else if (paymentFilter === 'debt') matchPayment = isFullDebt;
      else if (paymentFilter === 'partial') matchPayment = isPartialDebt;

      return matchSearch && matchStatus && matchPayment;
    });
  }, [sales, search, statusFilter, paymentFilter]);

  const currentItems = useMemo(() => {
    if (!selectedSale) return [];
    return saleItems.filter((item) => item.saleId === selectedSale.id);
  }, [selectedSale, saleItems]);

  const viewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailsOpen(true);
  };

  const handleRefund = async (sale: Sale) => {
    const confirmMsg = isArabic
      ? `هل أنت متأكد من استرجاع الفاتورة #${sale.saleNumber} وإعادة الكميات للمخزون؟`
      : `Are you sure you want to refund invoice #${sale.saleNumber} and restore inventory?`;

    if (!confirm(confirmMsg)) return;

    const now = new Date().toISOString();
    const items = saleItems.filter((i) => i.saleId === sale.id);

    await db.transaction('rw', [db.sales, db.products, db.inventoryMovements, db.refunds, db.customers, db.payments], async () => {
      // 1. Mark sale as refunded
      await db.sales.update(sale.id, {
        status: 'refunded',
        updatedAt: now,
      });

      // 2. Adjust customer debt and total purchases if customer was linked
      if (sale.customerId) {
        const cust = await db.customers.get(sale.customerId);
        if (cust) {
          const unpaidDebt = Math.max(0, sale.totalAmount - sale.paidAmount);
          const newDebt = Math.max(0, cust.outstandingBalance - unpaidDebt);
          const newTotalPurchases = Math.max(0, cust.totalPurchases - sale.totalAmount);
          await db.customers.update(sale.customerId, {
            outstandingBalance: newDebt,
            totalPurchases: newTotalPurchases,
            updatedAt: now,
          });
        }
      }

      // 3. Record Refund
      await db.refunds.add({
        id: generateId(),
        saleId: sale.id,
        amount: sale.totalAmount,
        reason: isArabic ? 'استرجاع كامل للفاتورة وإرجاع الأصناف للمخزون' : 'Full invoice refund & stock return',
        items: items.map((i) => ({ saleItemId: i.id, quantity: i.quantity, returnToStock: true })),
        status: 'completed',
        isDemo: false,
        createdAt: now,
      });

      // 4. Return products to inventory
      for (const item of items) {
        const prod = await db.products.get(item.productId);
        if (prod) {
          const oldQty = prod.quantity;
          const newQty = oldQty + item.quantity;

          await db.products.update(item.productId, {
            quantity: newQty,
            updatedAt: now,
          });

          await db.inventoryMovements.add({
            id: generateId(),
            productId: item.productId,
            variantId: null,
            productName: item.productName,
            type: 'return',
            quantity: item.quantity,
            previousQuantity: oldQty,
            newQuantity: newQty,
            reason: isArabic ? `استرجاع مبيعات من فاتورة #${sale.saleNumber}` : `Sales return from invoice #${sale.saleNumber}`,
            referenceId: sale.id,
            referenceType: 'refund',
            isDemo: false,
            createdAt: now,
          });
        }
      }
    });

    if (selectedSale && selectedSale.id === sale.id) {
      setSelectedSale({ ...selectedSale, status: 'refunded' });
    }
  };

  // Metrics
  const totalRevenue = useMemo(
    () => sales.filter((s) => s.status === 'completed').reduce((sum, s) => sum + s.totalAmount, 0),
    [sales]
  );
  const totalPaidRevenue = useMemo(
    () => sales.filter((s) => s.status === 'completed').reduce((sum, s) => sum + s.paidAmount, 0),
    [sales]
  );
  const totalDebtFromSales = useMemo(
    () => sales.filter((s) => s.status === 'completed').reduce((sum, s) => sum + Math.max(0, s.totalAmount - s.paidAmount), 0),
    [sales]
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Receipt className="text-primary w-8 h-8" />
            <span>{t('nav:sales')}</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            {isArabic
              ? `سجل المبيعات، الفواتير، الديون والاسترجاع (${filteredSales.length} فاتورة)`
              : `Sales journal, invoices, credit ledger, and refunds (${filteredSales.length} invoices)`}
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="apple-card p-5 border border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {isArabic ? 'إجمالي المبيعات' : 'Total Sales'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Receipt size={16} />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">
            {formatCurrency(totalRevenue, currency, currencyLocale)}
          </div>
          <span className="text-xs text-muted-foreground mt-1 block font-medium">
            {isArabic ? `${sales.length} فاتورة مسجلة` : `${sales.length} total invoices`}
          </span>
        </div>

        <div className="apple-card p-5 border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              {isArabic ? 'المدفوعات المحصلة' : 'Collected Payments'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(totalPaidRevenue, currency, currencyLocale)}
          </div>
          <span className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1 block font-medium">
            {isArabic ? 'السيولة المستلمة فعلياً' : 'Cash & cards received'}
          </span>
        </div>

        <div className="apple-card p-5 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              {isArabic ? 'مبيعات على الحساب (دَين)' : 'Sales On Credit (Debt)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
            {formatCurrency(totalDebtFromSales, currency, currencyLocale)}
          </div>
          <span className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1 block font-medium">
            {isArabic ? 'متبقي مستحق على العملاء' : 'Remaining balance owed'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="apple-card p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between border border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl flex-1 max-w-md focus-within:border-primary focus-within:bg-card transition-all">
          <Search size={18} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isArabic
                ? 'البحث برقم الفاتورة أو اسم العميل...'
                : 'Search by invoice number or customer name...'
            }
            className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground font-medium"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-11 px-4 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-foreground text-xs font-bold rounded-2xl outline-none cursor-pointer"
          >
            <option value="all" className="bg-card">
              {isArabic ? 'جميع الحالات' : 'All Statuses'}
            </option>
            <option value="completed" className="bg-card">
              {isArabic ? 'مكتملة' : 'Completed'}
            </option>
            <option value="refunded" className="bg-card">
              {isArabic ? 'مسترجعة' : 'Refunded'}
            </option>
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as any)}
            className="h-11 px-4 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-foreground text-xs font-bold rounded-2xl outline-none cursor-pointer"
          >
            <option value="all" className="bg-card">
              {isArabic ? 'جميع طرق السداد' : 'All Payment Types'}
            </option>
            <option value="paid" className="bg-card">
              {isArabic ? 'مدفوعة بالكامل' : 'Paid in Full'}
            </option>
            <option value="debt" className="bg-card">
              {isArabic ? 'على الحساب (دَين كامل)' : 'Full Debt'}
            </option>
            <option value="partial" className="bg-card">
              {isArabic ? 'دفع جزئي + دَين' : 'Partial Payment'}
            </option>
          </select>
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="apple-card overflow-hidden border border-black/[0.06] dark:border-white/[0.08]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start">
            <thead className="bg-black/[0.02] dark:bg-white/[0.02] text-muted-foreground text-xs font-extrabold uppercase tracking-wider border-b border-black/[0.05] dark:border-white/[0.06]">
              <tr>
                <th className="py-4 px-5 text-start">{isArabic ? 'رقم الفاتورة' : 'Invoice #'}</th>
                <th className="py-4 px-5 text-start">{isArabic ? 'العميل' : 'Customer'}</th>
                <th className="py-4 px-5 text-start">{isArabic ? 'التاريخ والوقت' : 'Date & Time'}</th>
                <th className="py-4 px-5 text-start">{isArabic ? 'إجمالي الفاتورة' : 'Total Amount'}</th>
                <th className="py-4 px-5 text-start">{isArabic ? 'حالة السداد' : 'Payment Status'}</th>
                <th className="py-4 px-5 text-start">{isArabic ? 'حالة الطلب' : 'Status'}</th>
                <th className="py-4 px-5 text-center">{isArabic ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05] tabular-nums font-medium">
              {filteredSales.map((sale) => {
                const remainingDebt = Math.max(0, sale.totalAmount - sale.paidAmount);
                const isFullPaid = remainingDebt === 0;
                const isFullDebt = sale.paidAmount === 0;

                return (
                  <tr
                    key={sale.id}
                    className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 px-5 font-mono font-bold text-foreground">
                      {sale.saleNumber}
                    </td>
                    <td className="py-4 px-5 font-bold text-foreground">
                      {sale.customerName}
                    </td>
                    <td className="py-4 px-5 text-xs text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleString(isArabic ? 'ar-DZ' : 'en-US')}
                    </td>
                    <td className="py-4 px-5 font-black text-foreground text-base">
                      {formatCurrency(sale.totalAmount, currency, currencyLocale)}
                    </td>
                    <td className="py-4 px-5">
                      {isFullPaid ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={13} />
                          <span>{isArabic ? 'مدفوعة بالكامل' : 'Paid in Full'}</span>
                        </span>
                      ) : isFullDebt ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          <AlertCircle size={13} />
                          <span>{isArabic ? 'على الحساب (دَين)' : 'On Credit (Debt)'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          <span>{isArabic ? 'جزئي - باقي:' : 'Partial - Rem:'}</span>
                          <span className="font-black">
                            {formatCurrency(remainingDebt, currency, currencyLocale)}
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
                          sale.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : sale.status === 'refunded'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}
                      >
                        {sale.status === 'completed'
                          ? isArabic
                            ? 'مكتملة'
                            : 'Completed'
                          : sale.status === 'refunded'
                          ? isArabic
                            ? 'مسترجعة'
                            : 'Refunded'
                          : isArabic
                          ? 'ملغاة'
                          : 'Cancelled'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => viewDetails(sale)}
                          className="p-2 rounded-xl text-muted-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.08] hover:text-foreground cursor-pointer transition-colors"
                          title={isArabic ? 'عرض الفاتورة' : 'View invoice'}
                        >
                          <Eye size={16} />
                        </button>
                        {sale.status === 'completed' && (
                          <button
                            onClick={() => handleRefund(sale)}
                            className="p-2 rounded-xl text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 cursor-pointer transition-colors"
                            title={isArabic ? 'استرجاع الفاتورة' : 'Refund invoice'}
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground text-sm font-medium">
                    {isArabic ? 'لا توجد فواتير مبيعات مسجلة' : 'No sales invoices recorded'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Details Modal / Invoice Preview */}
      {isDetailsOpen && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-sm">
            <div className="p-5 border-b border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground tracking-tight">
                  {isArabic ? `فاتورة مبيعات #${selectedSale.saleNumber}` : `Sales Invoice #${selectedSale.saleNumber}`}
                </h2>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {new Date(selectedSale.createdAt).toLocaleString(isArabic ? 'ar-DZ' : 'en-US')}
                </p>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3 p-4 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl border border-black/[0.05] dark:border-white/[0.06]">
                <div>
                  <span className="text-muted-foreground block text-xs font-medium">
                    {isArabic ? 'العميل' : 'Customer'}:
                  </span>
                  <span className="font-extrabold text-foreground text-sm">{selectedSale.customerName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs font-medium">
                    {isArabic ? 'الحالة' : 'Status'}:
                  </span>
                  <span
                    className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedSale.status === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {selectedSale.status === 'completed'
                      ? isArabic
                        ? 'مكتملة'
                        : 'Completed'
                      : isArabic
                      ? 'مسترجعة'
                      : 'Refunded'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-bold text-foreground mb-2 text-xs uppercase tracking-wider">
                  {isArabic ? 'عناصر الفاتورة' : 'Invoice Items'}:
                </h4>
                <div className="border border-black/[0.06] dark:border-white/[0.08] rounded-2xl overflow-hidden">
                  <table className="w-full text-start text-xs">
                    <thead className="bg-black/[0.02] dark:bg-white/[0.02] text-muted-foreground font-extrabold border-b border-black/[0.05] dark:border-white/[0.06] text-[11px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3 text-start">{isArabic ? 'المنتج' : 'Item'}</th>
                        <th className="py-2.5 px-3 text-start">{isArabic ? 'الكمية' : 'Qty'}</th>
                        <th className="py-2.5 px-3 text-start">{isArabic ? 'السعر' : 'Price'}</th>
                        <th className="py-2.5 px-3 text-start">{isArabic ? 'الإجمالي' : 'Total'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05] tabular-nums font-medium">
                      {currentItems.map((item) => (
                        <tr key={item.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                          <td className="py-3 px-3 font-bold text-foreground">{item.productName}</td>
                          <td className="py-3 px-3">{item.quantity}</td>
                          <td className="py-3 px-3">
                            {formatCurrency(item.unitPrice, currency, currencyLocale)}
                          </td>
                          <td className="py-3 px-3 font-black text-foreground">
                            {formatCurrency(item.totalAmount, currency, currencyLocale)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-4 bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl space-y-2 tabular-nums text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isArabic ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                  <span className="font-bold text-foreground">
                    {formatCurrency(selectedSale.subtotal, currency, currencyLocale)}
                  </span>
                </div>
                {selectedSale.discountAmount > 0 && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400">
                    <span>{isArabic ? 'الخصم:' : 'Discount:'}</span>
                    <span>-{formatCurrency(selectedSale.discountAmount, currency, currencyLocale)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isArabic ? 'الضريبة:' : 'Tax:'}</span>
                  <span className="font-bold text-foreground">
                    {formatCurrency(selectedSale.taxAmount, currency, currencyLocale)}
                  </span>
                </div>
                <div className="pt-2 border-t border-black/[0.05] dark:border-white/[0.06] flex justify-between font-bold text-sm text-foreground">
                  <span>{isArabic ? 'المبلغ الإجمالي:' : 'Total Amount:'}</span>
                  <span className="text-primary font-black text-base">
                    {formatCurrency(selectedSale.totalAmount, currency, currencyLocale)}
                  </span>
                </div>

                {/* Paid vs Remaining Debt */}
                <div className="pt-2 border-t border-black/[0.05] dark:border-white/[0.06] space-y-1.5">
                  <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                    <span>{isArabic ? 'المبلغ المدفوع:' : 'Paid Amount:'}</span>
                    <span>{formatCurrency(selectedSale.paidAmount, currency, currencyLocale)}</span>
                  </div>
                  {selectedSale.totalAmount > selectedSale.paidAmount && (
                    <div className="flex justify-between font-black text-amber-600 dark:text-amber-400">
                      <span>{isArabic ? 'المتبقي كدَين:' : 'Remaining Debt:'}</span>
                      <span>
                        {formatCurrency(selectedSale.totalAmount - selectedSale.paidAmount, currency, currencyLocale)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!selectedSale) return;
                    printInvoice({
                      storeName: storeName || 'StoreFlow',
                      storePhone,
                      storeAddress,
                      saleNumber: selectedSale.saleNumber,
                      date: new Date(selectedSale.createdAt).toLocaleString(isArabic ? 'ar-DZ' : 'fr-FR'),
                      customerName: selectedSale.customerName,
                      items: currentItems.map((it) => ({
                        name: it.productName,
                        quantity: it.quantity,
                        unitPrice: it.unitPrice,
                        totalAmount: it.totalAmount,
                      })),
                      subtotal: selectedSale.subtotal,
                      discountAmount: selectedSale.discountAmount,
                      taxAmount: selectedSale.taxAmount,
                      totalAmount: selectedSale.totalAmount,
                      paidAmount: selectedSale.paidAmount,
                      remainingDebt: Math.max(0, selectedSale.totalAmount - selectedSale.paidAmount),
                      changeDue: selectedSale.changeAmount,
                      format: 'thermal',
                      language: (language as any) || 'ar',
                    });
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] text-foreground font-bold text-xs cursor-pointer"
                >
                  <Printer size={15} />
                  <span>{isArabic ? 'وصل حراري' : 'Thermal'}</span>
                </button>
                <button
                  onClick={() => {
                    if (!selectedSale) return;
                    printInvoice({
                      storeName: storeName || 'StoreFlow',
                      storePhone,
                      storeAddress,
                      saleNumber: selectedSale.saleNumber,
                      date: new Date(selectedSale.createdAt).toLocaleString(isArabic ? 'ar-DZ' : 'fr-FR'),
                      customerName: selectedSale.customerName,
                      items: currentItems.map((it) => ({
                        name: it.productName,
                        quantity: it.quantity,
                        unitPrice: it.unitPrice,
                        totalAmount: it.totalAmount,
                      })),
                      subtotal: selectedSale.subtotal,
                      discountAmount: selectedSale.discountAmount,
                      taxAmount: selectedSale.taxAmount,
                      totalAmount: selectedSale.totalAmount,
                      paidAmount: selectedSale.paidAmount,
                      remainingDebt: Math.max(0, selectedSale.totalAmount - selectedSale.paidAmount),
                      changeDue: selectedSale.changeAmount,
                      format: 'a4',
                      language: (language as any) || 'ar',
                    });
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] text-foreground font-bold text-xs cursor-pointer"
                >
                  <FileText size={15} />
                  <span>{isArabic ? 'فاتورة A4' : 'Facture A4'}</span>
                </button>
              </div>

              <button
                onClick={() => setIsDetailsOpen(false)}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-2xl text-xs font-bold hover:bg-primary/90 shadow-md shadow-primary/20 cursor-pointer"
              >
                {isArabic ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
