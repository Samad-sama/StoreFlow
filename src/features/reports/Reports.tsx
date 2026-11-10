import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/database/schema';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  Download,
  Printer,
  DollarSign,
  TrendingUp,
  Package,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const Reports: React.FC = () => {
  const { t } = useTranslation(['common', 'nav']);
  const { currency, currencyLocale } = useAppStore();

  const sales = useLiveQuery(() => db.sales.toArray()) ?? [];
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const expenses = useLiveQuery(() => db.expenses.toArray()) ?? [];

  const [reportType, setReportType] = useState<'sales' | 'inventory' | 'profit'>('sales');

  const totalSalesRevenue = useMemo(() => sales.reduce((sum, s) => sum + s.totalAmount, 0), [sales]);
  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const totalInventoryCost = useMemo(
    () => products.reduce((sum, p) => sum + p.quantity * p.purchasePrice, 0),
    [products]
  );
  const totalInventoryRetail = useMemo(
    () => products.reduce((sum, p) => sum + p.quantity * p.sellingPrice, 0),
    [products]
  );

  const salesByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach((s) => {
      const d = new Date(s.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + s.totalAmount;
    });
    return Object.entries(map).map(([month, total]) => ({ month, total }));
  }, [sales]);

  const inventoryCategoryData = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.categoryId || 'عام';
      map[cat] = (map[cat] || 0) + p.quantity * p.sellingPrice;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [products]);

  // Apple SF chart palette
  const APPLE_COLORS = ['#0071E3', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#5856D6'];

  const exportCSV = () => {
    let csv = '';
    if (reportType === 'sales') {
      csv = 'Invoice,Customer,Date,Total,Status\n';
      sales.forEach((s) => {
        csv += `"${s.saleNumber}","${s.customerName}","${s.createdAt}",${s.totalAmount},"${s.status}"\n`;
      });
    } else if (reportType === 'inventory') {
      csv = 'Product,SKU,Quantity,Cost,Price,Valuation\n';
      products.forEach((p) => {
        csv += `"${p.name}","${p.sku}",${p.quantity},${p.purchasePrice},${p.sellingPrice},${p.quantity * p.sellingPrice}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storeflow-${reportType}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('nav:reports')} والتحليلات</h1>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            تقارير تفصيلية للأداء المالي، المبيعات وقيمة المخزون
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] text-foreground rounded-xl text-xs font-semibold transition-colors"
          >
            <Download size={13} />
            <span>تصدير CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-bold shadow-sm shadow-primary/25 transition-all"
          >
            <Printer size={13} />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* Apple Segmented Report Selector */}
      <div className="apple-segmented self-start w-fit shadow-2xs">
        <button
          onClick={() => setReportType('sales')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
            reportType === 'sales'
              ? 'bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)] font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <DollarSign size={14} />
          <span>تقرير المبيعات</span>
        </button>
        <button
          onClick={() => setReportType('inventory')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
            reportType === 'inventory'
              ? 'bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)] font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package size={14} />
          <span>تقييم المخزون</span>
        </button>
        <button
          onClick={() => setReportType('profit')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
            reportType === 'profit'
              ? 'bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)] font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingUp size={14} />
          <span>الأرباح والمصروفات</span>
        </button>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
        <div className="apple-card p-5 apple-card-hover">
          <span className="text-xs font-semibold text-muted-foreground block mb-1">إجمالي المبيعات</span>
          <span className="text-2xl font-bold text-foreground">
            {formatCurrency(totalSalesRevenue, currency, currencyLocale)}
          </span>
          <span className="text-[11px] text-muted-foreground block mt-1">{sales.length} معاملة بيع</span>
        </div>
        <div className="apple-card p-5 apple-card-hover">
          <span className="text-xs font-semibold text-muted-foreground block mb-1">تكلفة المخزون (شراء)</span>
          <span className="text-2xl font-bold text-foreground">
            {formatCurrency(totalInventoryCost, currency, currencyLocale)}
          </span>
          <span className="text-[11px] text-muted-foreground block mt-1">{products.length} صنف مسجل</span>
        </div>
        <div className="apple-card p-5 apple-card-hover">
          <span className="text-xs font-semibold text-muted-foreground block mb-1">القيمة البيعية للمخزون</span>
          <span className="text-2xl font-bold text-[#34C759]">
            {formatCurrency(totalInventoryRetail, currency, currencyLocale)}
          </span>
          <span className="text-[11px] text-muted-foreground block mt-1">القيمة السوقية</span>
        </div>
        <div className="apple-card p-5 apple-card-hover">
          <span className="text-xs font-semibold text-muted-foreground block mb-1">إجمالي المصروفات</span>
          <span className="text-2xl font-bold text-[#FF3B30]">
            {formatCurrency(totalExpenses, currency, currencyLocale)}
          </span>
          <span className="text-[11px] text-muted-foreground block mt-1">{expenses.length} عملية صرف</span>
        </div>
      </div>

      {/* Sales Analytics Chart */}
      {reportType === 'sales' && (
        <div className="apple-card p-6">
          <h3 className="text-sm font-bold text-foreground tracking-tight mb-4">توزيع المبيعات الإجمالية</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: number) => [`${val.toFixed(2)} ${currency}`, 'المبيعات']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.875rem',
                    fontSize: '11px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Inventory Breakdown */}
      {reportType === 'inventory' && (
        <div className="apple-card p-6">
          <h3 className="text-sm font-bold text-foreground tracking-tight mb-4">تقييم المخزون حسب الأقسام</h3>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryCategoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {inventoryCategoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={APPLE_COLORS[index % APPLE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`${val.toFixed(2)} ${currency}`, 'القيمة']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.875rem',
                    fontSize: '11px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Profit & Loss */}
      {reportType === 'profit' && (
        <div className="apple-card p-6 space-y-4 text-xs tabular-nums">
          <h3 className="text-sm font-bold text-foreground tracking-tight">بيان الأرباح والخسائر التقديري</h3>
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05] border border-black/[0.04] dark:border-white/[0.05] rounded-2xl p-4 bg-black/[0.015] dark:bg-white/[0.015]">
            <div className="py-2.5 flex justify-between font-bold text-sm">
              <span className="text-foreground">إجمالي الإيرادات من المبيعات:</span>
              <span className="text-[#34C759] font-mono">{formatCurrency(totalSalesRevenue, currency, currencyLocale)}</span>
            </div>
            <div className="py-2.5 flex justify-between font-bold text-sm">
              <span className="text-foreground">إجمالي المصروفات التشغيلية:</span>
              <span className="text-[#FF3B30] font-mono">-{formatCurrency(totalExpenses, currency, currencyLocale)}</span>
            </div>
            <div className="pt-3 flex justify-between font-black text-base text-foreground">
              <span>صافي الفائض التشغيلي:</span>
              <span className="text-primary font-mono">
                {formatCurrency(Math.max(0, totalSalesRevenue - totalExpenses), currency, currencyLocale)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
