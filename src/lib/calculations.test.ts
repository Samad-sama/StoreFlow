import { describe, it, expect } from 'vitest';
import { safeDecimal, calculateTax, calculateDiscount } from './utils';

describe('Financial & Business Logic Calculations', () => {
  it('should calculate safe decimal rounding properly without floating point bugs', () => {
    // 0.1 + 0.2 in JS gives 0.30000000000000004
    const floatSum = 0.1 + 0.2;
    expect(safeDecimal(floatSum)).toBe(0.3);
  });

  it('should correctly calculate tax amount', () => {
    const subtotal = 250;
    const taxRate = 20; // 20%
    const tax = calculateTax(subtotal, taxRate);
    expect(tax).toBe(50);
  });

  it('should correctly calculate percentage discounts', () => {
    const subtotal = 400;
    const discount = 15; // 15%
    const result = calculateDiscount(subtotal, discount, true);
    expect(result).toBe(60);
  });

  it('should correctly calculate fixed discounts and not exceed the total amount', () => {
    const subtotal = 100;
    const discount = 150; // discount greater than subtotal
    const result = calculateDiscount(subtotal, discount, false);
    expect(result).toBe(100);
  });
});
