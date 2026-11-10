import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore, AppTheme, FontScale } from '@/stores/appStore';
import { webAdapter } from '@/database/adapters/web';
import { clearDemoData, seedDemoData } from '@/database/seedData';
import { db } from '@/database/schema';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Store,
  Palette,
  Globe,
  Receipt,
  Package,
  HardDrive,
  Database,
  Info,
  Check,
  Download,
  Upload,
  Sparkles,
  Type,
  Sun,
  Moon,
  Brush,
  Percent,
  Phone,
  MapPin,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

type SettingsTab =
  | 'general'
  | 'appearance'
  | 'language'
  | 'tax'
  | 'backup'
  | 'data'
  | 'about';

export const Settings: React.FC = () => {
  const { t, i18n } = useTranslation(['settings', 'common', 'nav']);
  const isArabic = i18n.language === 'ar';
  const {
    storeName,
    setStoreName,
    businessType,
    setBusinessType,
    storePhone,
    setStorePhone,
    storeAddress,
    setStoreAddress,
    theme,
    setTheme,
    customPrimaryColor,
    setCustomPrimaryColor,
    fontScale,
    setFontScale,
    language,
    setLanguage,
    currency,
    setCurrency,
    enableTax,
    setEnableTax,
    taxRate,
    setTaxRate,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saveToast, setSaveToast] = useState(false);

  // General Form
  const [tempStoreName, setTempStoreName] = useState(storeName);
  const [tempBusinessType, setTempBusinessType] = useState(businessType || '');
  const [tempStorePhone, setTempStorePhone] = useState(storePhone || '0550 00 00 00');
  const [tempStoreAddress, setTempStoreAddress] = useState(storeAddress || (isArabic ? 'الجزائر العاصمة' : 'Alger'));

  // Tax Form
  const [tempEnableTax, setTempEnableTax] = useState(enableTax);
  const [tempTaxRate, setTempTaxRate] = useState<string>(taxRate.toString());
  const [tempCustomColor, setTempCustomColor] = useState(customPrimaryColor || '#0071E3');

  // Database stats
  const productsCount = useLiveQuery(() => db.products.count()) ?? 0;
  const salesCount = useLiveQuery(() => db.sales.count()) ?? 0;
  const customersCount = useLiveQuery(() => db.customers.count()) ?? 0;
  const suppliersCount = useLiveQuery(() => db.suppliers.count()) ?? 0;

  const showSaved = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setStoreName(tempStoreName);
    setBusinessType(tempBusinessType);
    setStorePhone(tempStorePhone);
    setStoreAddress(tempStoreAddress);
    showSaved();
  };

  const handleSaveTax = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(tempTaxRate) || 0;
    setEnableTax(tempEnableTax);
    setTaxRate(tempEnableTax ? rate : 0);
    showSaved();
  };

  const handleLanguageChange = (lng: string) => {
    setLanguage(lng);
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
    showSaved();
  };

  const handleThemeChange = (selectedTheme: AppTheme) => {
    setTheme(selectedTheme);
    showSaved();
  };

  const handleColorChange = (color: string) => {
    setTempCustomColor(color);
    setCustomPrimaryColor(color);
    if (theme !== 'custom') {
      setTheme('custom');
    }
  };

  const handleFontScaleChange = (scale: FontScale) => {
    setFontScale(scale);
    showSaved();
  };

  const handleExportBackup = async () => {
    try {
      const blob = await webAdapter.createBackup();
      await webAdapter.saveFile(
        blob,
        `StoreFlow-Backup-${new Date().toISOString().split('T')[0]}.json`
      );
    } catch (err) {
      console.error(err);
      alert(isArabic ? 'فشل تصدير النسخة الاحتياطية.' : 'Failed to export backup.');
    }
  };

  const handleImportBackup = async () => {
    const confirmMsg = isArabic
      ? 'تنبيه: استعادة النسخة الاحتياطية ستستبدل البيانات الحالية. هل تود المتابعة؟'
      : 'Warning: Restoring backup will replace existing data. Continue?';
    if (!confirm(confirmMsg)) return;

    try {
      const file = await webAdapter.readFile('');
      await webAdapter.restoreBackup(file);
      alert(isArabic ? 'تمت استعادة البيانات بنجاح!' : 'Data restored successfully!');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(
        isArabic
          ? 'فشل استيراد النسخة الاحتياطية. يرجى التأكد من صحة الملف.'
          : 'Failed to import backup. Please verify file format.'
      );
    }
  };

  const handleInitializeCatalog = async () => {
    const confirmMsg = isArabic
      ? 'هل تود تثبيت القوالب الأولية للسلع والفئات لتجهيز المتجر؟'
      : 'Do you want to initialize catalog templates and categories?';
    if (confirm(confirmMsg)) {
      await seedDemoData('DZD');
      alert(isArabic ? 'تم تثبيت بيانات المتجر بنجاح!' : 'Store data initialized successfully!');
    }
  };

  const handleResetDatabase = async () => {
    const confirmMsg = isArabic
      ? 'تحذير: هل أنت متأكد من مسح جميع المنتجات والمبيعات وتصفير المتجر؟'
      : 'Warning: Are you sure you want to clear all products and sales to reset the store?';
    if (confirm(confirmMsg)) {
      await clearDemoData();
      alert(isArabic ? 'تم تصفير المتجر بنجاح!' : 'Store database cleared successfully!');
    }
  };

  const tabs = [
    {
      id: 'general' as const,
      label: isArabic ? 'معلومات المتجر' : 'Store Information',
      icon: Store,
      color: 'bg-[#0071E3]',
    },
    {
      id: 'appearance' as const,
      label: isArabic ? 'المظهر والألوان' : 'Appearance & Themes',
      icon: Palette,
      color: 'bg-[#AF52DE]',
    },
    {
      id: 'language' as const,
      label: isArabic ? 'اللغة والمنطقة' : 'Language & Region',
      icon: Globe,
      color: 'bg-[#30B0C7]',
    },
    {
      id: 'tax' as const,
      label: isArabic ? 'الضريبة والعملة' : 'Tax & Currency',
      icon: Receipt,
      color: 'bg-[#34C759]',
    },
    {
      id: 'backup' as const,
      label: isArabic ? 'النسخ الاحتياطي' : 'Backup & Restore',
      icon: HardDrive,
      color: 'bg-[#5856D6]',
    },
    {
      id: 'data' as const,
      label: isArabic ? 'إدارة قاعدة البيانات' : 'Database Maintenance',
      icon: Database,
      color: 'bg-[#FF2D55]',
    },
    {
      id: 'about' as const,
      label: isArabic ? 'حول النظام' : 'About System',
      icon: Info,
      color: 'bg-[#8E8E93]',
    },
  ];

  const themeOptions: { id: AppTheme; label: string; bg: string; dot: string }[] = [
    {
      id: 'light',
      label: isArabic ? 'فاتح رسمي' : 'Light Official',
      bg: 'bg-white text-zinc-900 border-zinc-200',
      dot: 'bg-blue-600',
    },
    {
      id: 'dark',
      label: isArabic ? 'داكن حديث' : 'Dark Modern',
      bg: 'bg-zinc-900 text-white border-zinc-700',
      dot: 'bg-blue-500',
    },
    {
      id: 'emerald',
      label: isArabic ? 'زمردي مالي' : 'Emerald Green',
      bg: 'bg-[#064E3B] text-white border-emerald-600',
      dot: 'bg-emerald-400',
    },
    {
      id: 'indigo',
      label: isArabic ? 'نيلي فاخر' : 'Indigo Royal',
      bg: 'bg-[#1E1B4B] text-white border-indigo-500',
      dot: 'bg-indigo-400',
    },
    {
      id: 'amber',
      label: isArabic ? 'عنبري دافئ' : 'Warm Amber',
      bg: 'bg-[#451A03] text-white border-amber-600',
      dot: 'bg-amber-400',
    },
    {
      id: 'midnight',
      label: isArabic ? 'ليلي عميق' : 'Midnight Pure',
      bg: 'bg-black text-white border-zinc-800',
      dot: 'bg-sky-400',
    },
    {
      id: 'custom',
      label: isArabic ? 'لون مخصص' : 'Custom Palette',
      bg: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white border-white/20',
      dot: 'bg-white',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t('nav:settings')}
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            {isArabic
              ? 'تخصيص هوية المتجر، المظهر والسمات، العملة، اللغات والنسخ الاحتياطي'
              : 'Store identity, themes, currency, multilingual settings, and backups'}
          </p>
        </div>

        {saveToast && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-2xl text-xs font-bold animate-fade-in shadow-md">
            <Check size={16} />
            <span>{isArabic ? 'تم حفظ الإعدادات' : 'Settings saved'}</span>
          </div>
        )}
      </div>

      {/* Settings Container */}
      <div className="apple-card overflow-hidden flex flex-col md:flex-row min-h-[580px] border border-black/[0.06] dark:border-white/[0.08]">
        {/* Navigation Pane */}
        <aside className="w-full md:w-64 bg-black/[0.015] dark:bg-white/[0.02] border-b md:border-b-0 md:border-e border-black/[0.05] dark:border-white/[0.06] p-3 shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground/80 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className={`w-7 h-7 rounded-xl ${
                        isActive ? 'bg-white/20 text-white' : `${tab.color} text-white`
                      } flex items-center justify-center shrink-0 shadow-xs`}
                    >
                      <Icon size={15} />
                    </div>
                    <span className="truncate">{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Pane */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* STORE GENERAL */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="space-y-6 max-w-lg">
              <div>
                <h3 className="text-lg font-bold text-foreground tracking-tight">
                  {isArabic ? 'بيانات المتجر والنشاط' : 'Store Information'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  {isArabic
                    ? 'اسم المحل، الهاتف والعنوان كما يظهر في أعلى الفواتير والوصولات المطبوعة'
                    : 'Store name, phone and address shown on printed receipts & invoices'}
                </p>
              </div>

              <div className="p-5 bg-black/[0.02] dark:bg-white/[0.02] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-foreground">
                    {isArabic ? 'اسم المتجر *' : 'Store Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={tempStoreName}
                    onChange={(e) => setTempStoreName(e.target.value)}
                    className="w-full h-11 px-4 rounded-2xl bg-card border border-black/[0.08] dark:border-white/[0.1] text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-foreground">
                    {isArabic ? 'نوع النشاط التجاري' : 'Business Sector'}
                  </label>
                  <input
                    type="text"
                    value={tempBusinessType}
                    onChange={(e) => setTempBusinessType(e.target.value)}
                    placeholder={
                      isArabic
                        ? 'مثال: سوبرماركت، محل هواتف، ملابس...'
                        : 'e.g. Supermarket, Apparel, Electronics...'
                    }
                    className="w-full h-11 px-4 rounded-2xl bg-card border border-black/[0.08] dark:border-white/[0.1] text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-foreground">
                      {isArabic ? 'هاتف المحل (للفاتورة)' : 'Store Phone'}
                    </label>
                    <input
                      type="text"
                      value={tempStorePhone}
                      onChange={(e) => setTempStorePhone(e.target.value)}
                      placeholder="0550 00 00 00"
                      className="w-full h-11 px-4 rounded-2xl bg-card border border-black/[0.08] dark:border-white/[0.1] text-sm font-bold text-foreground tabular-nums outline-none focus:ring-2 focus:ring-primary/25"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-foreground">
                      {isArabic ? 'عنوان المحل / المدينة' : 'Store Address'}
                    </label>
                    <input
                      type="text"
                      value={tempStoreAddress}
                      onChange={(e) => setTempStoreAddress(e.target.value)}
                      placeholder={isArabic ? 'الجزائر العاصمة' : 'Algiers'}
                      className="w-full h-11 px-4 rounded-2xl bg-card border border-black/[0.08] dark:border-white/[0.1] text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/25"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-2xl font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25 cursor-pointer"
              >
                {isArabic ? 'حفظ بيانات المتجر' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* APPEARANCE & THEMES */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h3 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Palette className="text-primary w-5 h-5" />
                  <span>{isArabic ? 'المظهر وسمات الألوان' : 'Appearance & Color Themes'}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  {isArabic
                    ? 'اختر النمط البصري المفضل أو خصص لونك الخاص، مع خيارات تكبير الخط'
                    : 'Choose visual preset or customize accent colors and font sizes'}
                </p>
              </div>

              {/* Theme Grid */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                  {isArabic ? 'سمات النظام (Themes)' : 'System Themes'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {themeOptions.map((opt) => {
                    const isSelected = theme === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleThemeChange(opt.id)}
                        className={`p-3.5 rounded-2xl border-2 flex flex-col items-start justify-between h-24 text-start transition-all cursor-pointer ${
                          opt.bg
                        } ${
                          isSelected
                            ? 'ring-4 ring-primary/30 border-primary scale-[1.02]'
                            : 'opacity-85 hover:opacity-100 hover:scale-[1.01]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`w-3.5 h-3.5 rounded-full ${opt.dot} shadow-xs`} />
                          {isSelected && <Check size={16} className="text-white drop-shadow-sm" />}
                        </div>
                        <span className="font-extrabold text-xs">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Color Picker */}
              <div className="p-5 bg-black/[0.02] dark:bg-white/[0.02] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Brush size={18} className="text-primary" />
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        {isArabic ? 'منشئ الألوان المخصصة' : 'Custom Accent Color Designer'}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {isArabic
                          ? 'اختر أي لون تريده ليتوافق مع هوية علامتك التجارية'
                          : 'Pick any color to match your brand identity'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={tempCustomColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-10 h-10 rounded-2xl border border-black/10 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={tempCustomColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-24 h-10 px-2 rounded-xl bg-card border border-black/[0.1] text-xs font-mono font-bold text-center outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Font Scaling */}
              <div className="p-5 bg-black/[0.02] dark:bg-white/[0.02] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] space-y-3">
                <div className="flex items-center gap-2">
                  <Type size={18} className="text-primary" />
                  <h4 className="text-xs font-bold text-foreground">
                    {isArabic ? 'حجم الخط وراحة القراءة' : 'Font Scale & Readability'}
                  </h4>
                </div>
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleFontScaleChange('normal')}
                    className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      fontScale === 'normal'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-black/[0.08] dark:border-white/[0.1] text-muted-foreground'
                    }`}
                  >
                    {isArabic ? 'حجم قياسي' : 'Normal (16px)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFontScaleChange('large')}
                    className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      fontScale === 'large'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-black/[0.08] dark:border-white/[0.1] text-muted-foreground'
                    }`}
                  >
                    {isArabic ? 'كبير ومريح' : 'Large (17.5px)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFontScaleChange('xlarge')}
                    className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      fontScale === 'xlarge'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-black/[0.08] dark:border-white/[0.1] text-muted-foreground'
                    }`}
                  >
                    {isArabic ? 'كبير جداً' : 'Extra Large (19px)'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* LANGUAGE & REGION */}
          {activeTab === 'language' && (
            <div className="space-y-6 max-w-lg">
              <div>
                <h3 className="text-lg font-bold text-foreground tracking-tight">
                  {isArabic ? 'اللغة والاتجاه' : 'Language & Localization'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  {isArabic
                    ? 'اختر لغة واجهة النظام (عربية بنسبة 100% أو فرنسية أو إنجليزية)'
                    : 'Choose interface language (Arabic, French, or English)'}
                </p>
              </div>

              <div className="p-5 bg-black/[0.02] dark:bg-white/[0.02] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] space-y-3">
                {[
                  { code: 'ar', label: 'العربية (Arabic)', dir: 'rtl', desc: 'دعم كامل للغة العربية والعملة د.ج' },
                  { code: 'fr', label: 'Français (French)', dir: 'ltr', desc: 'Interface officielle en langue française et devise DA' },
                  { code: 'en', label: 'English (US)', dir: 'ltr', desc: 'Official English system interface and DA currency' },
                ].map((item) => {
                  const isCurrent = language === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleLanguageChange(item.code)}
                      className={`w-full p-4 rounded-2xl border flex items-center justify-between text-start transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.02]'
                      }`}
                    >
                      <div>
                        <span className="font-extrabold text-sm block">{item.label}</span>
                        <span className="text-xs text-muted-foreground mt-0.5 block">{item.desc}</span>
                      </div>
                      {isCurrent && <Check size={18} className="text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAX & CURRENCY - Complete option to enable/disable tax */}
          {activeTab === 'tax' && (
            <form onSubmit={handleSaveTax} className="space-y-6 max-w-lg">
              <div>
                <h3 className="text-lg font-bold text-foreground tracking-tight">
                  {isArabic ? 'العملة والضريبة' : 'Currency & Tax Rate'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  {isArabic
                    ? 'تحكم في تفعيل أو إلغاء حساب الضريبة تماماً من المبيعات'
                    : 'Manage official currency and toggle tax rate completely on or off'}
                </p>
              </div>

              <div className="p-5 bg-black/[0.02] dark:bg-white/[0.02] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] space-y-4">
                {/* Currency */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-foreground">
                    {isArabic ? 'العملة الرسمية للنظام' : 'Official Currency'}
                  </label>
                  <div className="h-12 px-4 rounded-2xl bg-card border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-between">
                    <span className="font-extrabold text-sm text-foreground">
                      {isArabic ? 'الدينار الجزائري (د.ج)' : 'Algerian Dinar (DA)'}
                    </span>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                      DZD
                    </span>
                  </div>
                </div>

                {/* Option to Enable/Disable Tax Completely */}
                <div className="p-4 rounded-2xl bg-card border border-black/[0.06] flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground">
                      {isArabic ? 'حساب الضريبة (TVA)' : 'Calculate Tax (TVA)'}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tempEnableTax
                        ? isArabic ? 'الضريبة مفعلة وتطبق على الفواتير' : 'Tax is enabled on invoices'
                        : isArabic ? 'الضريبة ملغاة تماماً ولا تضاف للأسعار (0%)' : 'Tax is completely disabled (0%)'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTempEnableTax(!tempEnableTax)}
                    className={`w-14 h-8 rounded-full transition-colors flex items-center px-1 cursor-pointer ${
                      tempEnableTax ? 'bg-primary justify-end' : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

                {/* Tax Rate Input if enabled */}
                {tempEnableTax && (
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-foreground">
                      {isArabic ? 'نسبة الضريبة (%)' : 'Tax Rate (TVA %)'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        value={tempTaxRate}
                        onChange={(e) => setTempTaxRate(e.target.value)}
                        className="w-full h-12 px-4 rounded-2xl bg-card border border-black/[0.08] dark:border-white/[0.1] text-base font-bold text-foreground tabular-nums outline-none focus:ring-2 focus:ring-primary/25"
                      />
                      <span className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground pointer-events-none">
                        %
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-2xl font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25 cursor-pointer"
              >
                {isArabic ? 'حفظ إعدادات الضريبة' : 'Save Tax Settings'}
              </button>
            </form>
          )}

          {/* BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-6 max-w-lg">
              <div>
                <h3 className="text-lg font-bold text-foreground tracking-tight">
                  {isArabic ? 'النسخ الاحتياطي والاستعادة' : 'Backup & Recovery'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  {isArabic
                    ? 'احفظ نسخة من بيانات المتجر بالكامل واستعدها بأمان في أي وقت'
                    : 'Download full database snapshot and restore anytime'}
                </p>
              </div>

              <div className="p-5 bg-black/[0.02] dark:bg-white/[0.02] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] space-y-4">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-card border border-black/[0.06] hover:border-primary transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                      <Download size={20} />
                    </div>
                    <div className="text-start">
                      <span className="font-extrabold text-sm text-foreground block">
                        {isArabic ? 'تصدير نسخة احتياطية كاملة' : 'Export Full Backup'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {isArabic ? 'ملف JSON يحتوي كافة المبيعات والمنتجات' : 'JSON file containing all records'}
                      </span>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleImportBackup}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-card border border-black/[0.06] hover:border-primary transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                      <Upload size={20} />
                    </div>
                    <div className="text-start">
                      <span className="font-extrabold text-sm text-foreground block">
                        {isArabic ? 'استعادة من نسخة احتياطية' : 'Restore From Backup'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {isArabic ? 'استرجاع ملف نسخة احتياطية سابق' : 'Select a saved backup file'}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* DATABASE MAINTENANCE */}
          {activeTab === 'data' && (
            <div className="space-y-6 max-w-lg">
              <div>
                <h3 className="text-lg font-bold text-foreground tracking-tight">
                  {isArabic ? 'إدارة وتهيئة قاعدة البيانات' : 'Database Maintenance'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  {isArabic
                    ? 'إحصائيات السجلات وخيارات التهيئة والبدء الرسمي'
                    : 'Record statistics and store initialization options'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 bg-black/[0.02] dark:bg-white/[0.02] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] tabular-nums text-xs">
                <div>
                  <span className="text-muted-foreground block font-medium">
                    {isArabic ? 'المنتجات المسجلة:' : 'Products:'}
                  </span>
                  <span className="font-extrabold text-foreground text-sm">{productsCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">
                    {isArabic ? 'فواتير المبيعات:' : 'Sales Invoices:'}
                  </span>
                  <span className="font-extrabold text-foreground text-sm">{salesCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">
                    {isArabic ? 'العملاء المسجلون:' : 'Customers:'}
                  </span>
                  <span className="font-extrabold text-foreground text-sm">{customersCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">
                    {isArabic ? 'الموردون:' : 'Suppliers:'}
                  </span>
                  <span className="font-extrabold text-foreground text-sm">{suppliersCount}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleInitializeCatalog}
                  className="w-full py-3 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] text-foreground font-bold text-xs transition-all cursor-pointer"
                >
                  {isArabic
                    ? 'تثبيت الفئات والمنتجات الأولية للمتجر'
                    : 'Load Initial Store Catalog & Categories'}
                </button>

                <button
                  type="button"
                  onClick={handleResetDatabase}
                  className="w-full py-3 px-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 font-bold text-xs transition-all cursor-pointer"
                >
                  {isArabic
                    ? 'تصفير قاعدة البيانات للبدء الرسمي'
                    : 'Clear Database for Production Clean Start'}
                </button>
              </div>
            </div>
          )}

          {/* ABOUT SYSTEM */}
          {activeTab === 'about' && (
            <div className="space-y-6 max-w-lg">
              <div className="p-6 rounded-3xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] space-y-3 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground font-black text-2xl flex items-center justify-center mx-auto shadow-md">
                  SF
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">StoreFlow</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                    Universal Store Management System — v1.0.0
                  </p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pt-2">
                  {isArabic
                    ? 'نظام شامل واحترافي لإدارة المتاجر والمبيعات ونقاط البيع وتتبع ديون العملاء والمخزون، مبني بأحدث معايير تجربة المستخدم.'
                    : 'Complete enterprise store management system featuring point-of-sale, customer debt tracking, inventory, and analytics.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
