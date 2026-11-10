import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/hooks/useTheme';
import { useDirection } from '@/hooks/useDirection';
import Layout from '@/components/layout/Layout';

// Lazy-loaded pages
const Onboarding = lazy(() => import('@/features/onboarding/Onboarding'));
const Dashboard = lazy(() => import('@/features/dashboard/Dashboard'));
const Products = lazy(() => import('@/features/products/Products'));
const Categories = lazy(() => import('@/features/categories/Categories'));
const Inventory = lazy(() => import('@/features/inventory/Inventory'));
const POS = lazy(() => import('@/features/pos/POS'));
const Sales = lazy(() => import('@/features/sales/Sales'));
const Customers = lazy(() => import('@/features/customers/Customers'));
const Suppliers = lazy(() => import('@/features/suppliers/Suppliers'));
const Purchases = lazy(() => import('@/features/purchases/Purchases'));
const Expenses = lazy(() => import('@/features/expenses/Expenses'));
const Reports = lazy(() => import('@/features/reports/Reports'));
const Employees = lazy(() => import('@/features/employees/Employees'));
const Settings = lazy(() => import('@/features/settings/Settings'));

// Loading fallback
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App: React.FC = () => {
  const { i18n } = useTranslation();
  const { isFirstRun, language } = useAppStore();

  // Initialize theme
  useTheme();
  // Initialize direction
  useDirection();

  // Sync i18n language with store
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Onboarding */}
        <Route path="/onboarding" element={
          isFirstRun ? <Onboarding /> : <Navigate to="/dashboard" replace />
        } />

        {/* Main app with layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Root redirect */}
        <Route path="/" element={
          <Navigate to={isFirstRun ? '/onboarding' : '/dashboard'} replace />
        } />
        <Route path="*" element={
          <Navigate to={isFirstRun ? '/onboarding' : '/dashboard'} replace />
        } />
      </Routes>
    </Suspense>
  );
};

export default App;
