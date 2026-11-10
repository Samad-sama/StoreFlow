import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Common
import arCommon from './locales/ar/common.json';
import enCommon from './locales/en/common.json';
import frCommon from './locales/fr/common.json';

// Navigation
import arNav from './locales/ar/nav.json';
import enNav from './locales/en/nav.json';
import frNav from './locales/fr/nav.json';

// Dashboard
import arDashboard from './locales/ar/dashboard.json';
import enDashboard from './locales/en/dashboard.json';
import frDashboard from './locales/fr/dashboard.json';

// Onboarding
import arOnboarding from './locales/ar/onboarding.json';
import enOnboarding from './locales/en/onboarding.json';
import frOnboarding from './locales/fr/onboarding.json';

// Settings
import arSettings from './locales/ar/settings.json';
import enSettings from './locales/en/settings.json';
import frSettings from './locales/fr/settings.json';

const resources = {
  ar: {
    common: arCommon,
    nav: arNav,
    dashboard: arDashboard,
    onboarding: arOnboarding,
    settings: arSettings,
  },
  en: {
    common: enCommon,
    nav: enNav,
    dashboard: enDashboard,
    onboarding: enOnboarding,
    settings: enSettings,
  },
  fr: {
    common: frCommon,
    nav: frNav,
    dashboard: frDashboard,
    onboarding: frOnboarding,
    settings: frSettings,
  },
};

const savedLanguage = (() => {
  try {
    const stored = localStorage.getItem('storeflow-app');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.language || 'ar';
    }
  } catch {
    // ignore
  }
  return 'ar';
})();

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage,
  fallbackLng: 'en',
  ns: ['common', 'nav', 'dashboard', 'onboarding', 'settings'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
