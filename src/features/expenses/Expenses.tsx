import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Expense, ExpenseCategory } from '@/database/schema';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency, generateId } from '@/lib/utils';
import {
  Wallet,
  Plus,
  Search,
  Calendar,
  CreditCard,
  Banknote,
  Trash2,
  X,
  TrendingDown,
  Building2,
  Receipt,
} from 'lucide-react';

export const Expenses: React.FC = () => {
  const { t, i18n } = useTranslation(['common', 'nav']);
  const { currency, currencyLocale } = useAppStore();
  const isArabic = i18n.language === 'ar';

  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray()) ?? [];
  const categories = useLiveQuery(() => db.expenseCategories.toArray()) ?? [];

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State - using string to prevent stuck '0'
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'other'>('cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const resetForm = () => {
    setCategoryId('');
    setAmount('');
    setDescription('');
    setPaymentMethod('cash');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount) || 0;
    if (amountNum <= 0) return;

    const cat = categories.find((c) => c.id === categoryId);
    const catName = cat ? cat.name : (isArabic ? 'مصروفات تشغيل عامة' : 'General Operating Expense');
    const now = new Date().toISOString();

    await db.expenses.add({
      id: generateId(),
      categoryId: categoryId || 'general',
      categoryName: catName,
      amount: amountNum,
      description: description.trim(),
      paymentMethod,
      receiptUrl: '',
      date,
      isDemo: false,
      createdAt: now,
      updatedAt: now,
    });

    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const confirmMsg = isArabic
      ? 'هل أنت متأكد من حذف هذا المصروف؟'
      : 'Are you sure you want to delete this expense record?';
    if (confirm(confirmMsg)) {
      await db.expenses.delete(id);
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.categoryName.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCat === 'all' || e.categoryId === selectedCat;
      return matchSearch && matchCat;
    });
  }, [expenses, search, selectedCat]);

  const totalExpenseSum = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Wallet className="text-primary w-8 h-8" />
            <span>{t('nav:expenses')}</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            {isArabic
              ? `تسجيل ومراقبة فواتير ومصروفات المتجر والتشغيل (${filteredExpenses.length} عملية)`
              : `Track and audit store operational expenses and utilities (${filteredExpenses.length} records)`}
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:bg-primary/90 shadow-md shadow-primary/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus size={18} />
          <span>{isArabic ? 'تسجيل مصروف جديد' : 'Record New Expense'}</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="apple-card p-5 border border-red-500/20 bg-red-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">
              {isArabic ? 'إجمالي المصاريف المسجلة' : 'Total Expenses'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400 tabular-nums">
            {formatCurrency(totalExpenseSum, currency, currencyLocale)}
          </div>
          <span className="text-xs text-red-700/80 dark:text-red-400/80 mt-1 block font-medium">
            {isArabic ? 'تشمل فواتير الطاقة والإيجار ولوازم العمل' : 'Utilities, rent, packaging & operational fees'}
          </span>
        </div>

        <div className="apple-card p-5 border border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {isArabic ? 'عدد فئات المصاريف' : 'Expense Categories'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">
            {categories.length}
          </div>
          <span className="text-xs text-muted-foreground mt-1 block font-medium">
            {isArabic ? 'تصنيفات معتمدة في النظام' : 'Registered expense categories'}
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
                ? 'البحث في البيان أو اسم التصنيف...'
                : 'Search by description or category...'
            }
            className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground font-medium"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          )}
        </div>

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="h-11 px-4 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-foreground text-xs font-bold rounded-2xl outline-none cursor-pointer"
        >
          <option value="all" className="bg-card">
            {isArabic ? 'جميع تصنيفات المصاريف' : 'All Categories'}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id} className="bg-card">
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="apple-card overflow-hidden border border-black/[0.06] dark:border-white/[0.08]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start">
            <thead className="bg-black/[0.02] dark:bg-white/[0.02] text-muted-foreground text-xs font-extrabold uppercase tracking-wider border-b border-black/[0.05] dark:border-white/[0.06]">
              <tr>
                <th className="py-4 px-5 text-start">{isArabic ? 'التصنيف' : 'Category'}</th>
                <th className="py-4 px-5 text-start">{isArabic ? 'البيان والتفاصيل' : 'Description'}</th>
                <th className="py-4 px-5 text-start">{isArabic ? 'التاريخ' : 'Date'}</th>
                <th className="py-4 px-5 text-start">{isArabic ? 'طريقة الدفع' : 'Payment Method'}</th>
                <th className="py-4 px-5 text-start">{isArabic ? 'المبلغ' : 'Amount'}</th>
                <th className="py-4 px-5 text-center">{isArabic ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05] tabular-nums font-medium">
              {filteredExpenses.map((exp) => (
                <tr
                  key={exp.id}
                  className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-4 px-5">
                    <span className="font-bold text-foreground text-sm">{exp.categoryName}</span>
                  </td>
                  <td className="py-4 px-5 text-foreground font-semibold">
                    {exp.description || '-'}
                  </td>
                  <td className="py-4 px-5 text-xs text-muted-foreground">
                    {exp.date}
                  </td>
                  <td className="py-4 px-5">
                    <span className="inline-block px-3 py-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.05] text-xs font-bold text-foreground">
                      {exp.paymentMethod === 'cash'
                        ? t('common:paymentCash')
                        : exp.paymentMethod === 'card'
                        ? t('common:paymentCard')
                        : t('common:paymentTransfer')}
                    </span>
                  </td>
                  <td className="py-4 px-5 font-black text-red-600 dark:text-red-400 text-base">
                    {formatCurrency(exp.amount, currency, currencyLocale)}
                  </td>
                  <td className="py-4 px-5 text-center">
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="p-2 rounded-xl text-red-600 hover:bg-red-500/10 cursor-pointer transition-colors"
                      title={isArabic ? 'حذف' : 'Delete'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-muted-foreground text-sm font-medium">
                    {isArabic ? 'لا توجد مصاريف مسجلة' : 'No expense records found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4 border-b border-black/[0.05] dark:border-white/[0.06] pb-3">
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                {isArabic ? 'تسجيل مصروف جديد' : 'Record New Expense'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">
                  {isArabic ? 'تصنيف المصروف *' : 'Expense Category *'}
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] text-sm text-foreground outline-none cursor-pointer"
                >
                  <option value="">
                    {isArabic ? '-- اختر تصنيف المصروف --' : '-- Select Category --'}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-card">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Field - Never starts with stuck 0 */}
              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">
                  {isArabic ? 'المبلغ المطلوب سداده *' : 'Amount to Pay *'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    required
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0.00"
                    className="w-full h-12 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border-2 border-primary/40 focus:border-primary text-lg font-black text-foreground tabular-nums outline-none transition-all"
                    autoFocus
                  />
                  <span className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground pointer-events-none">
                    {isArabic ? 'د.ج' : 'DA'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">
                  {isArabic ? 'البيان أو الوصف' : 'Description'}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    isArabic
                      ? 'مثال: فاتورة كهرباء سونلغاز لشهر أكتوبر'
                      : 'e.g. Electricity bill for October'
                  }
                  className="w-full h-11 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-foreground">
                    {t('common:paymentMethod')}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full h-11 px-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] text-xs font-bold text-foreground outline-none cursor-pointer"
                  >
                    <option value="cash" className="bg-card">{t('common:paymentCash')}</option>
                    <option value="card" className="bg-card">{t('common:paymentCard')}</option>
                    <option value="bank_transfer" className="bg-card">{t('common:paymentTransfer')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-foreground">
                    {isArabic ? 'تاريخ الدفع' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] text-xs font-bold text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-black/[0.05] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl font-bold text-xs text-muted-foreground hover:bg-muted cursor-pointer"
                >
                  {t('common:cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25 cursor-pointer"
                >
                  {isArabic ? 'تسجيل المصروف' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
