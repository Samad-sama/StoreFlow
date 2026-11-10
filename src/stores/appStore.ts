import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppTheme =
  | 'light'
  | 'dark'
  | 'emerald'
  | 'indigo'
  | 'amber'
  | 'midnight'
  | 'custom';

export type FontScale = 'normal' | 'large' | 'xlarge';

interface AppState {
  // Store info
  storeName: string;
  storeLogoUrl: string;
  businessType: string;
  storePhone: string;
  storeAddress: string;
  
  // UI & Layout
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  
  // Themes & Customization
  theme: AppTheme;
  customPrimaryColor: string;
  fontScale: FontScale;
  
  // Regional & Tax Settings
  language: string;
  currency: string;
  currencyLocale: string;
  enableTax: boolean;
  taxRate: number;
  dateFormat: string;
  
  // First run & Status
  isFirstRun: boolean;
  demoDataLoaded: boolean;
  
  // Actions
  setStoreName: (name: string) => void;
  setStoreLogoUrl: (url: string) => void;
  setBusinessType: (type: string) => void;
  setStorePhone: (phone: string) => void;
  setStoreAddress: (address: string) => void;
  toggleSidebar: () => void;
  setSidebarMobileOpen: (open: boolean) => void;
  setTheme: (theme: AppTheme) => void;
  setCustomPrimaryColor: (color: string) => void;
  setFontScale: (scale: FontScale) => void;
  setLanguage: (lang: string) => void;
  setCurrency: (currency: string, locale: string) => void;
  setEnableTax: (enabled: boolean) => void;
  setTaxRate: (rate: number) => void;
  setDateFormat: (format: string) => void;
  completeOnboarding: () => void;
  setDemoDataLoaded: (loaded: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      storeName: 'StoreFlow',
      storeLogoUrl: '',
      businessType: '',
      storePhone: '0550 00 00 00',
      storeAddress: 'الجزائر العاصمة',
      
      sidebarCollapsed: false,
      sidebarMobileOpen: false,
      
      // Default Theme & Customizer
      theme: 'light',
      customPrimaryColor: '#0071E3',
      fontScale: 'normal',
      
      // Default Algerian Dinar (د.ج / DA) & Tax disabled or enabled with 0
      language: 'ar',
      currency: 'DZD',
      currencyLocale: 'ar-DZ',
      enableTax: false, // Default tax is disabled unless enabled
      taxRate: 0,
      dateFormat: 'dd/MM/yyyy',
      
      isFirstRun: true,
      demoDataLoaded: false,
      
      setStoreName: (name) => set({ storeName: name }),
      setStoreLogoUrl: (url) => set({ storeLogoUrl: url }),
      setBusinessType: (type) => set({ businessType: type }),
      setStorePhone: (phone) => set({ storePhone: phone }),
      setStoreAddress: (address) => set({ storeAddress: address }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),
      setTheme: (theme) => set({ theme }),
      setCustomPrimaryColor: (color) => set({ customPrimaryColor: color }),
      setFontScale: (fontScale) => set({ fontScale }),
      setLanguage: (lang) => {
        const locale = lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US';
        set({ language: lang, currencyLocale: locale });
      },
      setCurrency: (currency, locale) => set({ currency, currencyLocale: locale }),
      setEnableTax: (enableTax) => set({ enableTax }),
      setTaxRate: (rate) => set({ taxRate: rate }),
      setDateFormat: (format) => set({ dateFormat: format }),
      completeOnboarding: () => set({ isFirstRun: false }),
      setDemoDataLoaded: (loaded) => set({ demoDataLoaded: loaded }),
    }),
    {
      name: 'storeflow-app',
    }
  )
);
