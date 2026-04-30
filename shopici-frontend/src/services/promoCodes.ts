import type { CartItem, PromoCode } from '../contexts/CartContext';
import { supabase } from './supabaseClient';

export type PromoType = 'percentage' | 'fixed';
export type PromoMode = 'code' | 'scheduled';

export interface PromoRecord {
  id: string;
  created_at?: string | null;
  code?: string | null;
  type: PromoType;
  value: number;
  is_active: boolean;
  product_id?: string | null;
  user_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  promo_mode: PromoMode;
  title?: string | null;
}

export interface ProductPromotionState {
  scheduledPromo: PromoRecord | null;
  displayPrice: number;
  originalPrice: number;
  hasScheduledPromo: boolean;
  badgeText: string | null;
  discountAmount: number;
}

const normalizeCode = (value: string) => value.trim().toUpperCase();

const normalizeNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parsePromoBoundary = (value?: string | null, boundary: 'start' | 'end' = 'start') => {
  if (!value) return null;

  const normalizedValue = value.trim();
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue);
  const date = new Date(
    isDateOnly
      ? `${normalizedValue}T${boundary === 'start' ? '00:00:00.000' : '23:59:59.999'}`
      : normalizedValue
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

export const normalizePromoCode = normalizeCode;

export const toPromoRecord = (promo: any): PromoRecord => ({
  id: String(promo?.id ?? ''),
  created_at: promo?.created_at ?? null,
  code: promo?.code ?? null,
  type: promo?.type === 'fixed' ? 'fixed' : 'percentage',
  value: normalizeNumber(promo?.value),
  is_active: Boolean(promo?.is_active),
  product_id: promo?.product_id ?? null,
  user_id: promo?.user_id ?? null,
  start_date: promo?.start_date ?? null,
  end_date: promo?.end_date ?? null,
  promo_mode: promo?.promo_mode === 'scheduled' ? 'scheduled' : 'code',
  title: promo?.title ?? null,
});

export const isPromoCurrentlyActive = (
  promo: Pick<PromoRecord, 'is_active' | 'promo_mode' | 'start_date' | 'end_date'>,
  now = new Date()
) => {
  if (!promo.is_active) {
    return false;
  }

  if (promo.promo_mode === 'code') {
    return true;
  }

  const startDate = parsePromoBoundary(promo.start_date, 'start');
  const endDate = parsePromoBoundary(promo.end_date, 'end');

  if (!startDate || !endDate) {
    return false;
  }

  const nowMs = now.getTime();
  return startDate.getTime() <= nowMs && nowMs <= endDate.getTime();
};

export const calculateDiscount = (amount: number, promo: Pick<PromoRecord, 'type' | 'value'>): number => {
  const normalizedAmount = normalizeNumber(amount);
  const normalizedValue = normalizeNumber(promo.value);

  if (promo.type === 'percentage') {
    return Math.min(normalizedAmount, normalizedAmount * (normalizedValue / 100));
  }

  return Math.min(normalizedAmount, normalizedValue);
};

export const getScheduledPromoBadgeText = (promo: PromoRecord): string => {
  const valueLabel = promo.type === 'percentage'
    ? `${normalizeNumber(promo.value)}% OFF`
    : `${normalizeNumber(promo.value).toFixed(2)} € OFF`;

  return promo.title ? `${valueLabel} - ${promo.title}` : valueLabel;
};

export const getPromoStatusLabel = (promo: PromoRecord, now = new Date()) => {
  if (!promo.is_active) {
    return 'Inactive';
  }

  if (promo.promo_mode === 'code') {
    return 'Active code';
  }

  const startDate = parsePromoBoundary(promo.start_date, 'start');
  const endDate = parsePromoBoundary(promo.end_date, 'end');

  if (!startDate || !endDate) {
    return 'Invalid schedule';
  }

  if (now < startDate) {
    return 'Scheduled';
  }

  if (now > endDate) {
    return 'Ended';
  }

  return 'Active now';
};

export const getScheduledPromoPricing = (
  price: number,
  promos: PromoRecord[] = []
): ProductPromotionState => {
  const originalPrice = normalizeNumber(price);

  const activePromos = promos.filter(
    (promo) => promo.promo_mode === 'scheduled' && isPromoCurrentlyActive(promo)
  );

  const scheduledPromo = activePromos.reduce<PromoRecord | null>((bestPromo, currentPromo) => {
    if (!bestPromo) {
      return currentPromo;
    }

    const bestDiscount = calculateDiscount(originalPrice, bestPromo);
    const currentDiscount = calculateDiscount(originalPrice, currentPromo);

    if (currentDiscount > bestDiscount) {
      return currentPromo;
    }

    if (currentDiscount === bestDiscount) {
      return String(currentPromo.created_at || '').localeCompare(String(bestPromo.created_at || '')) > 0
        ? currentPromo
        : bestPromo;
    }

    return bestPromo;
  }, null);

  if (!scheduledPromo) {
    return {
      scheduledPromo: null,
      displayPrice: originalPrice,
      originalPrice,
      hasScheduledPromo: false,
      badgeText: null,
      discountAmount: 0,
    };
  }

  const discountAmount = calculateDiscount(originalPrice, scheduledPromo);

  return {
    scheduledPromo,
    displayPrice: Math.max(0, originalPrice - discountAmount),
    originalPrice,
    hasScheduledPromo: discountAmount > 0,
    badgeText: getScheduledPromoBadgeText(scheduledPromo),
    discountAmount,
  };
};

export const fetchScheduledPromosForProducts = async (productIds: string[]) => {
  if (productIds.length === 0) {
    return {} as Record<string, PromoRecord[]>;
  }

  const { data, error } = await supabase
    .from('promo')
    .select('*')
    .eq('promo_mode', 'scheduled')
    .eq('is_active', true)
    .in('product_id', productIds);

  if (error) {
    console.error('Error fetching scheduled promotions:', error);
    return {} as Record<string, PromoRecord[]>;
  }

  return (data || []).reduce<Record<string, PromoRecord[]>>((acc, item) => {
    const promo = toPromoRecord(item);

    if (!promo.product_id) {
      return acc;
    }

    if (!acc[promo.product_id]) {
      acc[promo.product_id] = [];
    }

    acc[promo.product_id].push(promo);
    return acc;
  }, {});
};

export const attachScheduledPromosToProducts = async <T extends { id: string; price?: number | null }>(products: T[]) => {
  const promoMap = await fetchScheduledPromosForProducts(
    products.map((product) => product.id).filter(Boolean)
  );

  return products.map((product) => {
    const pricing = getScheduledPromoPricing(normalizeNumber(product.price), promoMap[product.id] || []);

    return {
      ...product,
      scheduledPromo: pricing.scheduledPromo,
      displayPrice: pricing.displayPrice,
      originalPrice: pricing.originalPrice,
      hasScheduledPromo: pricing.hasScheduledPromo,
      promoBadge: pricing.badgeText,
      promoDiscountAmount: pricing.discountAmount,
    };
  });
};

export const findPromoCode = async (code: string): Promise<PromoCode> => {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) {
    throw new Error('Enter your promo code first.');
  }

  const { data: promo, error } = await supabase
    .from('promo')
    .select('*')
    .eq('code', normalizedCode)
    .eq('promo_mode', 'code')
    .eq('is_active', true)
    .single();

  if (error || !promo) {
    throw new Error('Invalid or inactive promo code');
  }

  const promoRecord = toPromoRecord(promo);

  return {
    id: promoRecord.id,
    code: promoRecord.code || normalizedCode,
    type: promoRecord.type,
    value: promoRecord.value,
    product_id: promoRecord.product_id || null,
    is_active: promoRecord.is_active,
    promo_mode: promoRecord.promo_mode,
    title: promoRecord.title || null,
  };
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
