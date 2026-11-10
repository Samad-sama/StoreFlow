import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Purchase, PurchaseItem, Supplier, Product } from '@/database/schema';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency, generateId } from '@/lib/utils';
import {
  ShoppingBag,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  X,
} from 'lucide-react';

interface PurchaseLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export const Purchases: React.FC = () => {
  const { t } = useTranslation(['common', 'nav']);
  const { currency, currencyLocale } = useAppStore();

  const purchases = useLiveQuery(() => db.purchases.orderBy('createdAt').reverse().toArray()) ?? [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) ?? [];
  const products = useLiveQuery(() => db.products.toArray()) ?? [];

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Purchase Form
  const [supplierId, setSupplierId] = useState('');
  const [lines, setLines] = useState<PurchaseLine[]>([]);
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setSupplierId('');
    setLines([]);
    setNotes('');
  };

  const addLine = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    setLines((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        quantity: 1,
        unitPrice: prod.purchasePrice || 0,
      },
    ]);
  };

  const updateLineQty = (index: number, qty: number) => {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, quantity: Math.max(1, qty) } : l))
    );
  };

  const updateLinePrice = (index: number, price: number) => {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, unitPrice: Math.max(0, price) } : l))
    );
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = useMemo(() => {
    return lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  }, [lines]);

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || lines.length === 0) {
      alert('يرجى اختيار المورد وإضافة منتج واحد على الأقل.');
      return;
    }

    const supplier = suppliers.find((s) => s.id === supplierId);
    const purchaseId = generateId();
    const purchaseNumber = `PO-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const purchase: Purchase = {
      id: purchaseId,
      purchaseNumber,
      supplierId,
      supplierName: supplier?.name || '',
      subtotal: totalAmount,
      taxAmount: 0,
      totalAmount,
      paidAmount: totalAmount,
      status: 'received',
      notes,
      isDemo: false,
      createdAt: now,
      updatedAt: now,
    };

    const purchaseItems: PurchaseItem[] = lines.map((l) => ({
      id: generateId(),
      purchaseId,
      productId: l.productId,
      productName: l.productName,
      quantity: l.quantity,
      receivedQuantity: l.quantity,
      unitPrice: l.unitPrice,
      totalAmount: l.quantity * l.unitPrice,
      createdAt: now,
    }));

    await db.transaction('rw', [db.purchases, db.purchaseItems, db.products, db.inventoryMovements], async () => {
      await db.purchases.add(purchase);
      await db.purchaseItems.bulkAdd(purchaseItems);

      for (const line of lines) {
        const prod = await db.products.get(line.productId);
        if (prod) {
          const oldQty = prod.quantity;
          const newQty = oldQty + line.quantity;

          await db.products.update(line.productId, {
            quantity: newQty,
            purchasePrice: line.unitPrice,
            updatedAt: now,
          });

          await db.inventoryMovements.add({
            id: generateId(),
            productId: line.productId,
            variantId: null,
            productName: line.productName,
            type: 'purchase',
            quantity: line.quantity,
            previousQuantity: oldQty,
            newQuantity: newQty,
            reason: `طلب شراء #${purchaseNumber}`,
            referenceId: purchaseId,
            referenceType: 'purchase',
            isDemo: false,
            createdAt: now,
          });
        }
      }
    });

    setIsModalOpen(false);
    resetForm();
  };

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      return (
        p.purchaseNumber.toLowerCase().includes(search.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [purchases, search]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('nav:purchases')} وأوامر التوريد</h1>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            تسجيل فواتير الشراء واستلام البضائع وزيادة المخزون ({filteredPurchases.length} أمر شراء)
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 shadow-sm shadow-primary/25 transition-all self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>إنشاء أمر شراء جديد</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.05] rounded-xl max-w-md focus-within:border-primary focus-within:bg-card transition-all">
        <Search size={15} className="text-muted-foreground shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="البحث برقم أمر الشراء أو اسم المورد..."
          className="bg-transparent border-none outline-none text-xs w-full text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Purchases Table */}
      <div className="apple-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-black/[0.02] dark:bg-white/[0.02] text-muted-foreground uppercase text-[10px] tracking-wider font-bold border-b border-black/[0.04] dark:border-white/[0.05]">
              <tr>
                <th className="py-3 px-4 text-start">رقم الطلب</th>
                <th className="py-3 px-4 text-start">المورد</th>
                <th className="py-3 px-4 text-start">التاريخ</th>
                <th className="py-3 px-4 text-start">المبلغ الإجمالي</th>
                <th className="py-3 px-4 text-start">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05] tabular-nums">
              {filteredPurchases.map((p) => (
                <tr key={p.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-foreground">{p.purchaseNumber}</td>
                  <td className="py-3 px-4 font-semibold text-foreground">{p.supplierName}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString(currencyLocale)}
                  </td>
                  <td className="py-3 px-4 font-extrabold text-foreground">
                    {formatCurrency(p.totalAmount, currency, currencyLocale)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#34C759]/15 text-[#34C759]">
                      <CheckCircle2 size={11} />
                      <span>مستلم ومضاف للمخزون</span>
                    </span>
                  </td>
                </tr>
              ))}
              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground text-xs">
                    لا توجد أوامر شراء مسجلة حتى الآن
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-xl rounded-3xl border border-black/[0.08] dark:border-white/[0.09] shadow-apple-modal p-6 flex flex-col max-h-[90vh] text-xs">
            <div className="flex items-center justify-between mb-4 border-b border-black/[0.04] dark:border-white/[0.05] pb-3">
              <h2 className="text-base font-bold text-foreground tracking-tight">تسجيل أمر شراء واستلام بضاعة</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-[11px] font-semibold mb-1 text-foreground">
                  المورد <span className="text-[#FF3B30]">*</span>
                </label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="apple-select w-full"
                >
                  <option value="" className="bg-card">-- اختر المورد --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id} className="bg-card">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1 text-foreground">إضافة منتج للأمر</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addLine(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="apple-select w-full"
                >
                  <option value="" className="bg-card">-- انقر لاختيار منتج وإضافته للقائمة --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} className="bg-card">
                      {p.name} (المتوفر حالياً: {p.quantity} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="border border-black/[0.05] dark:border-white/[0.06] rounded-2xl overflow-hidden">
                <table className="w-full text-start">
                  <thead className="bg-black/[0.02] dark:bg-white/[0.02] text-muted-foreground text-[10px] uppercase font-bold tracking-wider border-b border-black/[0.04] dark:border-white/[0.05]">
                    <tr>
                      <th className="py-2.5 px-3 text-start">المنتج</th>
                      <th className="py-2.5 px-3 text-start">الكمية</th>
                      <th className="py-2.5 px-3 text-start">سعر التكلفة ({currency})</th>
                      <th className="py-2.5 px-3 text-start">الإجمالي</th>
                      <th className="py-2.5 px-3 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05] tabular-nums">
                    {lines.map((l, idx) => (
                      <tr key={idx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 font-semibold text-foreground truncate max-w-[150px]">
                          {l.productName}
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min={1}
                            value={l.quantity}
                            onChange={(e) => updateLineQty(idx, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 rounded-lg border border-input bg-card font-bold text-center tabular-nums"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={l.unitPrice}
                            onChange={(e) => updateLinePrice(idx, parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 rounded-lg border border-input bg-card text-center tabular-nums"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-bold text-foreground">
                          {formatCurrency(l.quantity * l.unitPrice, currency, currencyLocale)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="p-1 text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {lines.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs font-medium">
                          لم تتم إضافة أي منتج بعد
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center p-3.5 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl font-bold tabular-nums border border-black/[0.04] dark:border-white/[0.05]">
                <span className="text-foreground text-xs">إجمالي الفاتورة:</span>
                <span className="text-base text-primary font-black">
                  {formatCurrency(totalAmount, currency, currencyLocale)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-black/[0.04] dark:border-white/[0.05]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="apple-btn-secondary"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={lines.length === 0 || !supplierId}
                  className="apple-btn-primary"
                >
                  تأكيد واستلام البضاعة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
