import React, { createContext, useContext, useEffect, useState } from 'react';

export interface PromoCode {
  id?: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  product_id?: string | null;
  is_active?: boolean;
}

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image_urls?: string;
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  applyPromo: (promo: PromoCode) => void;
  clearPromo: () => void;
  appliedPromo: PromoCode | null;
  discountAmount: number;
  finalTotal: number;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = 'shopici_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);


  const addItem = (item: Omit<CartItem, 'qty'>, qty = 1) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + qty } : i);
      }
      return [...prev, { ...item, qty }];
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) return removeItem(id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const clearCart = () => setItems([]);

  const applyPromo = (promo: PromoCode) => {
    setAppliedPromo(promo);
  };

  const clearPromo = () => {
    setAppliedPromo(null);
  };

  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const totalPrice = items.reduce((s, i) => s + (i.price || 0) * i.qty, 0);

  const discountAmount = (() => {
    if (!appliedPromo || items.length === 0) return 0;

    if (appliedPromo.product_id) {
      const matchedSubtotal = items
      .filter((item) => item.id === appliedPromo.product_id)
      .reduce((sum, item) => sum + (item.price || 0) * item.qty, 0);

      if (matchedSubtotal <= 0) return 0;

      if (appliedPromo.type === 'percentage') {
        return Math.min(matchedSubtotal, matchedSubtotal * (appliedPromo.value / 100));
      }

      return Math.min(matchedSubtotal, appliedPromo.value);
    }

    if (appliedPromo.type === 'percentage') {
      return Math.min(totalPrice, totalPrice * (appliedPromo.value / 100));
    }

    return Math.min(totalPrice, appliedPromo.value);
  })();

  const finalTotal = Math.max(0, totalPrice - discountAmount);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        applyPromo,
        clearPromo,
        appliedPromo,
        discountAmount,
        finalTotal,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

export default CartContext;
