import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Warehouse,
  Receipt,
  Users,
  Truck,
  ShoppingBag,
  Wallet,
  BarChart3,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
  ShieldCheck,
} from 'lucide-react';

interface NavItem {
  to: string;
  labelKey: string;
  icon: React.ReactNode;
}

interface NavSection {
  titleKey: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { t } = useTranslation('nav');
  const { sidebarCollapsed, toggleSidebar, storeName, language } = useAppStore();
  const isRTL = language === 'ar';

  const sections: NavSection[] = [
    {
      titleKey: 'overviewSection',
      items: [
        { to: '/dashboard', labelKey: 'dashboard', icon: <LayoutDashboard size={19} className="stroke-[2.2]" /> },
        { to: '/pos', labelKey: 'pos', icon: <ShoppingCart size={19} className="stroke-[2.2]" /> },
      ],
    },
    {
      titleKey: 'catalogSection',
      items: [
        { to: '/products', labelKey: 'products', icon: <Package size={19} className="stroke-[2.2]" /> },
        { to: '/categories', labelKey: 'categories', icon: <FolderTree size={19} className="stroke-[2.2]" /> },
        { to: '/inventory', labelKey: 'inventory', icon: <Warehouse size={19} className="stroke-[2.2]" /> },
      ],
    },
    {
      titleKey: 'commerceSection',
      items: [
        { to: '/sales', labelKey: 'sales', icon: <Receipt size={19} className="stroke-[2.2]" /> },
        { to: '/customers', labelKey: 'customers', icon: <Users size={19} className="stroke-[2.2]" /> },
        { to: '/suppliers', labelKey: 'suppliers', icon: <Truck size={19} className="stroke-[2.2]" /> },
        { to: '/purchases', labelKey: 'purchases', icon: <ShoppingBag size={19} className="stroke-[2.2]" /> },
      ],
    },
    {
      titleKey: 'financeSection',
      items: [
        { to: '/expenses', labelKey: 'expenses', icon: <Wallet size={19} className="stroke-[2.2]" /> },
        { to: '/reports', labelKey: 'reports', icon: <BarChart3 size={19} className="stroke-[2.2]" /> },
      ],
    },
    {
      titleKey: 'systemSection',
      items: [
        { to: '/employees', labelKey: 'employees', icon: <UserCog size={19} className="stroke-[2.2]" /> },
        { to: '/settings', labelKey: 'settings', icon: <Settings size={19} className="stroke-[2.2]" /> },
      ],
    },
  ];

  const CollapseIcon = isRTL
    ? (sidebarCollapsed ? ChevronLeft : ChevronRight)
    : (sidebarCollapsed ? ChevronRight : ChevronLeft);

  return (
    <aside
      className={cn(
        'flex flex-col h-screen select-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-20 shrink-0',
        'bg-[#F2F2F7]/95 dark:bg-[#18181A]/95 border-e border-black/[0.06] dark:border-white/[0.07] backdrop-blur-2xl',
        sidebarCollapsed ? 'w-[76px]' : 'w-[260px]'
      )}
    >
      {/* macOS Window Header & Traffic Lights */}
      <div className="flex items-center justify-between px-4 h-15 shrink-0 border-b border-black/[0.04] dark:border-white/[0.04]">
        {/* Apple Traffic Lights Dots */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/40" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/40" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/40" />
        </div>

        {!sidebarCollapsed && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/80 tracking-tight">
            <span>StoreFlow</span>
          </div>
        )}
      </div>

      {/* Store Identity Badge (Official System) */}
      <div className={cn("px-3.5 py-3 shrink-0", sidebarCollapsed ? "text-center" : "")}>
        <div className={cn(
          "flex items-center gap-3 p-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.05]",
          sidebarCollapsed && "justify-center p-2"
        )}>
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm shadow-primary/25 shrink-0">
            <Store size={20} className="stroke-[2.4]" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col min-w-0 text-start">
              <span className="text-sm font-bold text-foreground tracking-tight truncate leading-tight">
                {storeName || 'StoreFlow'}
              </span>
              <span className="text-xs text-primary font-semibold truncate leading-tight mt-1 flex items-center gap-1">
                <ShieldCheck size={12} className="stroke-[2.5]" />
                {t('officialReady')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-1.5 space-y-4">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!sidebarCollapsed && (
              <div className="px-3 pb-1 text-xs font-bold tracking-wider text-muted-foreground/70 uppercase">
                {t(section.titleKey)}
              </div>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs shadow-primary/25 font-bold'
                      : 'text-foreground/80 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-foreground'
                  )
                }
                title={sidebarCollapsed ? t(item.labelKey) : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!sidebarCollapsed && (
                  <span className="truncate">{t(item.labelKey)}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer / Collapse */}
      <div className="p-3 border-t border-black/[0.04] dark:border-white/[0.04] shrink-0">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-foreground transition-colors"
          title={sidebarCollapsed ? t('expandMenu') : t('collapseMenu')}
        >
          <CollapseIcon size={17} />
          {!sidebarCollapsed && (
            <span className="font-semibold">{sidebarCollapsed ? t('expandMenu') : t('collapseMenu')}</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
