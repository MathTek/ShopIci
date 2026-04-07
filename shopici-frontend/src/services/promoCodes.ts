import type { CartItem, PromoCode } from '../contexts/CartContext';
import { supabase } from './supabaseClient';

const normalizeCode = (value: string) => value.trim().toUpperCase();

export const normalizePromoCode = normalizeCode;

export const findPromoCode = async (code: string): Promise<PromoCode> => {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) {
    throw new Error('Enter your promo code first.');
  }

  const { data: promo, error } = await supabase
    .from('promo')
    .select('*')
    .eq('code', normalizedCode)
    .eq('is_active', true)
    .single();

  if (error || !promo) {
    throw new Error('Invalid or inactive promo code');
  }

  return {
    id: promo.id,
    code: normalizedCode,
    type: promo.type,
    value: Number(promo.value || 0),
    product_id: promo.product_id || null,
    is_active: promo.is_active,
  };
};

export const calculateDiscount = (amount: number, promo: PromoCode): number => {
  if (promo.type === 'percentage') {
    return amount * (promo.value / 100);
  }
  return promo.value;
};

export const validatePromoForCart = (
  promo: PromoCode,
  items: CartItem[]
): { valid: boolean; message?: string } => {
  if (promo.product_id) {
    const exists = items.some((item) => item.id === promo.product_id);
    if (!exists) {
      return { valid: false, message: 'This code is not valid for your cart' };
    }
  }

  return { valid: true };
};

export const buildPromoPreview = (promo: PromoCode): string => {
  const valueLabel = promo.type === 'percentage' ? `${promo.value}%` : `${promo.value.toFixed(2)} €`;
  const scopeLabel = promo.product_id ? 'selected product' : 'entire cart';
  return `${valueLabel} off ${scopeLabel}`;
};
