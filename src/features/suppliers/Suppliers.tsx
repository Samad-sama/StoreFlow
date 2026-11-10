import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Supplier, Purchase } from '@/database/schema';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency, generateId } from '@/lib/utils';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Edit,
  X,
  User,
  ShoppingBag,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

export const Suppliers: React.FC = () => {
  const { t, i18n } = useTranslation(['common', 'nav']);
  const { currency, currencyLocale } = useAppStore();
  const isArabic = i18n.language === 'ar';

  const suppliers = useLiveQuery(() => db.suppliers.toArray()) ?? [];
  const purchases = useLiveQuery(() => db.purchases.orderBy('createdAt').reverse().toArray()) ?? [];

  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isEditDebtOpen, setIsEditDebtOpen] = useState(false);
  const [newDebtVal, setNewDebtVal] = useState<string>('');

  // Form State - using string to avoid stuck 0
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState<string>('');

  const resetForm = () => {
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
    setOutstandingBalance('');
    setEditingSupplier(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (s: Supplier, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingSupplier(s);
    setName(s.name);
    setContactPerson(s.contactPerson);
    setPhone(s.phone);
    setEmail(s.email);
    setAddress(s.address);
    setNotes(s.notes);
    setOutstandingBalance(s.outstandingBalance > 0 ? s.outstandingBalance.toString() : '');
    setIsModalOpen(true);
  };

  const openDirectEditDebt = (s: Supplier, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingSupplier(s);
    setNewDebtVal(s.outstandingBalance > 0 ? s.outstandingBalance.toString() : '');
    setIsEditDebtOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const now = new Date().toISOString();
    const balanceNum = parseFloat(outstandingBalance) || 0;

    if (editingSupplier) {
      await db.suppliers.update(editingSupplier.id, {
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        notes: notes.trim(),
        outstandingBalance: balanceNum,
        updatedAt: now,
      });

      if (selectedSupplier && selectedSupplier.id === editingSupplier.id) {
        setSelectedSupplier({
          ...selectedSupplier,
          name: name.trim(),
          contactPerson: contactPerson.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          notes: notes.trim(),
          outstandingBalance: balanceNum,
        });
      }
    } else {
      await db.suppliers.add({
        id: generateId(),
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        notes: notes.trim(),
        outstandingBalance: balanceNum,
        status: 'active',
        isDemo: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleSaveDirectDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;

    const val = parseFloat(newDebtVal) || 0;
    const now = new Date().toISOString();

    await db.suppliers.update(editingSupplier.id, {
      outstandingBalance: Math.max(0, val),
      updatedAt: now,
    });

    if (selectedSupplier && selectedSupplier.id === editingSupplier.id) {
      setSelectedSupplier({
        ...selectedSupplier,
        outstandingBalance: Math.max(0, val),
      });
    }

    setIsEditDebtOpen(false);
  };

  const handleDelete = async (id: string, supplierName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const confirmMsg = isArabic
      ? `هل أنت متأكد من حذف المورد "${supplierName}"؟`
      : `Are you sure you want to delete supplier "${supplierName}"?`;
    if (confirm(confirmMsg)) {
      await db.suppliers.delete(id);
      if (selectedSupplier?.id === id) {
        setSelectedSupplier(null);
      }
    }
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      return (
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
        s.phone.includes(search)
      );
    });
  }, [suppliers, search]);

  // Purchases associated with selected supplier
  const supplierPurchases = useMemo(() => {
    if (!selectedSupplier) return [];
    return purchases.filter((p) => p.supplierId === selectedSupplier.id);
  }, [selectedSupplier, purchases]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Truck className="text-primary w-8 h-8" />
            <span>{t('nav:suppliers')}</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            {isArabic
              ? `إدارة الموردين، شركات التوزيع، المشتريات والديون (${filteredSuppliers.length} مورد)`
              : `Supplier accounts, delivery records and accounts payable (${filteredSuppliers.length} suppliers)`}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:bg-primary/90 shadow-md shadow-primary/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus size={18} />
          <span>{isArabic ? 'إضافة مورد جديد' : 'Add New Supplier'}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl max-w-md focus-within:border-primary focus-within:bg-card transition-all">
        <Search size={18} className="text-muted-foreground shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            isArabic
              ? 'البحث باسم المورد أو جهة الاتصال أو الهاتف...'
              : 'Search by supplier, contact, phone...'
          }
          className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground font-medium"
        />
      </div>

      {/* Suppliers Grid - Click anywhere on card opens profile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((s) => {
          const hasDebt = s.outstandingBalance > 0;
          return (
            <div
              key={s.id}
              onClick={() => setSelectedSupplier(s)}
              className={`apple-card p-5 flex flex-col justify-between transition-all cursor-pointer border select-none ${
                hasDebt
                  ? 'border-amber-500/30 hover:border-amber-500/60 shadow-xs'
                  : 'border-black/[0.06] dark:border-white/[0.08] hover:border-primary/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base ring-1 ring-primary/20 shrink-0">
                      <Truck size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-foreground leading-tight">{s.name}</h3>
                      {s.contactPerson && (
                        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                          <User size={12} />
                          {s.contactPerson}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => openEditModal(s, e)}
                      className="p-2 rounded-xl text-muted-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.08] hover:text-foreground cursor-pointer"
                      title={isArabic ? 'تعديل' : 'Edit'}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(s.id, s.name, e)}
                      className="p-2 rounded-xl text-red-600 hover:bg-red-500/10 cursor-pointer"
                      title={isArabic ? 'حذف' : 'Delete'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground mt-3">
                  {s.phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone size={14} className="shrink-0" />
                      <span className="tabular-nums font-semibold text-foreground/90">{s.phone}</span>
                    </div>
                  )}
                  {s.address && (
                    <div className="flex items-center gap-2.5">
                      <MapPin size={14} className="shrink-0" />
                      <span className="truncate">{s.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-black/[0.05] dark:border-white/[0.06] mt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">
                  {isArabic ? 'الرصيد المستحق للمورد (دَين):' : 'Payable Debt:'}
                </span>
                <span
                  className={`font-black text-sm tabular-nums ${
                    hasDebt ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
                  }`}
                >
                  {formatCurrency(s.outstandingBalance, currency, currencyLocale)}
                </span>
              </div>
            </div>
          );
        })}

        {filteredSuppliers.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground text-sm font-medium">
            {isArabic ? 'لا يوجد موردون مسجلون مطابقون للبحث' : 'No matching suppliers found'}
          </div>
        )}
      </div>

      {/* SUPPLIER PROFILE & PURCHASES HISTORY MODAL */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-2xl rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-xs">
            <div className="p-5 border-b border-black/[0.05] flex items-center justify-between bg-black/[0.015] dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg ring-1 ring-primary/20">
                  <Truck size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-foreground tracking-tight">
                    {selectedSupplier.name}
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    {selectedSupplier.contactPerson ? `${selectedSupplier.contactPerson} • ` : ''}
                    {selectedSupplier.phone || ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedSupplier)}
                  className="px-3.5 py-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] font-bold text-xs text-foreground flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit size={14} />
                  <span>{isArabic ? 'تعديل البيانات' : 'Edit Info'}</span>
                </button>
                <button
                  onClick={() => setSelectedSupplier(null)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              <div className="grid grid-cols-2 gap-3 tabular-nums">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-700 dark:text-amber-400 text-xs font-bold block">
                      {isArabic ? 'المبلغ المستحق للمورد (دين علينا)' : 'Outstanding Payable Debt'}
                    </span>
                    <button
                      onClick={() => openDirectEditDebt(selectedSupplier)}
                      className="text-[10px] text-amber-700 dark:text-amber-400 underline font-bold cursor-pointer"
                    >
                      {isArabic ? 'تعديل' : 'Edit'}
                    </button>
                  </div>
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
                    {formatCurrency(selectedSupplier.outstandingBalance, currency, currencyLocale)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05]">
                  <span className="text-muted-foreground text-xs block font-bold">
                    {isArabic ? 'طلبيات الشراء المسجلة' : 'Purchase Orders'}
                  </span>
                  <span className="text-xl font-black text-foreground mt-1 block">
                    {supplierPurchases.length} {isArabic ? 'طلبية' : 'orders'}
                  </span>
                </div>
              </div>

              {/* Purchase Orders Log */}
              <div>
                <h3 className="text-sm font-extrabold text-foreground mb-3 flex items-center gap-2">
                  <ShoppingBag size={17} className="text-primary" />
                  <span>{isArabic ? 'سجل طلبيات الشراء من هذا المورد' : 'Purchases from this supplier'}</span>
                </h3>

                {supplierPurchases.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground border border-dashed rounded-2xl">
                    <p>{isArabic ? 'لا توجد طلبيات شراء مسجلة من هذا المورد بعد' : 'No purchases recorded yet'}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {supplierPurchases.map((po) => (
                      <div
                        key={po.id}
                        className="p-3.5 rounded-2xl bg-black/[0.015] dark:bg-white/[0.02] border border-black/[0.05] flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-foreground text-xs block font-mono">
                            #{po.purchaseNumber}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(po.createdAt).toLocaleDateString(isArabic ? 'ar-DZ' : 'fr-FR')}
                          </span>
                        </div>
                        <div className="text-end font-black text-foreground text-sm tabular-nums">
                          {formatCurrency(po.totalAmount, currency, currencyLocale)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT EDIT DEBT MODAL */}
      {isEditDebtOpen && editingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-sm rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.05] pb-3">
              <h3 className="text-base font-bold text-foreground">
                {isArabic ? 'تعديل رصيد دين المورد' : 'Edit Supplier Debt'}
              </h3>
              <button onClick={() => setIsEditDebtOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDirectDebt} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">
                  {isArabic ? 'الرصيد المستحق الجديد' : 'New Balance'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min={0}
                    value={newDebtVal}
                    onChange={(e) => setNewDebtVal(e.target.value)}
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
                  onClick={() => setIsEditDebtOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-muted-foreground hover:bg-muted cursor-pointer"
                >
                  {t('common:cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs cursor-pointer shadow-xs"
                >
                  {isArabic ? 'حفظ التعديل' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT SUPPLIER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-6 text-xs">
            <div className="flex items-center justify-between mb-4 border-b border-black/[0.05] pb-3">
              <h2 className="text-base font-bold text-foreground tracking-tight">
                {editingSupplier
                  ? isArabic ? 'تعديل بيانات المورد' : 'Edit Supplier'
                  : isArabic ? 'إضافة مورد جديد' : 'Add New Supplier'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  {isArabic ? 'اسم المورد / الشركة *' : 'Supplier Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isArabic ? 'مثال: شركة الأوراس للتوزيع' : 'e.g. Atlas Dist.'}
                  className="w-full h-11 px-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] text-xs font-bold outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  {isArabic ? 'اسم المسؤول / جهة الاتصال' : 'Contact Person'}
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder={isArabic ? 'مثال: كريم بن عيسى' : 'e.g. John'}
                  className="w-full h-11 px-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] text-xs font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    {isArabic ? 'رقم الهاتف' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0550 00 00 00"
                    className="w-full h-11 px-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] text-xs font-bold tabular-nums outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    {isArabic ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@supplier.dz"
                    className="w-full h-11 px-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  {isArabic ? 'العنوان / المدينة' : 'Address / City'}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={isArabic ? 'الجزائر العاصمة، وهران، سطيف...' : 'City...'}
                  className="w-full h-11 px-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  {isArabic ? 'رصيد دين سابق للمورد' : 'Previous Debt Balance'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min={0}
                    value={outstandingBalance}
                    onChange={(e) => setOutstandingBalance(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0.00"
                    className="w-full h-11 px-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] text-xs font-black tabular-nums outline-none"
                  />
                  <span className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                    {isArabic ? 'د.ج' : 'DA'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.05]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-muted-foreground hover:bg-muted cursor-pointer"
                >
                  {t('common:cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs cursor-pointer shadow-xs"
                >
                  {isArabic ? 'حفظ المورد' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
