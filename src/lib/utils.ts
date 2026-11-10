import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Formats currency reliably across languages.
 * Displays "د.ج" for Arabic and "DA" for English and French.
 */
export function formatCurrency(
  amount: number,
  currency: string = 'DZD',
  locale?: string
): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  
  // Detect active language from document or locale argument
  const docLang = typeof document !== 'undefined' ? document.documentElement.lang : 'ar';
  const activeLocale = locale || (docLang === 'fr' ? 'fr-DZ' : docLang === 'en' ? 'en-US' : 'ar-DZ');
  const isArabic = activeLocale.startsWith('ar') || docLang === 'ar';

  // Format numeric part with thousands separator and 2 decimals
  const formattedNumber = new Intl.NumberFormat(isArabic ? 'ar-DZ' : 'fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);

  // Default is Algerian Dinar
  const isDinar =
    !currency ||
    currency === 'DZD' ||
    currency === 'DA' ||
    currency === 'د.ج' ||
    currency === 'MAD';

  if (isDinar) {
    if (isArabic) {
      return `${formattedNumber} د.ج`;
    }
    return `${formattedNumber} DA`;
  }

  // Fallback for other standard currencies (e.g. USD, EUR)
  try {
    return new Intl.NumberFormat(activeLocale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    return `${formattedNumber} ${currency}`;
  }
}

export function formatNumber(value: number, locale: string = 'ar-DZ'): string {
  const safeVal = Number.isFinite(value) ? value : 0;
  const docLang = typeof document !== 'undefined' ? document.documentElement.lang : 'ar';
  const effectiveLocale = docLang === 'ar' ? 'ar-DZ' : docLang === 'fr' ? 'fr-FR' : 'en-US';
  return new Intl.NumberFormat(effectiveLocale).format(safeVal);
}

export function safeDecimal(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function calculateTax(subtotal: number, taxRate: number): number {
  if (taxRate <= 0 || subtotal <= 0) return 0;
  return safeDecimal(subtotal * (taxRate / 100));
}

export function calculateDiscount(
  amount: number,
  discount: number,
  isPercentage: boolean = false
): number {
  if (discount <= 0 || amount <= 0) return 0;
  if (isPercentage) {
    return safeDecimal(amount * (discount / 100));
  }
  return safeDecimal(Math.min(discount, amount));
}
