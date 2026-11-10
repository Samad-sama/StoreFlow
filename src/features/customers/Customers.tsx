import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Customer, Sale, SaleItem, Payment } from '@/database/schema';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency, generateId } from '@/lib/utils';
import { printInvoice } from '@/lib/invoicePrinter';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Edit,
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Receipt,
  DollarSign,
  Printer,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  History,
  Tag,
  ArrowRight,
} from 'lucide-react';

export const Customers: React.FC = () => {
  const { t, i18n } = useTranslation(['common', 'nav']);
  const { storeName, storePhone, storeAddress, currency, currencyLocale, language } = useAppStore();
  const isArabic = i18n.language === 'ar';

  const customers = useLiveQuery(() => db.customers.toArray()) ?? [];
  const allSales = useLiveQuery(() => db.sales.orderBy('createdAt').reverse().toArray()) ?? [];
  const allSaleItems = useLiveQuery(() => db.saleItems.toArray()) ?? [];
  const allPayments = useLiveQuery(() => db.payments.orderBy('createdAt').reverse().toArray()) ?? [];

  const [search, setSearch] = useState('');
  const [debtFilter, setDebtFilter] = useState<'all' | 'with_debt' | 'debt_free'>('all');

  // Customer Profile & History Drawer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  // Edit Customer Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Direct Edit Debt Modal
  const [isEditDebtModalOpen, setIsEditDebtModalOpen] = useState(false);
  const [newDebtValue, setNewDebtValue] = useState<string>('');

  // Settle Debt Modal State
  const [settleCustomer, setSettleCustomer] = useState<Customer | null>(null);
  const [settleAmount, setSettleAmount] = useState<string>('');
  const [settleMethod, setSettleMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash');
  const [settleNotes, setSettleNotes] = useState('');
  const [settleReceipt, setSettleReceipt] = useState<{
    customerName: string;
    amountPaid: number;
    remainingDebt: number;
    date: string;
    reference: string;
  } | null>(null);

  // Add/Edit Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState<string>('');

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
    setOutstandingBalance('');
    setEditingCustomer(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsEditModalOpen(true);
  };

  const openEditModal = (c: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email);
    setAddress(c.address);
    setNotes(c.notes);
    setOutstandingBalance(c.outstandingBalance > 0 ? c.outstandingBalance.toString() : '');
    setIsEditModalOpen(true);
  };

  const openDirectEditDebt = (c: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCustomer(c);
    setNewDebtValue(c.outstandingBalance > 0 ? c.outstandingBalance.toString() : '');
    setIsEditDebtModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const now = new Date().toISOString();
    const balanceNum = parseFloat(outstandingBalance) || 0;

    if (editingCustomer) {
      await db.customers.update(editingCustomer.id, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        notes: notes.trim(),
        outstandingBalance: balanceNum,
        updatedAt: now,
      });

      if (selectedCustomer && selectedCustomer.id === editingCustomer.id) {
        setSelectedCustomer({
          ...selectedCustomer,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          notes: notes.trim(),
          outstandingBalance: balanceNum,
        });
      }
    } else {
      await db.customers.add({
        id: generateId(),
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        notes: notes.trim(),
        totalPurchases: 0,
        outstandingBalance: balanceNum,
        credit: 0,
        status: 'active',
        isDemo: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    setIsEditModalOpen(false);
    resetForm();
  };

  const handleSaveDebtDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    const val = parseFloat(newDebtValue) || 0;
    const now = new Date().toISOString();

    await db.customers.update(editingCustomer.id, {
      outstandingBalance: Math.max(0, val),
      updatedAt: now,
    });

    if (selectedCustomer && selectedCustomer.id === editingCustomer.id) {
      setSelectedCustomer({
        ...selectedCustomer,
        outstandingBalance: Math.max(0, val),
      });
    }

    setIsEditDebtModalOpen(false);
  };

  const handleDeleteCustomer = async (id: string, customerName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const confirmMsg = isArabic
      ? `هل أنت متأكد من حذف العميل "${customerName}"؟`
      : `Are you sure you want to delete customer "${customerName}"?`;
    if (confirm(confirmMsg)) {
      await db.customers.delete(id);
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null);
      }
    }
  };

  // Open Settle Debt Dialog
  const openSettleDebtModal = (c: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSettleCustomer(c);
    setSettleAmount(c.outstandingBalance > 0 ? c.outstandingBalance.toString() : '');
    setSettleMethod('cash');
    setSettleNotes('');
    setSettleReceipt(null);
  };

  const handleConfirmSettleDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleCustomer) return;

    const paid = parseFloat(settleAmount) || 0;
    if (paid <= 0) return;

    const now = new Date().toISOString();
    const newBalance = Math.max(0, settleCustomer.outstandingBalance - paid);
    const receiptRef = `PAY-${Date.now().toString().slice(-6)}`;

    await db.transaction('rw', [db.customers, db.payments], async () => {
      await db.customers.update(settleCustomer.id, {
        outstandingBalance: newBalance,
        updatedAt: now,
      });

      await db.payments.add({
        id: generateId(),
        saleId: null,
        purchaseId: null,
        type: 'customer_payment',
        method: settleMethod,
        amount: paid,
        reference: receiptRef,
        notes: settleNotes || (isArabic ? 'تسديد دَين عميل' : 'Customer debt settlement'),
        isDemo: false,
        createdAt: now,
      });
    });

    setSettleReceipt({
      customerName: settleCustomer.name,
      amountPaid: paid,
      remainingDebt: newBalance,
      date: new Date().toLocaleString(isArabic ? 'ar-DZ' : 'fr-FR'),
      reference: receiptRef,
    });

    if (selectedCustomer && selectedCustomer.id === settleCustomer.id) {
      setSelectedCustomer({
        ...selectedCustomer,
        outstandingBalance: newBalance,
      });
    }
  };

  // Print Invoice for a specific past sale
  const handlePrintPastSale = (sale: Sale, format: 'thermal' | 'a4') => {
    const items = allSaleItems
      .filter((it) => it.saleId === sale.id)
      .map((it) => ({
        name: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalAmount: it.totalAmount,
      }));

    printInvoice({
      storeName: storeName || 'StoreFlow',
      storePhone,
      storeAddress,
      saleNumber: sale.saleNumber,
      date: new Date(sale.createdAt).toLocaleString(isArabic ? 'ar-DZ' : 'fr-FR'),
      customerName: sale.customerName,
      customerPhone: selectedCustomer?.phone,
      customerAddress: selectedCustomer?.address,
      items,
      subtotal: sale.subtotal,
      discountAmount: sale.discountAmount,
      taxAmount: sale.taxAmount,
      totalAmount: sale.totalAmount,
      paidAmount: sale.paidAmount,
      remainingDebt: Math.max(0, sale.totalAmount - sale.paidAmount),
      customerTotalDebt: selectedCustomer?.outstandingBalance || 0,
      changeDue: sale.changeAmount,
      format,
      language: (language as any) || 'ar',
    });
  };

  // Metrics
  const totalCustomers = customers.length;
  const customersWithDebt = useMemo(() => customers.filter((c) => c.outstandingBalance > 0), [customers]);
  const totalOutstandingDebt = useMemo(
    () => customersWithDebt.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0),
    [customersWithDebt]
  );

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.address.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (debtFilter === 'with_debt') return c.outstandingBalance > 0;
      if (debtFilter === 'debt_free') return c.outstandingBalance <= 0;
      return true;
    });
  }, [customers, search, debtFilter]);

  // Selected customer's sales & payments
  const customerSales = useMemo(() => {
    if (!selectedCustomer) return [];
    return allSales.filter((s) => s.customerId === selectedCustomer.id);
  }, [selectedCustomer, allSales]);

  const customerPayments = useMemo(() => {
    if (!selectedCustomer) return [];
    return allPayments.filter(
      (p) =>
        p.type === 'customer_payment' &&
        (p.notes?.includes(selectedCustomer.name) || p.reference?.includes('PAY-'))
    );
  }, [selectedCustomer, allPayments]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Users className="text-primary w-8 h-8" />
            <span>{t('nav:customers')}</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            {isArabic
              ? 'سجل العملاء، إدارة الحسابات، تتبع المشتريات والديون'
              : 'Customer registry, purchase history and debts tracking'}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:bg-primary/90 shadow-md shadow-primary/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus size={18} />
          <span>{isArabic ? 'إضافة عميل جديد' : 'Add New Customer'}</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="apple-card p-5 border border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {isArabic ? 'إجمالي العملاء' : 'Total Customers'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">
            {totalCustomers}
          </div>
          <span className="text-xs text-muted-foreground mt-1 block">
            {isArabic ? 'عملاء مسجلون بالمتجر' : 'Registered store customers'}
          </span>
        </div>

        <div className="apple-card p-5 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              {t('common:customerDebt')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
            {formatCurrency(totalOutstandingDebt, currency, currencyLocale)}
          </div>
          <span className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1 block font-medium">
            {isArabic
              ? `${customersWithDebt.length} عميل لديهم ديون مستحقة`
              : `${customersWithDebt.length} customers with unpaid debt`}
          </span>
        </div>

        <div className="apple-card p-5 border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              {isArabic ? 'عملاء بدون ديون' : 'Debt-Free Customers'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {totalCustomers - customersWithDebt.length}
          </div>
          <span className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1 block font-medium">
            {isArabic ? 'حساباتهم مسواة بالكامل' : 'Accounts fully cleared'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl w-full md:max-w-md focus-within:border-primary focus-within:bg-card transition-all">
          <Search size={18} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isArabic
                ? 'ابحث باسم العميل، الهاتف، العنوان...'
                : 'Search by customer name, phone, address...'
            }
            className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground font-medium"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Debt Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl border border-black/[0.04] dark:border-white/[0.06] self-start md:self-auto">
          <button
            onClick={() => setDebtFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              debtFilter === 'all'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isArabic ? 'جميع العملاء' : 'All Customers'} ({customers.length})
          </button>
          <button
            onClick={() => setDebtFilter('with_debt')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              debtFilter === 'with_debt'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <span>{t('common:hasDebt')}</span>
            <span className="px-1.5 py-0.2 bg-black/20 rounded-full text-[10px]">
              {customersWithDebt.length}
            </span>
          </button>
          <button
            onClick={() => setDebtFilter('debt_free')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              debtFilter === 'debt_free'
                ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('common:debtFree')}
          </button>
        </div>
      </div>

      {/* Customers List Grid - Clicking anywhere opens Profile & History */}
      {filteredCustomers.length === 0 ? (
        <div className="apple-card p-12 text-center border border-dashed border-black/10 dark:border-white/10">
          <Users size={48} className="mx-auto text-muted-foreground opacity-30 mb-3" />
          <h3 className="text-base font-bold text-foreground">
            {isArabic ? 'لا يوجد عملاء مطابقين' : 'No matching customers'}
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((c) => {
            const hasDebt = c.outstandingBalance > 0;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCustomer(c)}
                className={`apple-card p-5 flex flex-col justify-between transition-all cursor-pointer border select-none ${
                  hasDebt
                    ? 'border-amber-500/30 hover:border-amber-500/60 shadow-xs'
                    : 'border-black/[0.06] dark:border-white/[0.08] hover:border-primary/50'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-base ring-1 ring-primary/20 shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground leading-tight">{c.name}</h3>
                        <span className="text-xs text-muted-foreground font-medium mt-0.5 block">
                          {isArabic ? 'انقر لعرض السجل والتعديل' : 'Click to view history & edit'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => openEditModal(c, e)}
                        title={isArabic ? 'تعديل البيانات' : 'Edit details'}
                        className="p-2 rounded-xl text-muted-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.08] hover:text-foreground cursor-pointer transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteCustomer(c.id, c.name, e)}
                        title={isArabic ? 'حذف العميل' : 'Delete customer'}
                        className="p-2 rounded-xl text-[#FF3B30] hover:bg-[#FF3B30]/10 cursor-pointer transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-muted-foreground mt-3">
                    {c.phone ? (
                      <div className="flex items-center gap-2.5">
                        <Phone size={14} className="shrink-0 text-muted-foreground" />
                        <span className="tabular-nums font-semibold text-foreground/90">{c.phone}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 text-muted-foreground/50 italic">
                        <Phone size={14} className="shrink-0" />
                        <span>{isArabic ? 'بدون هاتف' : 'No phone'}</span>
                      </div>
                    )}
                    {c.address && (
                      <div className="flex items-center gap-2.5">
                        <MapPin size={14} className="shrink-0 text-muted-foreground" />
                        <span className="truncate">{c.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Financial Details & Settle Button */}
                <div className="pt-4 border-t border-black/[0.05] dark:border-white/[0.06] mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs tabular-nums">
                    <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03]">
                      <span className="text-muted-foreground text-[11px] block font-medium">
                        {isArabic ? 'إجمالي المشتريات' : 'Total Purchases'}
                      </span>
                      <span className="font-extrabold text-foreground text-sm">
                        {formatCurrency(c.totalPurchases || 0, currency, currencyLocale)}
                      </span>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl ${
                        hasDebt
                          ? 'bg-amber-500/10 border border-amber-500/20'
                          : 'bg-emerald-500/10 border border-emerald-500/20'
                      }`}
                    >
                      <span
                        className={`text-[11px] block font-bold ${
                          hasDebt ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {hasDebt ? t('common:customerDebt') : t('common:debtFree')}
                      </span>
                      <span
                        className={`font-black text-sm ${
                          hasDebt ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {hasDebt
                          ? formatCurrency(c.outstandingBalance, currency, currencyLocale)
                          : isArabic
                          ? '0.00 د.ج'
                          : '0.00 DA'}
                      </span>
                    </div>
                  </div>

                  {/* Settle Debt Button */}
                  {hasDebt && (
                    <button
                      onClick={(e) => openSettleDebtModal(c, e)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <DollarSign size={15} />
                      <span>{t('common:settleDebt')}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CUSTOMER PROFILE & PURCHASE HISTORY DRAWER / MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-2xl rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-xs">
            {/* Drawer Header */}
            <div className="p-5 border-b border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between bg-black/[0.015] dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg ring-1 ring-primary/20">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-foreground tracking-tight">
                    {selectedCustomer.name}
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    {selectedCustomer.phone || (isArabic ? 'بدون هاتف مسجل' : 'No phone')} • {selectedCustomer.address || (isArabic ? 'بدون عنوان' : 'No address')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedCustomer)}
                  className="px-3.5 py-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] font-bold text-xs text-foreground flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit size={14} />
                  <span>{isArabic ? 'تعديل البيانات' : 'Edit Info'}</span>
                </button>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Financial Overview & Actions */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 tabular-nums">
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05]">
                  <span className="text-muted-foreground text-xs block font-bold">
                    {isArabic ? 'إجمالي المشتريات' : 'Total Purchases'}
                  </span>
                  <span className="text-xl font-black text-foreground mt-1 block">
                    {formatCurrency(selectedCustomer.totalPurchases || 0, currency, currencyLocale)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-700 dark:text-amber-400 text-xs font-bold block">
                      {isArabic ? 'الدَّين الحالي' : 'Outstanding Debt'}
                    </span>
                    <button
                      onClick={() => openDirectEditDebt(selectedCustomer)}
                      className="text-[10px] text-amber-700 dark:text-amber-400 underline font-bold cursor-pointer"
                      title={isArabic ? 'تعديل مبلغ الدين يدوياً' : 'Edit debt amount'}
                    >
                      {isArabic ? 'تعديل' : 'Edit'}
                    </button>
                  </div>
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
                    {formatCurrency(selectedCustomer.outstandingBalance, currency, currencyLocale)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] col-span-2 sm:col-span-1">
                  <span className="text-muted-foreground text-xs block font-bold">
                    {isArabic ? 'عدد الفواتير' : 'Invoices Count'}
                  </span>
                  <span className="text-xl font-black text-foreground mt-1 block">
                    {customerSales.length} {isArabic ? 'فاتورة' : 'bills'}
                  </span>
                </div>
              </div>

              {/* Debt Settlement Banner */}
              {selectedCustomer.outstandingBalance > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm">
                      {isArabic ? 'تسديد دفعة من الدَّين' : 'Settle Customer Debt'}
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                      {isArabic ? 'سجل دفعة نقدية واطبع سند التسديد فوراً' : 'Record payment and generate receipt'}
                    </p>
                  </div>
                  <button
                    onClick={() => openSettleDebtModal(selectedCustomer)}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs shadow-xs cursor-pointer"
                  >
                    {isArabic ? 'تسديد دَين الآن' : 'Settle Now'}
                  </button>
                </div>
              )}

              {/* SALES & INVOICE HISTORY */}
              <div>
                <h3 className="text-sm font-extrabold text-foreground mb-3 flex items-center gap-2">
                  <Receipt size={17} className="text-primary" />
                  <span>{isArabic ? 'سجل فواتير المشتريات السابقة' : 'Purchase Invoices History'}</span>
                  <span className="text-xs text-muted-foreground font-normal">({customerSales.length})</span>
                </h3>

                {customerSales.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground border border-dashed rounded-2xl">
                    <p>{isArabic ? 'لا توجد فواتير بيع مسجلة لهذا العميل حتى الآن' : 'No sales invoices recorded for this customer yet'}</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {customerSales.map((sale) => {
                      const isExpanded = expandedSaleId === sale.id;
                      const items = allSaleItems.filter((i) => i.saleId === sale.id);
                      const hasSaleDebt = sale.totalAmount > sale.paidAmount;

                      return (
                        <div
                          key={sale.id}
                          className="border border-black/[0.06] dark:border-white/[0.08] rounded-2xl overflow-hidden bg-black/[0.015] dark:bg-white/[0.02]"
                        >
                          {/* Invoice Summary Header */}
                          <div
                            onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                <Receipt size={15} />
                              </div>
                              <div>
                                <span className="font-extrabold text-foreground text-xs block font-mono">
                                  #{sale.saleNumber}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {new Date(sale.createdAt).toLocaleString(isArabic ? 'ar-DZ' : 'fr-FR')} • {items.length} {isArabic ? 'أصناف' : 'items'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-end tabular-nums">
                                <span className="font-black text-foreground text-sm block">
                                  {formatCurrency(sale.totalAmount, currency, currencyLocale)}
                                </span>
                                {hasSaleDebt ? (
                                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                    {isArabic ? `باقي دين: ${formatCurrency(sale.totalAmount - sale.paidAmount, currency, currencyLocale)}` : `Debt: ${sale.totalAmount - sale.paidAmount} DA`}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-emerald-600">
                                    {isArabic ? 'مدفوعة بالكامل' : 'Paid in Full'}
                                  </span>
                                )}
                              </div>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>

                          {/* Expanded Item Details */}
                          {isExpanded && (
                            <div className="p-3.5 border-t border-black/[0.05] dark:border-white/[0.06] bg-card space-y-3">
                              <div className="border border-black/[0.05] dark:border-white/[0.06] rounded-xl overflow-hidden">
                                <table className="w-full text-start text-xs">
                                  <thead className="bg-black/[0.02] dark:bg-white/[0.02] text-muted-foreground font-bold border-b border-black/[0.05] text-[10px] uppercase">
                                    <tr>
                                      <th className="py-2 px-3 text-start">{isArabic ? 'المنتج' : 'Item'}</th>
                                      <th className="py-2 px-3 text-center">{isArabic ? 'الكمية' : 'Qty'}</th>
                                      <th className="py-2 px-3 text-end">{isArabic ? 'السعر' : 'Price'}</th>
                                      <th className="py-2 px-3 text-end">{isArabic ? 'الإجمالي' : 'Total'}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05] tabular-nums">
                                    {items.map((it) => (
                                      <tr key={it.id}>
                                        <td className="py-2 px-3 font-semibold text-foreground">{it.productName}</td>
                                        <td className="py-2 px-3 text-center">{it.quantity}</td>
                                        <td className="py-2 px-3 text-end">{formatCurrency(it.unitPrice, currency, currencyLocale)}</td>
                                        <td className="py-2 px-3 text-end font-bold">{formatCurrency(it.totalAmount, currency, currencyLocale)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Print Past Invoice Buttons */}
                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  onClick={() => handlePrintPastSale(sale, 'thermal')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] font-bold text-xs text-foreground cursor-pointer"
                                >
                                  <Printer size={13} />
                                  <span>{isArabic ? 'طباعة وصل حراري' : 'Thermal Receipt'}</span>
                                </button>
                                <button
                                  onClick={() => handlePrintPastSale(sale, 'a4')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 cursor-pointer"
                                >
                                  <FileText size={13} />
                                  <span>{isArabic ? 'طباعة فاتورة A4 رسمية' : 'Official Facture A4'}</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT EDIT DEBT MODAL */}
      {isEditDebtModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-sm rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.05] pb-3">
              <h3 className="text-base font-bold text-foreground">
                {isArabic ? 'تعديل رصيد الدين يدوياً' : 'Direct Edit Debt Balance'}
              </h3>
              <button onClick={() => setIsEditDebtModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDebtDirect} className="space-y-4">
              <p className="text-muted-foreground text-xs leading-relaxed">
                {isArabic
                  ? `يمكنك تعديل رصيد الدين الحالي للعميل "${editingCustomer.name}" بشكل مباشر:`
                  : `Directly adjust the current outstanding debt balance for "${editingCustomer.name}":`}
              </p>

              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">
                  {isArabic ? 'رصيد الدين الجديد' : 'New Debt Balance'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min={0}
                    value={newDebtValue}
                    onChange={(e) => setNewDebtValue(e.target.value)}
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

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditDebtModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-muted-foreground hover:bg-muted cursor-pointer"
                >
                  {t('common:cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs cursor-pointer shadow-xs"
                >
                  {isArabic ? 'تحديث رصيد الدين' : 'Update Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTLE DEBT MODAL */}
      {settleCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-6">
            {!settleReceipt ? (
              <form onSubmit={handleConfirmSettleDebt} className="space-y-4">
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground">{t('common:payDebtTitle')}</h2>
                      <p className="text-xs text-muted-foreground font-medium">{settleCustomer.name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettleCustomer(null)}
                    className="p-1 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block">
                    {isArabic ? 'إجمالي الدين المستحق حالياً' : 'Current Outstanding Debt'}
                  </span>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
                    {formatCurrency(settleCustomer.outstandingBalance, currency, currencyLocale)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {isArabic ? 'المبلغ المراد تسديده الآن *' : 'Amount to Settle Now *'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      max={settleCustomer.outstandingBalance}
                      step="any"
                      value={settleAmount}
                      onChange={(e) => setSettleAmount(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      placeholder="0.00"
                      className="w-full h-12 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border-2 border-primary/40 focus:border-primary text-lg font-black text-foreground tabular-nums outline-none"
                      autoFocus
                    />
                    <span className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground pointer-events-none">
                      {isArabic ? 'د.ج' : 'DA'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setSettleAmount(settleCustomer.outstandingBalance.toString())}
                      className="px-3 py-1 bg-black/[0.05] dark:bg-white/[0.08] hover:bg-primary hover:text-primary-foreground rounded-lg text-xs font-bold cursor-pointer"
                    >
                      {isArabic ? 'تسديد كامل الدين' : 'Settle Full Debt'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {t('common:paymentMethod')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSettleMethod('cash')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer ${
                        settleMethod === 'cash'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-black/[0.06] dark:border-white/[0.08] text-muted-foreground'
                      }`}
                    >
                      {t('common:paymentCash')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettleMethod('card')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer ${
                        settleMethod === 'card'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-black/[0.06] dark:border-white/[0.08] text-muted-foreground'
                      }`}
                    >
                      {t('common:paymentCard')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettleMethod('bank_transfer')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer ${
                        settleMethod === 'bank_transfer'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-black/[0.06] dark:border-white/[0.08] text-muted-foreground'
                      }`}
                    >
                      {t('common:paymentTransfer')}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    {isArabic ? 'ملاحظة أو مرجع السند' : 'Note or voucher reference'}
                  </label>
                  <input
                    type="text"
                    value={settleNotes}
                    onChange={(e) => setSettleNotes(e.target.value)}
                    placeholder={isArabic ? 'مثال: دفعة عبر وصل رقم...' : 'e.g. Receipt #1234'}
                    className="w-full h-10 px-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.07] text-xs outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06]">
                  <button
                    type="button"
                    onClick={() => setSettleCustomer(null)}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs text-muted-foreground hover:bg-muted cursor-pointer"
                  >
                    {t('common:cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25 cursor-pointer"
                  >
                    {isArabic ? 'تأكيد التسديد وحفظ السند' : 'Confirm Settlement & Save'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">
                    {isArabic ? 'تم تسجيل تسديد الدَّين بنجاح' : 'Debt Payment Recorded Successfully'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isArabic ? `رقم السند: ${settleReceipt.reference}` : `Voucher: ${settleReceipt.reference}`}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] text-xs space-y-2.5 text-start">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isArabic ? 'العميل' : 'Customer'}:</span>
                    <span className="font-bold text-foreground">{settleReceipt.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isArabic ? 'المبلغ المسدد' : 'Paid Amount'}:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(settleReceipt.amountPaid, currency, currencyLocale)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isArabic ? 'الدين المتبقي' : 'Remaining Debt'}:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(settleReceipt.remainingDebt, currency, currencyLocale)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSettleCustomer(null);
                      setSettleReceipt(null);
                    }}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {isArabic ? 'تم والإغلاق' : 'Done'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD / EDIT CUSTOMER MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5 border-b border-black/[0.05] pb-3">
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                {editingCustomer
                  ? isArabic ? 'تعديل بيانات العميل' : 'Edit Customer'
                  : isArabic ? 'إضافة عميل جديد' : 'Add New Customer'}
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">
                  {isArabic ? 'الاسم الكامل للعميل *' : 'Customer Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isArabic ? 'مثال: محمد بن علي' : 'e.g. John Doe'}
                  className="w-full h-11 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] text-sm text-foreground font-medium outline-none focus:ring-2 focus:ring-primary/25"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-foreground">
                    {isArabic ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0550 00 00 00"
                    className="w-full h-11 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] text-sm text-foreground font-medium tabular-nums outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-foreground">
                    {isArabic ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@mail.dz"
                    className="w-full h-11 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] text-sm text-foreground font-medium outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">
                  {isArabic ? 'العنوان / المدينة' : 'Address / City'}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={isArabic ? 'الجزائر العاصمة، وهران، قسنطينة...' : 'Algiers, Oran...'}
                  className="w-full h-11 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] text-sm text-foreground font-medium outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">
                  {isArabic ? 'رصيد دَين سابق (إن وجد)' : 'Previous Debt Balance'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={outstandingBalance}
                    onChange={(e) => setOutstandingBalance(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0.00"
                    className="w-full h-11 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] text-sm text-foreground font-bold tabular-nums outline-none"
                  />
                  <span className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                    {isArabic ? 'د.ج' : 'DA'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-black/[0.05]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl font-bold text-xs text-muted-foreground hover:bg-muted cursor-pointer"
                >
                  {t('common:cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25 cursor-pointer"
                >
                  {isArabic ? 'حفظ بيانات العميل' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
