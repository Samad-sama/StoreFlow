import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/appStore';

export function useDirection() {
  const { i18n } = useTranslation();
  const { language } = useAppStore();

  useEffect(() => {
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    const lang = language;
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [language]);

  return language === 'ar' ? 'rtl' : 'ltr';
}
