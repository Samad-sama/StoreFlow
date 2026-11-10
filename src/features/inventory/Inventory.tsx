import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Product, InventoryMovement } from '@/database/schema';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency, formatNumber, generateId } from '@/lib/utils';
import {
  Warehouse,
  Plus,
  Minus,
  Search,
  AlertTriangle,
  History,
  ArrowUpDown,
  X,
  Package,
} from 'lucide-react';

export const Inventory: React.FC = () => {
  const { t, i18n } = useTranslation(['common', 'nav']);
  const { currency, currencyLocale } = useAppStore();
  const isArabic = i18n.language === 'ar';

  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const movements = useLiveQuery(() => db.inventoryMovements.orderBy('createdAt').reverse().toArray()) ?? [];

  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'subtract' | 'set'>('add');
  const [adjustQty, setAdjustQty] = useState<string>('1');
  const [reason, setReason] = useState<string>('');
  const [movementCategory, setMovementCategory] = useState<'adjustment' | 'damaged' | 'lost' | 'return'>('adjustment');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search);

      const isLow = p.quantity > 0 && p.quantity <= p.minimumStock;
      const isOut = p.quantity === 0;

      if (stockFilter === 'low') return matchSearch && isLow;
      if (stockFilter === 'out') return matchSearch && isOut;
      return matchSearch;
    });
  }, [products, search, stockFilter]);

  const openAdjustModal = (p: Product) => {
    setSelectedProduct(p);
    setAdjustType('add');
    setAdjustQty('1');
    setReason(isArabic ? 'تسوية جرد دوري' : 'Periodic stocktaking');
    setMovementCategory('adjustment');
    setIsAdjustModalOpen(true);
  };

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const qtyNum = parseInt(adjustQty, 10) || 0;
    const oldQty = selectedProduct.quantity;
    let newQty = oldQty;

    if (adjustType === 'add') {
      newQty = oldQty + Math.abs(qtyNum);
    } else if (adjustType === 'subtract') {
      newQty = Math.max(0, oldQty - Math.abs(qtyNum));
    } else {
      newQty = Math.max(0, qtyNum);
    }

    const delta = newQty - oldQty;
    const now = new Date().toISOString();

    await db.products.update(selectedProduct.id, {
      quantity: newQty,
      updatedAt: now,
    });

    await db.inventoryMovements.add({
      id: generateId(),
      productId: selectedProduct.id,
      variantId: null,
      productName: selectedProduct.name,
      type: movementCategory,
      quantity: delta,
      previousQuantity: oldQty,
      newQuantity: newQty,
      reason: reason.trim() || (isArabic ? 'تعديل مخزون يدوي' : 'Manual stock adjustment'),
      referenceId: null,
      referenceType: 'manual',
      isDemo: false,
      createdAt: now,
    });

    setIsAdjustModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Warehouse className="text-primary w-8 h-8" />
            <span>{t('nav:inventory')}</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            {isArabic
              ? 'مراقبة أرصدة المستودع، التنبيهات، حركة الأصناف والتسويات الجردية'
              : 'Warehouse stock tracking, alerts, inventory log and stocktaking'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl border border-black/[0.04] dark:border-white/[0.06] self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'stock'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isArabic ? 'الأرصدة الحالية' : 'Current Stock'}
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'movements'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isArabic ? 'سجل الحركات' : 'Movement Log'}
          </button>
        </div>
      </div>

      {activeTab === 'stock' ? (
        <>
          {/* Filter Bar */}
          <div className="apple-card p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between border border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center gap-3 px-4 py-2.5 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl flex-1 max-w-md focus-within:border-primary focus-within:bg-card transition-all">
              <Search size={18} className="text-muted-foreground shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  isArabic
                    ? 'ابحث باسم المنتج، رمز SKU، أو الباركود...'
                    : 'Search by product name, SKU, or barcode...'
                }
                className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground font-medium"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStockFilter('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  stockFilter === 'all'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-black/[0.03] dark:bg-white/[0.05] text-muted-foreground hover:text-foreground'
                }`}
              >
                {isArabic ? 'الكل' : 'All'}
              </button>
              <button
                onClick={() => setStockFilter('low')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  stockFilter === 'low'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-black/[0.03] dark:bg-white/[0.05] text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                {isArabic ? 'مخزون منخفض' : 'Low Stock'}
              </button>
              <button
                onClick={() => setStockFilter('out')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  stockFilter === 'out'
                    ? 'bg-red-500 text-white shadow-xs'
                    : 'bg-black/[0.03] dark:bg-white/[0.05] text-red-600 dark:text-red-400 hover:bg-red-500/10'
                }`}
              >
                {isArabic ? 'نفد من المخزن' : 'Out of Stock'}
              </button>
            </div>
          </div>

          {/* Stock Table */}
          <div className="apple-card overflow-hidden border border-black/[0.06] dark:border-white/[0.08]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start">
                <thead className="bg-black/[0.02] dark:bg-white/[0.02] text-muted-foreground text-xs font-extrabold uppercase tracking-wider border-b border-black/[0.05] dark:border-white/[0.06]">
                  <tr>
                    <th className="py-4 px-5 text-start">{isArabic ? 'المنتج' : 'Product'}</th>
                    <th className="py-4 px-5 text-start">{isArabic ? 'الرمز والباركود' : 'SKU & Barcode'}</th>
                    <th className="py-4 px-5 text-start">{isArabic ? 'الكمية المتوفرة' : 'Available Stock'}</th>
                    <th className="py-4 px-5 text-start">{isArabic ? 'الحد الأدنى' : 'Min Alert'}</th>
                    <th className="py-4 px-5 text-start">{isArabic ? 'الحالة' : 'Status'}</th>
                    <th className="py-4 px-5 text-center">{isArabic ? 'تعديل الرصيد' : 'Adjust Stock'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05] tabular-nums font-medium">
                  {filteredProducts.map((p) => {
                    const isLow = p.quantity > 0 && p.quantity <= p.minimumStock;
                    const isOut = p.quantity === 0;

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                              <Package size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-sm">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.unit}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5 font-mono text-xs text-muted-foreground">
                          <span className="font-bold text-foreground block">{p.sku}</span>
                          <span>{p.barcode || '-'}</span>
                        </td>
                        <td className="py-4 px-5 font-black text-foreground text-base">
                          {p.quantity} {p.unit}
                        </td>
                        <td className="py-4 px-5 text-xs text-muted-foreground">
                          {p.minimumStock} {p.unit}
                        </td>
                        <td className="py-4 px-5">
                          {isOut ? (
                            <span className="inline-block px-3 py-1 rounded-xl text-xs font-black bg-red-500/15 text-red-600 dark:text-red-400">
                              {isArabic ? 'نفد تماماً' : 'Out of Stock'}
                            </span>
                          ) : isLow ? (
                            <span className="inline-block px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                              {isArabic ? 'مخزون منخفض' : 'Low Stock'}
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              {isArabic ? 'متوفر بشكل كافٍ' : 'In Stock'}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-center">
                          <button
                            onClick={() => openAdjustModal(p)}
                            className="px-4 py-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-primary hover:text-primary-foreground font-bold text-xs transition-all cursor-pointer"
                          >
                            {isArabic ? 'تعديل يدوي' : 'Adjust'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-muted-foreground text-sm font-medium">
                        {isArabic ? 'لا توجد منتجات مطابقة لخيارات البحث' : 'No matching products found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Movements Log */
        <div className="apple-card overflow-hidden border border-black/[0.06] dark:border-white/[0.08]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-black/[0.02] dark:bg-white/[0.02] text-muted-foreground text-xs font-extrabold uppercase tracking-wider border-b border-black/[0.05] dark:border-white/[0.06]">
                <tr>
                  <th className="py-4 px-5 text-start">{isArabic ? 'التاريخ والوقت' : 'Date & Time'}</th>
                  <th className="py-4 px-5 text-start">{isArabic ? 'المنتج' : 'Product'}</th>
                  <th className="py-4 px-5 text-start">{isArabic ? 'نوع الحركة' : 'Type'}</th>
                  <th className="py-4 px-5 text-start">{isArabic ? 'التغيير' : 'Quantity Change'}</th>
                  <th className="py-4 px-5 text-start">{isArabic ? 'الرصيد الجديد' : 'New Stock'}</th>
                  <th className="py-4 px-5 text-start">{isArabic ? 'السبب والبيان' : 'Reason'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05] tabular-nums font-medium">
                {movements.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 px-5 text-xs text-muted-foreground">
                      {new Date(m.createdAt).toLocaleString(isArabic ? 'ar-DZ' : 'en-US')}
                    </td>
                    <td className="py-4 px-5 font-bold text-foreground">
                      {m.productName}
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-block px-3 py-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-xs font-bold text-foreground">
                        {m.type === 'initial'
                          ? isArabic ? 'رصيد افتتاحي' : 'Initial'
                          : m.type === 'sale'
                          ? isArabic ? 'بيع خروج' : 'Sale'
                          : m.type === 'purchase'
                          ? isArabic ? 'شراء دخول' : 'Purchase'
                          : m.type === 'return'
                          ? isArabic ? 'استرجاع دخول' : 'Return'
                          : isArabic ? 'تسوية جرد' : 'Adjustment'}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-black">
                      <span
                        className={
                          m.quantity > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }
                      >
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-bold text-foreground">
                      {m.newQuantity}
                    </td>
                    <td className="py-4 px-5 text-xs text-muted-foreground">
                      {m.reason || '-'}
                    </td>
                  </tr>
                ))}
                {movements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-muted-foreground text-sm font-medium">
                      {isArabic ? 'لا توجد حركات مخزون مسجلة' : 'No inventory movements recorded'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4 border-b border-black/[0.05] dark:border-white/[0.06] pb-3">
              <div>
                <h2 className="text-lg font-bold text-foreground tracking-tight">
                  {isArabic ? 'تسوية وتعديل المخزون' : 'Adjust Stock Quantity'}
                </h2>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {selectedProduct.name}
                </p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-4">
              <div className="p-4 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl flex items-center justify-between text-xs border border-black/[0.05] dark:border-white/[0.06]">
                <span className="text-muted-foreground font-semibold">
                  {isArabic ? 'الرصيد الحالي بالمخزن:' : 'Current In-Stock:'}
                </span>
                <span className="font-black text-foreground text-base tabular-nums">
                  {selectedProduct.quantity} {selectedProduct.unit}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">
                  {isArabic ? 'نوع عملية التعديل' : 'Adjustment Type'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('add')}
                    className={`py-2.5 text-xs font-bold rounded-2xl border transition-all cursor-pointer ${
                      adjustType === 'add'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'border-black/[0.08] dark:border-white/[0.1] text-muted-foreground'
                    }`}
                  >
                    + {isArabic ? 'إضافة رصيد' : 'Add Stock'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('subtract')}
                    className={`py-2.5 text-xs font-bold rounded-2xl border transition-all cursor-pointer ${
                      adjustType === 'subtract'
                        ? 'bg-red-600 text-white border-red-600 shadow-sm'
                        : 'border-black/[0.08] dark:border-white/[0.1] text-muted-foreground'
                    }`}
                  >
                    - {isArabic ? 'إنقاص رصيد' : 'Deduct Stock'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('set')}
                    className={`py-2.5 text-xs font-bold rounded-2xl border transition-all cursor-pointer ${
                      adjustType === 'set'
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'border-black/[0.08] dark:border-white/[0.1] text-muted-foreground'
                    }`}
                  >
                    = {isArabic ? 'ضبط دقيق' : 'Exact Count'}
                  </button>
                </div>
              </div>

              {/* Quantity Field - Never stuck on 0 */}
              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">
                  {adjustType === 'set'
                    ? isArabic ? 'الرصيد الإجمالي الفعلي الجديد' : 'New Exact Stock Level'
                    : isArabic ? 'الكمية المراد إضافتها أو إنقاصها' : 'Quantity to Add/Deduct'}
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="0"
                  className="w-full h-12 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border-2 border-primary/40 focus:border-primary text-lg font-black text-foreground tabular-nums outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">
                  {isArabic ? 'تصنيف حركة التعديل' : 'Movement Category'}
                </label>
                <select
                  value={movementCategory}
                  onChange={(e) => setMovementCategory(e.target.value as any)}
                  className="w-full h-11 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] text-xs font-bold text-foreground outline-none cursor-pointer"
                >
                  <option value="adjustment" className="bg-card">
                    {isArabic ? 'تسوية جرد دوري' : 'Periodic Stocktaking'}
                  </option>
                  <option value="damaged" className="bg-card">
                    {isArabic ? 'بضاعة تالفة' : 'Damaged Goods'}
                  </option>
                  <option value="lost" className="bg-card">
                    {isArabic ? 'بضاعة مفقودة' : 'Lost Inventory'}
                  </option>
                  <option value="return" className="bg-card">
                    {isArabic ? 'إرجاع إلى المخزون' : 'Returned to Stock'}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">
                  {isArabic ? 'سبب التعديل والملاحظات' : 'Reason / Notes'}
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    isArabic
                      ? 'مثال: جرد نهاية الشهر، بضاعة منتهية الصلاحية...'
                      : 'e.g. End of month audit, damaged box...'
                  }
                  className="w-full h-11 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-black/[0.05] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl font-bold text-xs text-muted-foreground hover:bg-muted cursor-pointer"
                >
                  {t('common:cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25 cursor-pointer"
                >
                  {isArabic ? 'تأكيد وحفظ التسوية' : 'Confirm & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
