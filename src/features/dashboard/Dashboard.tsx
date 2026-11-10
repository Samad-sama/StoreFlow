import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Product, Sale } from '@/database/schema';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertTriangle,
  XCircle,
  Plus,
  BarChart3,
  Receipt,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type DateFilter = 'today' | '7days' | '30days' | 'thisMonth' | 'all';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation(['dashboard', 'common', 'nav']);
  const navigate = useNavigate();
  const { currency, currencyLocale, language } = useAppStore();
  const isRTL = language === 'ar';

  const [dateFilter, setDateFilter] = useState<DateFilter>('30days');

  // Live queries
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const sales = useLiveQuery(() => db.sales.orderBy('createdAt').reverse().toArray()) ?? [];
  const customers = useLiveQuery(() => db.customers.toArray()) ?? [];
  const expenses = useLiveQuery(() => db.expenses.toArray()) ?? [];
  const saleItems = useLiveQuery(() => db.saleItems.toArray()) ?? [];

  // Filter sales by date
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 86400000;
    const thirtyDaysAgo = now.getTime() - 30 * 86400000;
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return sales.filter((s) => {
      const time = new Date(s.createdAt).getTime();
      switch (dateFilter) {
        case 'today':
          return time >= todayStart;
        case '7days':
          return time >= sevenDaysAgo;
        case '30days':
          return time >= thirtyDaysAgo;
        case 'thisMonth':
          return time >= thisMonthStart;
        case 'all':
        default:
          return true;
      }
    });
  }, [sales, dateFilter]);

  // Statistics
  const activeProducts = useMemo(() => products.filter((p) => p.status === 'active'), [products]);
  const lowStockProducts = useMemo(
    () => activeProducts.filter((p) => p.quantity > 0 && p.quantity <= p.minimumStock),
    [activeProducts]
  );
  const outOfStockProducts = useMemo(
    () => activeProducts.filter((p) => p.quantity === 0),
    [activeProducts]
  );

  const inventoryValue = useMemo(() => {
    return activeProducts.reduce((sum, p) => sum + p.quantity * p.purchasePrice, 0);
  }, [activeProducts]);

  const totalSalesRevenue = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  }, [filteredSales]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const netProfit = useMemo(() => {
    const saleIds = new Set(filteredSales.map((s) => s.id));
    const relevantItems = saleItems.filter((item) => saleIds.has(item.saleId));
    const cogs = relevantItems.reduce((sum, item) => sum + item.purchasePrice * item.quantity, 0);
    return Math.max(0, totalSalesRevenue - cogs - totalExpenses);
  }, [filteredSales, saleItems, totalSalesRevenue, totalExpenses]);

  // Chart data
  const chartData = useMemo(() => {
    const map: Record<string, { date: string; revenue: number; count: number }> = {};
    const sorted = [...filteredSales].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    sorted.forEach((sale) => {
      const d = new Date(sale.createdAt);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (!map[key]) {
        map[key] = { date: key, revenue: 0, count: 0 };
      }
      map[key].revenue += sale.totalAmount;
      map[key].count += 1;
    });

    const data = Object.values(map);
    return data.length > 0
      ? data
      : [
          { date: '1', revenue: 0, count: 0 },
          { date: '2', revenue: 0, count: 0 },
          { date: '3', revenue: 0, count: 0 },
        ];
  }, [filteredSales]);

  // Top products
  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string; quantity: number; revenue: number }> = {};
    saleItems.forEach((item) => {
      if (!counts[item.productId]) {
        counts[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
      }
      counts[item.productId].quantity += item.quantity;
      counts[item.productId].revenue += item.totalAmount;
    });
    return Object.values(counts).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [saleItems]);

  const isEmpty = products.length === 0 && sales.length === 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Page Header & Apple Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t('dashboard:title')}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            نظرة عامة على أداء المتجر والمبيعات والتدفق المالي
          </p>
        </div>

        {/* Apple Segmented Filter Pill */}
        <div className="apple-segmented self-start sm:self-auto shadow-2xs">
          {(
            [
              { key: 'today', label: t('common:today') },
              { key: '7days', label: t('common:last7Days') },
              { key: '30days', label: t('common:last30Days') },
              { key: 'thisMonth', label: t('common:thisMonth') },
              { key: 'all', label: t('common:all') },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setDateFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                dateFilter === tab.key
                  ? 'bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)] font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isEmpty ? (
        <div className="apple-card p-12 text-center max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="stroke-[2.2]" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">{t('dashboard:emptyState')}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-6">
            ابدأ بإضافة منتجاتك لإدارة المبيعات والمخزون، أو أنشئ عملية بيع تجريبية في نقطة البيع.
          </p>
          <div className="flex justify-center gap-2.5">
            <button
              onClick={() => navigate('/products')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>{t('dashboard:addProduct')}</span>
            </button>
            <button
              onClick={() => navigate('/pos')}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl text-xs font-semibold hover:bg-secondary/80 transition-colors flex items-center gap-1.5"
            >
              <ShoppingCart size={14} />
              <span>{t('dashboard:newSale')}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Apple KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sales Revenue */}
            <div className="apple-card p-5 apple-card-hover flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground tracking-tight">
                    {t('dashboard:totalSales')}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
                    <Receipt size={17} className="stroke-[2.2]" />
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                  {formatCurrency(totalSalesRevenue, currency, currencyLocale)}
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-xs text-[#34C759] font-semibold">
                <TrendingUp size={13} className="stroke-[2.4]" />
                <span className="tabular-nums">{filteredSales.length} {t('dashboard:salesCount')}</span>
              </div>
            </div>

            {/* Net Profit */}
            <div className="apple-card p-5 apple-card-hover flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground tracking-tight">
                    {t('dashboard:netProfit')}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#34C759]/10 text-[#34C759] flex items-center justify-center">
                    <DollarSign size={17} className="stroke-[2.2]" />
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                  {formatCurrency(netProfit, currency, currencyLocale)}
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground font-medium">
                <span>المصاريف: </span>
                <span className="tabular-nums font-semibold text-foreground">
                  {formatCurrency(totalExpenses, currency, currencyLocale)}
                </span>
              </div>
            </div>

            {/* Products & Inventory Value */}
            <div className="apple-card p-5 apple-card-hover flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground tracking-tight">
                    {t('dashboard:totalProducts')}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#AF52DE]/10 text-[#AF52DE] flex items-center justify-center">
                    <Package size={17} className="stroke-[2.2]" />
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                  {formatNumber(activeProducts.length, currencyLocale)}
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground font-medium">
                <span>قيمة المخزون: </span>
                <span className="tabular-nums font-semibold text-foreground">
                  {formatCurrency(inventoryValue, currency, currencyLocale)}
                </span>
              </div>
            </div>

            {/* Stock Warnings */}
            <div className="apple-card p-5 apple-card-hover flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground tracking-tight">
                    {t('dashboard:lowStock')}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center">
                    <AlertTriangle size={17} className="stroke-[2.2]" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 tabular-nums">
                  <span className="text-2xl font-bold text-[#FF9500]">{lowStockProducts.length}</span>
                  <span className="text-xs text-muted-foreground font-semibold">•</span>
                  <span className="text-sm font-semibold text-[#FF3B30]">{outOfStockProducts.length} منتهي</span>
                </div>
              </div>
              <div
                onClick={() => navigate('/inventory')}
                className="flex items-center gap-1 mt-3 text-[11px] text-primary font-semibold cursor-pointer hover:underline"
              >
                <span>فحص النواقص</span>
                {isRTL ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
              </div>
            </div>
          </div>

          {/* Charts & Quick Actions Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Apple Area Chart */}
            <div className="lg:col-span-2 apple-card p-5 md:p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground tracking-tight">{t('dashboard:revenueChart')}</h3>
                  <p className="text-[11px] text-muted-foreground font-medium">{t('dashboard:salesTrends')}</p>
                </div>
                <div className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold tabular-nums">
                  {currency}
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="appleGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '0.875rem',
                        fontSize: '11px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      }}
                      formatter={(val: number) => [`${val.toFixed(2)} ${currency}`, t('dashboard:revenue')]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.2}
                      fillOpacity={1}
                      fill="url(#appleGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Best Sellers & Quick Actions */}
            <div className="apple-card p-5 md:p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-tight mb-0.5">{t('dashboard:bestSelling')}</h3>
                <p className="text-[11px] text-muted-foreground font-medium mb-3">المنتجات الأكثر مبيعاً</p>

                {topProducts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-xs">
                    لا توجد بيانات مبيعات كافية
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topProducts.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate max-w-[150px]">
                          <span className="w-5 h-5 rounded-md bg-card flex items-center justify-center font-bold text-[10px] text-muted-foreground shadow-2xs">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-foreground truncate">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-2.5 tabular-nums text-start">
                          <span className="text-muted-foreground text-[11px]">{p.quantity} قطع</span>
                          <span className="font-bold text-foreground">
                            {formatCurrency(p.revenue, currency, currencyLocale)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-black/[0.04] dark:border-white/[0.05] mt-4 space-y-2">
                <button
                  onClick={() => navigate('/pos')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 shadow-sm shadow-primary/25 transition-all"
                >
                  <ShoppingCart size={15} />
                  <span>{t('dashboard:newSale')} (POS)</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => navigate('/products')}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] text-foreground rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Plus size={13} />
                    <span>{t('dashboard:addProduct')}</span>
                  </button>
                  <button
                    onClick={() => navigate('/reports')}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] text-foreground rounded-xl text-xs font-semibold transition-colors"
                  >
                    <BarChart3 size={13} />
                    <span>{t('dashboard:viewReports')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions Table */}
          <div className="apple-card overflow-hidden">
            <div className="p-4 md:p-5 border-b border-black/[0.04] dark:border-white/[0.05] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-tight">{t('dashboard:recentTransactions')}</h3>
                <p className="text-[11px] text-muted-foreground font-medium">أحدث الفواتير والمعاملات الصادرة</p>
              </div>
              <button
                onClick={() => navigate('/sales')}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span>عرض الكل</span>
                {isRTL ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-black/[0.02] dark:bg-white/[0.02] text-muted-foreground text-[10px] uppercase font-bold tracking-wider border-b border-black/[0.04] dark:border-white/[0.05]">
                  <tr>
                    <th className="py-2.5 px-4 text-start">رقم الفاتورة</th>
                    <th className="py-2.5 px-4 text-start">العميل</th>
                    <th className="py-2.5 px-4 text-start">التاريخ والوقت</th>
                    <th className="py-2.5 px-4 text-start">المبلغ الإجمالي</th>
                    <th className="py-2.5 px-4 text-start">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05] tabular-nums">
                  {sales.slice(0, 5).map((sale) => (
                    <tr key={sale.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-foreground">{sale.saleNumber}</td>
                      <td className="py-3 px-4 font-semibold text-foreground">{sale.customerName || 'عميل عام'}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(sale.createdAt).toLocaleDateString(currencyLocale, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-foreground">
                        {formatCurrency(sale.totalAmount, currency, currencyLocale)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sale.status === 'completed'
                              ? 'bg-[#34C759]/15 text-[#34C759]'
                              : sale.status === 'held'
                              ? 'bg-[#FF9500]/15 text-[#FF9500]'
                              : 'bg-[#FF3B30]/15 text-[#FF3B30]'
                          }`}
                        >
                          {sale.status === 'completed' ? 'مكتملة' : sale.status === 'held' ? 'معلقة' : 'ملغاة'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {sales.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                        لا توجد مبيعات حتى الآن
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
