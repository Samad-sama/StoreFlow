import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/database/schema';

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
}

export type POSPaymentMode =
  | 'full_cash'
  | 'full_card'
  | 'full_transfer'
  | 'full_debt'
  | 'partial_debt';

export interface HeldOrder {
  id: string;
  name: string;
  date: string;
  cart: CartItem[];
  customerId: string;
}

interface POSState {
  cart: CartItem[];
  selectedCustomerId: string;
  cartDiscount: number;
  cartDiscountType: 'fixed' | 'percentage';
  paymentMode: POSPaymentMode;
  receivedInput: string;
  partialPaidInput: string;
  heldOrders: HeldOrder[];

  // Actions
  addToCart: (product: Product, customPrice?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  setQuantity: (productId: string, qty: number) => void;
  updateUnitPrice: (productId: string, newPrice: number) => void;
  setSelectedCustomerId: (id: string) => void;
  setCartDiscount: (discount: number, type?: 'fixed' | 'percentage') => void;
  setPaymentMode: (mode: POSPaymentMode) => void;
  setReceivedInput: (val: string) => void;
  setPartialPaidInput: (val: string) => void;
  clearCart: () => void;
  holdOrder: (note?: string) => void;
  resumeOrder: (id: string) => void;
  deleteHeldOrder: (id: string) => void;
}

export const usePOSStore = create<POSState>()(
  persist(
    (set, get) => ({
      cart: [],
      selectedCustomerId: '',
      cartDiscount: 0,
      cartDiscountType: 'fixed',
      paymentMode: 'full_cash',
      receivedInput: '',
      partialPaidInput: '',
      heldOrders: [],

      addToCart: (product: Product, customPrice?: number) => {
        const { cart } = get();
        const existingIdx = cart.findIndex((i) => i.product.id === product.id);
        const price = customPrice !== undefined ? customPrice : product.sellingPrice;

        if (existingIdx >= 0) {
          const updated = [...cart];
          updated[existingIdx].quantity += 1;
          set({ cart: updated });
        } else {
          set({
            cart: [
              ...cart,
              {
                product,
                quantity: 1,
                unitPrice: price,
                originalPrice: product.sellingPrice,
                discount: 0,
                discountType: 'percentage',
              },
            ],
          });
        }
      },

      removeFromCart: (productId: string) => {
        set({ cart: get().cart.filter((i) => i.product.id !== productId) });
      },

      updateQuantity: (productId: string, delta: number) => {
        const updated = get()
          .cart.map((item) => {
            if (item.product.id === productId) {
              const newQty = item.quantity + delta;
              return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
          })
          .filter(Boolean) as CartItem[];
        set({ cart: updated });
      },

      setQuantity: (productId: string, qty: number) => {
        if (qty <= 0) {
          get().removeFromCart(productId);
          return;
        }
        const updated = get().cart.map((item) =>
          item.product.id === productId ? { ...item, quantity: qty } : item
        );
        set({ cart: updated });
      },

      // Overrides/lowers unit price directly from cart
      updateUnitPrice: (productId: string, newPrice: number) => {
        const safePrice = Math.max(0, newPrice);
        const updated = get().cart.map((item) =>
          item.product.id === productId ? { ...item, unitPrice: safePrice } : item
        );
        set({ cart: updated });
      },

      setSelectedCustomerId: (id: string) => set({ selectedCustomerId: id }),

      setCartDiscount: (discount: number, type: 'fixed' | 'percentage' = 'fixed') =>
        set({ cartDiscount: discount, cartDiscountType: type }),

      setPaymentMode: (mode: POSPaymentMode) => set({ paymentMode: mode }),

      setReceivedInput: (val: string) => set({ receivedInput: val }),

      setPartialPaidInput: (val: string) => set({ partialPaidInput: val }),

      clearCart: () =>
        set({
          cart: [],
          selectedCustomerId: '',
          cartDiscount: 0,
          paymentMode: 'full_cash',
          receivedInput: '',
          partialPaidInput: '',
        }),

      holdOrder: (note?: string) => {
        const { cart, selectedCustomerId, heldOrders } = get();
        if (cart.length === 0) return;

        const newHeld: HeldOrder = {
          id: `HOLD-${Date.now()}`,
          name: note || `طلب معلق #${heldOrders.length + 1}`,
          date: new Date().toLocaleTimeString(),
          cart: [...cart],
          customerId: selectedCustomerId,
        };

        set({
          heldOrders: [newHeld, ...heldOrders],
          cart: [],
          selectedCustomerId: '',
          cartDiscount: 0,
          receivedInput: '',
          partialPaidInput: '',
        });
      },

      resumeOrder: (id: string) => {
        const { heldOrders } = get();
        const order = heldOrders.find((o) => o.id === id);
        if (!order) return;

        set({
          cart: order.cart,
          selectedCustomerId: order.customerId,
          heldOrders: heldOrders.filter((o) => o.id !== id),
        });
      },

      deleteHeldOrder: (id: string) => {
        set({ heldOrders: get().heldOrders.filter((o) => o.id !== id) });
      },
    }),
    {
      name: 'storeflow-pos-cart',
    }
  )
);
