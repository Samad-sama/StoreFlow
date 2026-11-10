import { useEffect } from 'react';
import { useAppStore, AppTheme, FontScale } from '@/stores/appStore';

/**
 * Converts Hex (#RRGGBB) to HSL string format: "H S% L%"
 */
function hexToHSL(hex: string): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function useTheme() {
  const { theme, setTheme, customPrimaryColor, setCustomPrimaryColor, fontScale, setFontScale } = useAppStore();

  useEffect(() => {
    const root = document.documentElement;

    // 1. Remove existing theme classes
    root.classList.remove(
      'light',
      'dark',
      'theme-emerald',
      'theme-indigo',
      'theme-amber',
      'theme-midnight',
      'theme-custom'
    );

    // 2. Set Font Scale
    root.setAttribute('data-font-scale', fontScale || 'normal');

    // 3. Apply Theme Class
    if (theme === 'dark' || theme === 'midnight') {
      root.classList.add('dark');
      if (theme === 'midnight') {
        root.classList.add('theme-midnight');
      }
    } else if (theme === 'emerald') {
      root.classList.add('theme-emerald');
    } else if (theme === 'indigo') {
      root.classList.add('theme-indigo');
    } else if (theme === 'amber') {
      root.classList.add('theme-amber');
    } else if (theme === 'custom') {
      root.classList.add('theme-custom');
      if (customPrimaryColor) {
        try {
          const hsl = hexToHSL(customPrimaryColor);
          root.style.setProperty('--primary', hsl);
          root.style.setProperty('--ring', hsl);
        } catch (e) {
          console.error('Invalid custom color:', e);
        }
      }
    } else {
      // Default light
      root.classList.add('light');
    }

    if (theme !== 'custom') {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--ring');
    }
  }, [theme, customPrimaryColor, fontScale]);

  return {
    theme,
    setTheme,
    customPrimaryColor,
    setCustomPrimaryColor,
    fontScale,
    setFontScale,
  };
}
