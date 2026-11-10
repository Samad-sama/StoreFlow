import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Category, Brand } from '@/database/schema';
import { generateId } from '@/lib/utils';
import {
  FolderTree,
  Plus,
  Trash2,
  Edit,
  Award,
  X,
} from 'lucide-react';

export const Categories: React.FC = () => {
  const { t } = useTranslation(['common', 'nav']);

  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const brands = useLiveQuery(() => db.brands.toArray()) ?? [];
  const products = useLiveQuery(() => db.products.toArray()) ?? [];

  const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories');
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  // Category form state
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  // Brand form state
  const [brandName, setBrandName] = useState('');
  const [brandDesc, setBrandDesc] = useState('');
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const openAddCategory = () => {
    setEditingCat(null);
    setCatName('');
    setCatDesc('');
    setIsCatModalOpen(true);
  };

  const openEditCategory = (c: Category) => {
    setEditingCat(c);
    setCatName(c.name);
    setCatDesc(c.description);
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const now = new Date().toISOString();
    if (editingCat) {
      await db.categories.update(editingCat.id, {
        name: catName,
        description: catDesc,
        updatedAt: now,
      });
    } else {
      await db.categories.add({
        id: generateId(),
        name: catName,
        description: catDesc,
        parentId: null,
        icon: 'Folder',
        imageUrl: '',
        sortOrder: categories.length + 1,
        isDemo: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    setIsCatModalOpen(false);
  };

  const handleDeleteCategory = async (cat: Category) => {
    const attachedCount = products.filter((p) => p.categoryId === cat.id).length;
    if (attachedCount > 0) {
      alert(`لا يمكن حذف الفئة لأنها تحتوي على ${attachedCount} منتج. يرجى نقل أو تعديل المنتجات أولاً.`);
      return;
    }
    if (confirm('هل أنت متأكد من حذف هذه الفئة؟')) {
      await db.categories.delete(cat.id);
    }
  };

  const openAddBrand = () => {
    setEditingBrand(null);
    setBrandName('');
    setBrandDesc('');
    setIsBrandModalOpen(true);
  };

  const openEditBrand = (b: Brand) => {
    setEditingBrand(b);
    setBrandName(b.name);
    setBrandDesc(b.description);
    setIsBrandModalOpen(true);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;

    const now = new Date().toISOString();
    if (editingBrand) {
      await db.brands.update(editingBrand.id, {
        name: brandName,
        description: brandDesc,
        updatedAt: now,
      });
    } else {
      await db.brands.add({
        id: generateId(),
        name: brandName,
        description: brandDesc,
        logoUrl: '',
        isDemo: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    setIsBrandModalOpen(false);
  };

  const handleDeleteBrand = async (brand: Brand) => {
    if (confirm('هل أنت متأكد من حذف هذه العلامة التجارية؟')) {
      await db.brands.delete(brand.id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('nav:categories')} والعلامات</h1>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            تنظيم وهيكلة المنتجات حسب التصنيفات والعلامات التجارية
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'categories' ? (
            <button
              onClick={openAddCategory}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 shadow-sm shadow-primary/25 transition-all"
            >
              <Plus size={15} />
              <span>إضافة فئة جديدة</span>
            </button>
          ) : (
            <button
              onClick={openAddBrand}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 shadow-sm shadow-primary/25 transition-all"
            >
              <Plus size={15} />
              <span>إضافة علامة تجارية</span>
            </button>
          )}
        </div>
      </div>

      {/* Apple Segmented Controls */}
      <div className="apple-segmented self-start w-fit shadow-2xs">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
            activeTab === 'categories'
              ? 'bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)] font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FolderTree size={14} />
          <span>الفئات ({categories.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('brands')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
            activeTab === 'brands'
              ? 'bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)] font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Award size={14} />
          <span>العلامات التجارية ({brands.length})</span>
        </button>
      </div>

      {/* Categories Grid */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => {
            const count = products.filter((p) => p.categoryId === c.id).length;
            return (
              <div key={c.id} className="apple-card p-5 apple-card-hover flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <FolderTree size={18} className="stroke-[2.2]" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditCategory(c)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-foreground"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(c)}
                        className="p-1.5 rounded-lg text-[#FF3B30] hover:bg-[#FF3B30]/10"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-foreground mb-1">{c.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.description || 'لا يوجد وصف'}</p>
                </div>
                <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.05] mt-4 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium text-[11px]">المنتجات المسجلة</span>
                  <span className="px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] font-bold text-foreground tabular-nums text-[11px]">
                    {count} منتج
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Brands Grid */}
      {activeTab === 'brands' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((b) => {
            const count = products.filter((p) => p.brandId === b.id).length;
            return (
              <div key={b.id} className="apple-card p-5 apple-card-hover flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-[#AF52DE]/10 text-[#AF52DE] flex items-center justify-center font-bold">
                      <Award size={18} className="stroke-[2.2]" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditBrand(b)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-foreground"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteBrand(b)}
                        className="p-1.5 rounded-lg text-[#FF3B30] hover:bg-[#FF3B30]/10"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-foreground mb-1">{b.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{b.description || 'لا يوجد وصف'}</p>
                </div>
                <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.05] mt-4 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium text-[11px]">المنتجات المسجلة</span>
                  <span className="px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] font-bold text-foreground tabular-nums text-[11px]">
                    {count} منتج
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border border-black/[0.08] dark:border-white/[0.09] shadow-apple-modal p-6 text-xs">
            <div className="flex items-center justify-between mb-4 border-b border-black/[0.04] dark:border-white/[0.05] pb-3">
              <h2 className="text-base font-bold text-foreground tracking-tight">
                {editingCat ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
              </h2>
              <button onClick={() => setIsCatModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  اسم الفئة <span className="text-[#FF3B30]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="مثال: إلكترونيات، أزياء..."
                  className="apple-input w-full"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">الوصف</label>
                <textarea
                  rows={3}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="وصف مختصر للقسم..."
                  className="apple-input w-full"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-black/[0.04] dark:border-white/[0.05]">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="apple-btn-secondary"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="apple-btn-primary"
                >
                  حفظ الفئة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brand Modal */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border border-black/[0.08] dark:border-white/[0.09] shadow-apple-modal p-6 text-xs">
            <div className="flex items-center justify-between mb-4 border-b border-black/[0.04] dark:border-white/[0.05] pb-3">
              <h2 className="text-base font-bold text-foreground tracking-tight">
                {editingBrand ? 'تعديل العلامة' : 'إضافة علامة تجارية'}
              </h2>
              <button onClick={() => setIsBrandModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveBrand} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  اسم العلامة <span className="text-[#FF3B30]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="مثال: Apple, Nike, Anker..."
                  className="apple-input w-full"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">الوصف</label>
                <textarea
                  rows={3}
                  value={brandDesc}
                  onChange={(e) => setBrandDesc(e.target.value)}
                  placeholder="ملاحظات حول العلامة..."
                  className="apple-input w-full"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-black/[0.04] dark:border-white/[0.05]">
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="apple-btn-secondary"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="apple-btn-primary"
                >
                  حفظ العلامة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
