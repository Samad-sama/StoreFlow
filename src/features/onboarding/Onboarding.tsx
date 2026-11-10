import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { Store, Globe, Receipt, Database, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { seedDemoData } from '@/database/seedData';

const STEPS = 4;

export const Onboarding: React.FC = () => {
  const { t, i18n } = useTranslation('onboarding');
  const navigate = useNavigate();
  const {
    setStoreName,
    setBusinessType,
    setLanguage,
    setCurrency,
    setTaxRate,
    completeOnboarding,
    setDemoDataLoaded,
    language,
  } = useAppStore();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    storeName: '',
    businessType: 'general',
    language: language || 'ar',
    currency: 'MAD',
    taxEnabled: true,
    taxRate: 20,
    loadSample: true,
  });

  const isRTL = form.language === 'ar';
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;
  const BackIcon = isRTL ? ChevronRight : ChevronLeft;

  const businessTypes = [
    'general', 'clothing', 'supermarket', 'grocery', 'electronics',
    'phones', 'perfume', 'cosmetics', 'pharmacy', 'furniture',
    'hardware', 'bookstore', 'shoes', 'restaurant', 'wholesale', 'other',
  ];

  const currencies = ['MAD', 'USD', 'EUR', 'SAR', 'AED', 'EGP', 'TND', 'DZD', 'GBP'];

  const currencyLocales: Record<string, string> = {
    MAD: 'ar-MA', USD: 'en-US', EUR: 'fr-FR', SAR: 'ar-SA',
    AED: 'ar-AE', EGP: 'ar-EG', TND: 'ar-TN', DZD: 'ar-DZ', GBP: 'en-GB',
  };

  const handleLanguageChange = (lng: string) => {
    setForm(f => ({ ...f, language: lng }));
    i18n.changeLanguage(lng);
    setLanguage(lng);
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      setStoreName(form.storeName || 'StoreFlow');
      setBusinessType(form.businessType);
      setLanguage(form.language);
      setCurrency(form.currency, currencyLocales[form.currency] || 'en-US');
      setTaxRate(form.taxEnabled ? form.taxRate : 0);

      if (form.loadSample) {
        await seedDemoData(form.currency);
        setDemoDataLoaded(true);
      } else {
        setDemoDataLoaded(false);
      }

      completeOnboarding();
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    } finally {
      setLoading(false);
    }
  };

  const stepIcons = [
    <Store size={18} className="stroke-[2.2]" />,
    <Globe size={18} className="stroke-[2.2]" />,
    <Receipt size={18} className="stroke-[2.2]" />,
    <Database size={18} className="stroke-[2.2]" />,
  ];

  const stepTitles = [
    t('step1Title'),
    t('step2Title'),
    t('step3Title'),
    t('step4Title'),
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#161618] flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
            <Store size={30} className="stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-xs mt-1.5 font-medium">{t('subtitle')}</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: STEPS }).map((_, i) => (
            <div key={i} className="flex items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold transition-all duration-200',
                  i === step
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-xs'
                    : i < step
                    ? 'bg-primary/20 text-primary'
                    : 'bg-card border border-black/[0.06] dark:border-white/[0.07] text-muted-foreground'
                )}
              >
                {i < step ? <Check size={16} className="stroke-[2.6]" /> : stepIcons[i]}
              </div>
              {i < STEPS - 1 && (
                <div
                  className={cn(
                    'w-8 h-0.5 mx-1.5 rounded-full transition-colors',
                    i < step ? 'bg-primary/50' : 'bg-black/[0.06] dark:bg-white/[0.08]'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card Container (Apple Setup Assistant Style) */}
        <div className="apple-card p-6 md:p-8 shadow-apple-card">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-black/[0.04] dark:border-white/[0.05]">
            <h2 className="text-base font-bold text-foreground tracking-tight">{stepTitles[step]}</h2>
            <span className="text-[11px] font-bold text-muted-foreground px-2.5 py-0.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-full tabular-nums">
              {step + 1} / {STEPS}
            </span>
          </div>

          {/* Step 1: Store info */}
          {step === 0 && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold mb-1 text-foreground">{t('storeName')}</label>
                <input
                  type="text"
                  value={form.storeName}
                  onChange={e => setForm(f => ({ ...f, storeName: e.target.value }))}
                  placeholder={t('storeNamePlaceholder')}
                  className="apple-input w-full"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1 text-foreground">{t('businessType')}</label>
                <select
                  value={form.businessType}
                  onChange={e => setForm(f => ({ ...f, businessType: e.target.value }))}
                  className="apple-select w-full"
                >
                  {businessTypes.map(bt => (
                    <option key={bt} value={bt} className="bg-card text-foreground">{t(`businessTypes.${bt}`)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Language & currency */}
          {step === 1 && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold mb-1 text-foreground">{t('language')}</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { code: 'ar', label: 'العربية' },
                    { code: 'en', label: 'English' },
                    { code: 'fr', label: 'Français' },
                  ].map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageChange(lang.code)}
                      className={cn(
                        'px-3 py-2.5 rounded-xl text-xs font-bold border transition-all',
                        form.language === lang.code
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs shadow-primary/25'
                          : 'bg-card border-black/[0.06] dark:border-white/[0.08] text-foreground hover:bg-black/[0.03]'
                      )}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1 text-foreground">{t('currency')}</label>
                <select
                  value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  className="apple-select w-full"
                >
                  {currencies.map(c => (
                    <option key={c} value={c} className="bg-card text-foreground">{t(`currencies.${c}`)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Tax */}
          {step === 2 && (
            <div className="space-y-4 text-xs">
              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] cursor-pointer">
                <input
                  type="checkbox"
                  id="taxEnabled"
                  checked={form.taxEnabled}
                  onChange={e => setForm(f => ({ ...f, taxEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <span className="font-semibold text-foreground">{t('taxEnabled')}</span>
              </label>

              {form.taxEnabled && (
                <div className="pt-2 animate-fade-in">
                  <label className="block text-[11px] font-semibold mb-1 text-foreground">{t('taxRate')}</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.taxRate}
                      onChange={e => setForm(f => ({ ...f, taxRate: Number(e.target.value) }))}
                      min={0}
                      max={100}
                      step={0.5}
                      className="apple-input w-full font-bold tabular-nums"
                    />
                    <span className="absolute end-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Sample data */}
          {step === 3 && (
            <div className="space-y-4 text-xs">
              <label className="flex items-start gap-3.5 p-4 bg-primary/5 border border-primary/20 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
                <input
                  type="checkbox"
                  id="loadSample"
                  checked={form.loadSample}
                  onChange={e => setForm(f => ({ ...f, loadSample: e.target.checked }))}
                  className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground">{t('loadSampleData')}</span>
                    <Sparkles size={13} className="text-[#FF9500] fill-[#FF9500]" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed font-medium">
                    {t('sampleDataDescription')}
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-black/[0.04] dark:border-white/[0.05]">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-xl"
              >
                <BackIcon size={15} />
                <span>{t('back')}</span>
              </button>
            ) : (
              <div />
            )}

            {step < STEPS - 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 shadow-sm shadow-primary/25 transition-all"
              >
                <span>{t('continue')}</span>
                <NextIcon size={15} />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 shadow-sm shadow-primary/25 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check size={16} className="stroke-[2.6]" />
                )}
                <span>{t('finish')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
