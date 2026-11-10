import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppStore, AppTheme } from '@/stores/appStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/database/schema';
import { formatCurrency } from '@/lib/utils';
import {
  Bell,
  Search,
  ShoppingCart,
  Menu,
  Moon,
  Sun,
  Palette,
  Check,
  AlertTriangle,
  XCircle,
  Users,
  X,
  ExternalLink,
  Square,
} from 'lucide-react';

interface TopBarProps {
  onToggleSidebar?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar }) => {
  const { t, i18n } = useTranslation(['nav', 'common']);
  const navigate = useNavigate();
  const {
    storeName,
    theme,
    setTheme,
    language,
    setLanguage,
    currency,
    currencyLocale,
    sidebarMobileOpen,
    setSidebarMobileOpen,
  } = useAppStore();

  const handleToggle = onToggleSidebar || (() => setSidebarMobileOpen(!sidebarMobileOpen));

  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Queries for live notifications
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const customers = useLiveQuery(() => db.customers.toArray()) ?? [];

  // Notifications calculation
  const notifications = useMemo(() => {
    const list: {
      id: string;
      type: 'out_of_stock' | 'low_stock' | 'high_debt';
      title: string;
      message: string;
      actionUrl: string;
      severity: 'red' | 'amber' | 'blue';
    }[] = [];

    // 1. Out of stock
    const outOfStock = products.filter((p) => p.quantity === 0 && p.status === 'active');
    if (outOfStock.length > 0) {
      list.push({
        id: 'notif-out-stock',
        type: 'out_of_stock',
        title: language === 'ar' ? 'منتجات نفدت من المخزن' : 'Rupture de Stock',
        message:
          language === 'ar'
            ? `يوجد ${outOfStock.length} منتج برصيد 0 في المخزن حالياً.`
            : `${outOfStock.length} produits sont en rupture de stock.`,
        actionUrl: '/inventory',
        severity: 'red',
      });
    }

    // 2. Low stock
    const lowStock = products.filter(
      (p) => p.quantity > 0 && p.quantity <= p.minimumStock && p.status === 'active'
    );
    if (lowStock.length > 0) {
      list.push({
        id: 'notif-low-stock',
        type: 'low_stock',
        title: language === 'ar' ? 'تنبيه انخفاض المخزون' : 'Stock Faible',
        message:
          language === 'ar'
            ? `يوجد ${lowStock.length} منتج قارب على النفاد وتجاوز الحد الأدنى.`
            : `${lowStock.length} produits ont atteint le seuil d'alerte.`,
        actionUrl: '/inventory',
        severity: 'amber',
      });
    }

    // 3. Customers with debt
    const indebted = customers.filter((c) => c.outstandingBalance > 0);
    if (indebted.length > 0) {
      const totalDebt = indebted.reduce((s, c) => s + c.outstandingBalance, 0);
      list.push({
        id: 'notif-debt',
        type: 'high_debt',
        title: language === 'ar' ? 'ديون مستحقة على العملاء' : 'Créances Clients',
        message:
          language === 'ar'
            ? `${indebted.length} عملاء لديهم ديون غير مسددة بإجمالي ${formatCurrency(totalDebt, currency, currencyLocale)}.`
            : `${indebted.length} clients avec un solde impayé de ${formatCurrency(totalDebt, currency, currencyLocale)}.`,
        actionUrl: '/customers',
        severity: 'amber',
      });
    }

    return list;
  }, [products, customers, language, currency, currencyLocale]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setThemeMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const themes: { id: AppTheme; label: string; color: string }[] = [
    { id: 'light', label: language === 'ar' ? 'فاتح رسمي' : 'Clair', color: '#0071E3' },
    { id: 'dark', label: language === 'ar' ? 'داكن حديث' : 'Sombre', color: '#2C2C2E' },
    { id: 'emerald', label: language === 'ar' ? 'زمردي مالي' : 'Émeraude', color: '#059669' },
    { id: 'indigo', label: language === 'ar' ? 'نيلي فاخر' : 'Indigo', color: '#4F46E5' },
    { id: 'amber', label: language === 'ar' ? 'عنبري دافئ' : 'Ambre', color: '#D97706' },
    { id: 'midnight', label: language === 'ar' ? 'ليلي عميق' : 'Minuit', color: '#09090b' },
  ];

  const languages = [
    { code: 'ar', label: 'العربية' },
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 w-full apple-glass border-b border-black/[0.04] dark:border-white/[0.05] flex items-center justify-between px-4 sm:px-6">
      {/* Left side: Hamburger on mobile + Global Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          className="lg:hidden p-2 rounded-xl text-muted-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-foreground active:scale-95 transition-all cursor-pointer"
        >
          <Menu size={20} className="stroke-[2.2]" />
        </button>

        {/* Global Search Bar */}
        <div className="relative hidden md:flex items-center w-64 lg:w-80">
          <Search
            size={16}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none stroke-[2.2]"
          />
          <input
            type="text"
            placeholder={
              language === 'ar'
                ? 'بحث سريع (سلعة، فاتورة، عميل)...'
                : language === 'fr'
                ? 'Recherche rapide...'
                : 'Quick search...'
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.currentTarget.value;
                if (target) navigate(`/products`);
              }
            }}
            className="w-full h-10 ps-9 pe-4 bg-black/[0.035] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] rounded-xl text-xs text-foreground placeholder:text-muted-foreground/70 font-medium focus:outline-none focus:ring-2 focus:ring-primary/25 focus:bg-card transition-all"
          />
        </div>
      </div>

      {/* Right side: Quick POS, Language, Themes, Notifications, Store */}
      <div className="flex items-center gap-2.5">
        {/* Quick POS Shortcut Button */}
        <button
          onClick={() => navigate('/pos')}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-95 text-primary-foreground rounded-xl text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer"
        >
          <ShoppingCart size={16} className="stroke-[2.5]" />
          <span>{t('nav:pos')}</span>
        </button>

        {/* Currency badge pill (Always DZD / DA / د.ج) */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-black/[0.035] dark:bg-white/[0.05] text-foreground rounded-xl text-xs font-bold tabular-nums border border-black/[0.04] dark:border-white/[0.05]">
          <span>{language === 'ar' ? 'د.ج' : 'DA'}</span>
        </div>

        {/* Language Switcher */}
        <div className="apple-segmented">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all duration-150 cursor-pointer ${
                language === lang.code
                  ? 'bg-card text-foreground font-bold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground font-medium'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Theme Menu & Palette Selector */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            className="p-2.5 rounded-xl text-muted-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-foreground active:scale-95 transition-all border border-transparent hover:border-black/[0.04] cursor-pointer"
            title={t('nav:theme')}
          >
            <Palette size={18} className="stroke-[2.2]" />
          </button>

          {themeMenuOpen && (
            <div className="absolute end-0 top-full mt-2 w-56 bg-card border border-black/[0.08] dark:border-white/[0.09] rounded-2xl shadow-apple-modal p-2 z-50 animate-fade-in text-xs">
              <div className="px-3 py-2 font-bold text-foreground border-b border-black/[0.04] dark:border-white/[0.05] mb-1">
                {t('nav:theme')}
              </div>
              <div className="space-y-1">
                {themes.map((th) => (
                  <button
                    key={th.id}
                    onClick={() => {
                      setTheme(th.id);
                      setThemeMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      theme === th.id
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground/80 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: th.color }}
                      />
                      <span>{th.label}</span>
                    </div>
                    {theme === th.id && <Check size={14} className="text-primary stroke-[2.5]" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Functional Notification Center */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="p-2.5 rounded-xl text-muted-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-foreground active:scale-95 transition-all relative cursor-pointer"
            title={t('nav:notifications')}
          >
            <Bell size={18} className="stroke-[2.2]" />
            {notifications.length > 0 && (
              <span className="absolute top-2 end-2 min-w-4 h-4 px-1 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center ring-2 ring-card animate-scale-in">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notification Popover Dropdown */}
          {notificationOpen && (
            <div className="absolute end-0 top-full mt-2 w-80 sm:w-96 bg-card border border-black/[0.08] dark:border-white/[0.09] rounded-3xl shadow-2xl p-4 z-50 animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-black/[0.05] dark:border-white/[0.06] pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-primary" />
                  <h3 className="font-extrabold text-foreground text-sm">
                    {language === 'ar' ? 'مركز التنبيهات' : 'Notifications'}
                  </h3>
                </div>
                {notifications.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 font-bold text-[10px]">
                    {notifications.length} {language === 'ar' ? 'تنبيهات نشطة' : 'alertes'}
                  </span>
                )}
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Check size={28} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                    <p className="font-bold text-foreground">
                      {language === 'ar' ? 'لا توجد تنبيهات جديدة' : 'Aucune alerte'}
                    </p>
                    <p className="text-[11px] mt-0.5">
                      {language === 'ar' ? 'جميع مستويات المخزون والديون في وضع مستقر' : 'Tout est à jour.'}
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        navigate(n.actionUrl);
                        setNotificationOpen(false);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        n.severity === 'red'
                          ? 'border-red-500/25 bg-red-500/5 hover:bg-red-500/10'
                          : 'border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/10'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                          n.severity === 'red'
                            ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {n.severity === 'red' ? <XCircle size={15} /> : <AlertTriangle size={15} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-foreground text-xs">{n.title}</h4>
                          <ExternalLink size={12} className="text-muted-foreground" />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-black/[0.06] dark:bg-white/[0.08] mx-0.5" />

        {/* Store Profile Info */}
        <div
          className="flex items-center gap-2.5 ps-1 cursor-pointer"
          onClick={() => navigate('/settings')}
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs ring-1 ring-primary/20">
            {storeName ? storeName.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className="hidden lg:flex flex-col text-start">
            <span className="text-xs font-bold leading-tight text-foreground truncate max-w-[130px]">
              {storeName || 'StoreFlow'}
            </span>
            <span className="text-[11px] text-muted-foreground font-semibold leading-tight">
              {language === 'ar' ? 'المدير' : 'Admin'}
            </span>
          </div>
        </div>

        {/* Windows Desktop Native Controls if running inside Electron */}
        {typeof window !== 'undefined' && (window as any).electronAPI?.isElectron && (
          <div className="flex items-center gap-1 ms-1 ps-2 border-s border-black/[0.06] dark:border-white/[0.08]">
            <button
              onClick={() => (window as any).electronAPI?.minimize()}
              className="w-7 h-7 rounded-lg hover:bg-black/[0.06] dark:hover:bg-white/[0.08] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title={language === 'ar' ? 'تصغير' : 'Minimize'}
            >
              <span className="text-xs font-bold">―</span>
            </button>
            <button
              onClick={() => (window as any).electronAPI?.maximize()}
              className="w-7 h-7 rounded-lg hover:bg-black/[0.06] dark:hover:bg-white/[0.08] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title={language === 'ar' ? 'تكبير' : 'Maximize'}
            >
              <Square size={12} />
            </button>
            <button
              onClick={() => (window as any).electronAPI?.close()}
              className="w-7 h-7 rounded-lg hover:bg-red-500 hover:text-white flex items-center justify-center text-muted-foreground transition-colors cursor-pointer"
              title={language === 'ar' ? 'إغلاق' : 'Close'}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
