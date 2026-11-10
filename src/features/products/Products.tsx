import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Product } from '@/database/schema';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency, generateId } from '@/lib/utils';
import {
  Package,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Archive,
  Copy,
  AlertTriangle,
  X,
  Check,
  Tag,
  Layers,
} from 'lucide-react';

export const Products: React.FC = () => {
  const { t, i18n } = useTranslation(['common', 'nav']);
  const { currency, currencyLocale, taxRate: defaultTax } = useAppStore();
  const isArabic = i18n.language === 'ar';

  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const brands = useLiveQuery(() => db.brands.toArray()) ?? [];

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State - using strings to prevent stuck '0'
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [minimumStock, setMinimumStock] = useState<string>('5');
  const [unit, setUnit] = useState(isArabic ? 'قطعة' : 'Piece');
  const [taxRate, setTaxRate] = useState<string>(defaultTax ? defaultTax.toString() : '19');

  const resetForm = () => {
    setName('');
    setSku('');
    setBarcode('');
    setDescription('');
    setCategoryId('');
    setBrandId('');
    setPurchasePrice('');
    setSellingPrice('');
    setQuantity('');
    setMinimumStock('5');
    setUnit(isArabic ? 'قطعة' : 'Piece');
    setTaxRate(defaultTax ? defaultTax.toString() : '19');
    setEditingProduct(null);
  };

  const openAddModal = () => {
    resetForm();
    const randomSku = 'SKU-' + Math.floor(100000 + Math.random() * 900000);
    setSku(randomSku);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setBarcode(p.barcode);
    setDescription(p.description);
    setCategoryId(p.categoryId || '');
    setBrandId(p.brandId || '');
    setPurchasePrice(p.purchasePrice > 0 ? p.purchasePrice.toString() : '');
    setSellingPrice(p.sellingPrice > 0 ? p.sellingPrice.toString() : '');
    setQuantity(p.quantity > 0 ? p.quantity.toString() : '0');
    setMinimumStock(p.minimumStock.toString());
    setUnit(p.unit || (isArabic ? 'قطعة' : 'Piece'));
    setTaxRate(p.taxRate.toString());
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const now = new Date().toISOString();
    const pPriceNum = parseFloat(purchasePrice) || 0;
    const sPriceNum = parseFloat(sellingPrice) || 0;
    const qtyNum = parseInt(quantity, 10) || 0;
    const minStockNum = parseInt(minimumStock, 10) || 0;
    const taxNum = parseFloat(taxRate) || 0;

    if (editingProduct) {
      const oldQty = editingProduct.quantity;
      await db.products.update(editingProduct.id, {
        name: name.trim(),
        sku: sku.trim(),
        barcode: barcode.trim(),
        description: description.trim(),
        categoryId: categoryId || null,
        brandId: brandId || null,
        purchasePrice: pPriceNum,
        sellingPrice: sPriceNum,
        quantity: qtyNum,
        minimumStock: minStockNum,
        unit: unit.trim(),
        taxRate: taxNum,
        updatedAt: now,
      });

      if (qtyNum !== oldQty) {
        await db.inventoryMovements.add({
          id: generateId(),
          productId: editingProduct.id,
          variantId: null,
          productName: name.trim(),
          type: 'adjustment',
          quantity: Math.abs(qtyNum - oldQty),
          previousQuantity: oldQty,
          newQuantity: qtyNum,
          reason: isArabic ? 'تعديل يدوي للمخزون' : 'Manual stock adjustment',
          referenceId: null,
          referenceType: null,
          isDemo: false,
          createdAt: now,
        });
      }
    } else {
      const newId = generateId();
      await db.products.add({
        id: newId,
        name: name.trim(),
        sku: sku.trim() || 'SKU-' + Date.now().toString().slice(-6),
        barcode: barcode.trim(),
        description: description.trim(),
        categoryId: categoryId || null,
        brandId: brandId || null,
        purchasePrice: pPriceNum,
        sellingPrice: sPriceNum,
        quantity: qtyNum,
        minimumStock: minStockNum,
        unit: unit.trim() || (isArabic ? 'قطعة' : 'Piece'),
        taxRate: taxNum,
        imageUrl: '',
        additionalImages: [],
        supplierId: null,
        wholesalePrice: null,
        discount: 0,
        discountType: 'percentage',
        customAttributes: {},
        hasVariants: false,
        expirationDate: null,
        status: 'active',
        isDemo: false,
        createdAt: now,
        updatedAt: now,
      });

      if (qtyNum > 0) {
        await db.inventoryMovements.add({
          id: generateId(),
          productId: newId,
          variantId: null,
          productName: name.trim(),
          type: 'initial',
          quantity: qtyNum,
          previousQuantity: 0,
          newQuantity: qtyNum,
          reason: isArabic ? 'رصيد افتتاحي للمنتج' : 'Initial product stock',
          referenceId: null,
          referenceType: null,
          isDemo: false,
          createdAt: now,
        });
      }
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDuplicate = async (p: Product) => {
    const now = new Date().toISOString();
    const newSku = 'SKU-' + Math.floor(100000 + Math.random() * 900000);
    const newName = `${p.name} (${isArabic ? 'نسخة' : 'Copy'})`;

    await db.products.add({
      ...p,
      id: generateId(),
      name: newName,
      sku: newSku,
      barcode: '',
      quantity: 0,
      createdAt: now,
      updatedAt: now,
    });
  };

  const handleToggleArchive = async (p: Product) => {
    const newStatus = p.status === 'active' ? 'archived' : 'active';
    await db.products.update(p.id, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDelete = async (id: string, prodName: string) => {
    const confirmMsg = isArabic
      ? `هل أنت متأكد من حذف المنتج "${prodName}"؟`
      : `Are you sure you want to delete product "${prodName}"?`;
    if (confirm(confirmMsg)) {
      await db.products.delete(id);
    }
  };

  // Filtered List
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search);
      const matchCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, search, selectedCategory, statusFilter]);

  // Inventory stats
  const totalStockValue = useMemo(
    () => products.reduce((acc, p) => acc + p.sellingPrice * p.quantity, 0),
    [products]
  );
  const lowStockCount = useMemo(
    () => products.filter((p) => p.quantity > 0 && p.quantity <= p.minimumStock).length,
    [products]
  );
  const outOfStockCount = useMemo(
    () => products.filter((p) => p.quantity === 0).length,
    [products]
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Package className="text-primary w-8 h-8" />
            <span>{t('nav:products')}</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            {isArabic
              ? `إدارة كتالوج المنتجات، الأسعار، المخزون والباركود (${filteredProducts.length} منتج)`
              : `Product catalog, pricing, inventory and barcodes (${filteredProducts.length} products)`}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:bg-primary/90 shadow-md shadow-primary/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus size={18} />
          <span>{isArabic ? 'إضافة منتج جديد' : 'Add New Product'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="apple-card p-5 border border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {isArabic ? 'إجمالي المنتجات' : 'Total Products'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">
            {products.length}
          </div>
          <span className="text-xs text-muted-foreground mt-1 block font-medium">
            {isArabic ? 'منتجات مسجلة في المتجر' : 'Products in catalog'}
          </span>
        </div>

        <div className="apple-card p-5 border border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {isArabic ? 'القيمة الإجمالية للمخزون' : 'Total Stock Value'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Tag size={16} />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(totalStockValue, currency, currencyLocale)}
          </div>
          <span className="text-xs text-muted-foreground mt-1 block font-medium">
            {isArabic ? 'سعر البيع الإجمالي' : 'Total retail value'}
          </span>
        </div>

        <div className="apple-card p-5 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              {isArabic ? 'تنبيهات المخزون' : 'Stock Alerts'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
            {lowStockCount + outOfStockCount}
          </div>
          <span className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1 block font-medium">
            {isArabic
              ? `${lowStockCount} منخفض و ${outOfStockCount} نفد من المخزون`
              : `${lowStockCount} low & ${outOfStockCount} out of stock`}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="apple-card p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between border border-black/[0.06] dark:border-white/[0.08]">
        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl flex-1 max-w-md focus-within:border-primary focus-within:bg-card transition-all">
          <Search size={18} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isArabic
                ? 'البحث بالاسم، رمز SKU، أو الباركود...'
                : 'Search by name, SKU, or barcode...'
            }
            className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground font-medium"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-11 px-4 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-foreground text-xs font-bold rounded-2xl outline-none cursor-pointer"
          >
            <option value="all" className="bg-card">
              {isArabic ? 'جميع الفئات' : 'All Categories'}
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-card">
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-11 px-4 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-foreground text-xs font-bold rounded-2xl outline-none cursor-pointer"
          >
            <option value="all" className="bg-card">
              {isArabic ? 'جميع الحالات' : 'All Statuses'}
            </option>
            <option value="active" className="bg-card">
              {isArabic ? 'المنتجات النشطة' : 'Active Only'}
            </option>
            <option value="archived" className="bg-card">
              {isArabic ? 'المؤرشفة فقط' : 'Archived Only'}
            </option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="apple-card overflow-hidden border border-black/[0.06] dark:border-white/[0.08]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start">
            <thead className="bg-black/[0.02] dark:bg-white/[0.02] text-muted-foreground text-xs font-extrabold uppercase tracking-wider border-b border-black/[0.05] dark:border-white/[0.06]">
              <tr>
                <th className="py-4 px-5 text-start">{isArabic ? 'المنتج' : 'Product'}</th>
                <th className="py-4 px-5 text-start">{isArabic ? 'الرمز والباركود' : 'SKU & Barcode'}</th>
                <th className="py-4 px-5 text-start">{isArabic ? 'الفئة' : 'Category'}</th>
                <th className="py-4 px-5 text-start">{isArabic ? 'سعر الشراء' : 'Cost Price'}</th>
                <th className="py-4 px-5 text-start">{isArabic ? 'سعر البيع' : 'Selling Price'}</th>
                <th className="py-4 px-5 text-start">{isArabic ? 'المخزون' : 'Stock'}</th>
                <th className="py-4 px-5 text-start">{isArabic ? 'الحالة' : 'Status'}</th>
                <th className="py-4 px-5 text-center">{isArabic ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05] tabular-nums font-medium">
              {filteredProducts.map((p) => {
                const category = categories.find((c) => c.id === p.categoryId);
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
                        <div className="min-w-0">
                          <p className="font-bold text-foreground text-sm truncate max-w-[220px]">
                            {p.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                            {p.description || '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-mono">
                      <div className="text-foreground font-bold text-xs">{p.sku}</div>
                      {p.barcode && (
                        <div className="text-[11px] text-muted-foreground">{p.barcode}</div>
                      )}
                    </td>
                    <td className="py-4 px-5 text-muted-foreground font-semibold text-xs">
                      {category?.name || '-'}
                    </td>
                    <td className="py-4 px-5 font-bold text-muted-foreground">
                      {formatCurrency(p.purchasePrice, currency, currencyLocale)}
                    </td>
                    <td className="py-4 px-5 font-black text-foreground text-base">
                      {formatCurrency(p.sellingPrice, currency, currencyLocale)}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2 font-bold">
                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-black ${
                            isOut
                              ? 'bg-[#FF3B30]/15 text-[#FF3B30]'
                              : isLow
                              ? 'bg-[#FF9500]/15 text-[#FF9500]'
                              : 'bg-[#34C759]/15 text-[#34C759]'
                          }`}
                        >
                          {p.quantity} {p.unit}
                        </span>
                        {isLow && <AlertTriangle size={15} className="text-[#FF9500]" />}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
                          p.status === 'active'
                            ? 'bg-[#34C759]/10 text-[#34C759]'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {p.status === 'active'
                          ? isArabic
                            ? 'نشط'
                            : 'Active'
                          : isArabic
                          ? 'مؤرشف'
                          : 'Archived'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-2 rounded-xl text-muted-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.08] hover:text-foreground cursor-pointer transition-colors"
                          title={isArabic ? 'تعديل' : 'Edit'}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(p)}
                          className="p-2 rounded-xl text-muted-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.08] hover:text-foreground cursor-pointer transition-colors"
                          title={isArabic ? 'نسخ المنتج' : 'Duplicate'}
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleArchive(p)}
                          className="p-2 rounded-xl text-muted-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.08] hover:text-foreground cursor-pointer transition-colors"
                          title={p.status === 'active' ? (isArabic ? 'أرشفة' : 'Archive') : (isArabic ? 'تفعيل' : 'Activate')}
                        >
                          <Archive size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-2 rounded-xl text-[#FF3B30] hover:bg-[#FF3B30]/10 cursor-pointer transition-colors"
                          title={isArabic ? 'حذف' : 'Delete'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground text-sm font-medium">
                    {isArabic
                      ? 'لا توجد منتجات مطابقة لخيارات البحث'
                      : 'No matching products found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-2xl rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-black/[0.05] dark:border-white/[0.06]">
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                {editingProduct
                  ? isArabic
                    ? 'تعديل بيانات المنتج'
                    : 'Edit Product Details'
                  : isArabic
                  ? 'إضافة منتج جديد'
                  : 'Add New Product'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">
                  {isArabic ? 'اسم المنتج *' : 'Product Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isArabic ? 'مثال: حليب كانديا 1 لتر...' : 'e.g. Olive Oil 1L...'}
                  className="w-full h-11 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] text-sm text-foreground font-medium outline-none focus:ring-2 focus:ring-primary/25"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-foreground">
                    {isArabic ? 'رمز SKU' : 'SKU Code'}
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="SKU-10023..."
                    className="w-full h-11 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] text-sm text-foreground font-mono outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-foreground">
                    {isArabic ? 'الباركود (Barcode)' : 'Barcode'}
                  </label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder={isArabic ? 'مسح أو كتابة الباركود...' : 'Scan or type barcode...'}
                    className="w-full h-11 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] text-sm text-foreground font-mono outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-foreground">
                    {isArabic ? 'الفئة' : 'Category'}
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-11 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] text-sm text-foreground outline-none cursor-pointer"
                  >
                    <option value="" className="bg-card">
                      {isArabic ? '-- بدون فئة --' : '-- No Category --'}
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-card">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-foreground">
                    {isArabic ? 'العلامة التجارية' : 'Brand'}
                  </label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full h-11 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] text-sm text-foreground outline-none cursor-pointer"
                  >
                    <option value="" className="bg-card">
                      {isArabic ? '-- بدون علامة --' : '-- No Brand --'}
                    </option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id} className="bg-card">
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Fields - Spacious, Big, Never starts with stuck 0 */}
              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] space-y-3">
                <span className="text-xs font-extrabold text-foreground uppercase tracking-wider block">
                  {isArabic ? 'الأسعار والضريبة' : 'Pricing & Tax'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-foreground">
                      {isArabic ? 'سعر الشراء' : 'Purchase Cost'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="0.00"
                        className="w-full h-12 px-4 rounded-2xl bg-card border border-black/[0.1] dark:border-white/[0.12] text-base font-bold text-foreground tabular-nums outline-none focus:ring-2 focus:ring-primary/25"
                      />
                      <span className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                        {isArabic ? 'د.ج' : 'DA'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-foreground">
                      {isArabic ? 'سعر البيع *' : 'Selling Price *'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        required
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="0.00"
                        className="w-full h-12 px-4 rounded-2xl bg-card border-2 border-primary/50 focus:border-primary text-base font-black text-foreground tabular-nums outline-none transition-all"
                      />
                      <span className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                        {isArabic ? 'د.ج' : 'DA'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-foreground">
                      {isArabic ? 'نسبة الضريبة (%)' : 'Tax Rate (%)'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="19"
                        className="w-full h-12 px-4 rounded-2xl bg-card border border-black/[0.1] dark:border-white/[0.12] text-base font-bold text-foreground tabular-nums outline-none focus:ring-2 focus:ring-primary/25"
                      />
                      <span className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock and Units */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-foreground">
                    {isArabic ? 'الكمية المتوفرة' : 'Stock Quantity'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    className="w-full h-11 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] text-sm text-foreground font-bold tabular-nums outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-foreground">
                    {isArabic ? 'الحد الأدنى للتنبيه' : 'Low Stock Alert'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minimumStock}
                    onChange={(e) => setMinimumStock(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="5"
                    className="w-full h-11 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] text-sm text-foreground tabular-nums outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-foreground">
                    {isArabic ? 'وحدة القياس' : 'Unit'}
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder={isArabic ? 'قطعة، كغ، لتر...' : 'Piece, kg, L...'}
                    className="w-full h-11 px-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">
                  {isArabic ? 'الوصف والملاحظات' : 'Description & Notes'}
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isArabic ? 'وصف أو ملاحظات حول المنتج...' : 'Optional product description...'}
                  className="w-full p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/25 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-end gap-2.5">
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
                  {isArabic ? 'حفظ المنتج' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
