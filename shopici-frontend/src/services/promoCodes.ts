import type { CartItem, PromoCode } from '../contexts/CartContext';

const PROMO_CODES_FILE_PATH = '/promo-codes.txt';
const LOCAL_PROMO_STORAGE_KEY = 'shopici_local_promo_codes_v1';

const normalizeCode = (value: string) => value.trim().toUpperCase();

const safeJsonParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const parsePromoCodesTxt = (raw: string): PromoCode[] => {
  const parsed = safeJsonParse<any[]>(raw, []);

  return parsed
    .map((entry) => ({
      ...entry,
      code: normalizeCode(String(entry?.code ?? '')),
      value: Number(entry?.value ?? 0),
    }))
    .filter((entry) => {
      const hasCore =
        entry.code &&
        (entry.type === 'percentage' || entry.type === 'fixed') &&
        (entry.scope === 'cart' || entry.scope === 'product') &&
        Number.isFinite(entry.value) &&
        entry.value > 0;

      if (!hasCore) return false;
      if (entry.scope === 'product' && !entry.productId) return false;
      if (entry.active === false) return false;

      return true;
    });
};

export const fetchPromoCodesFromFile = async (): Promise<PromoCode[]> => {
  try {
    const response = await fetch(PROMO_CODES_FILE_PATH);
    if (!response.ok) return [];
    const content = await response.text();
    return parsePromoCodesTxt(content);
  } catch {
    return [];
  }
};

export const getLocalPromoCodes = (): PromoCode[] => {
  const raw = localStorage.getItem(LOCAL_PROMO_STORAGE_KEY);
  return safeJsonParse<PromoCode[]>(raw, []);
};

export const saveLocalPromoCode = (promo: PromoCode): PromoCode[] => {
  const current = getLocalPromoCodes();
  const normalizedPromo: PromoCode = {
    ...promo,
    code: normalizeCode(promo.code),
  };

  const filtered = current.filter((item) => item.code !== normalizedPromo.code);
  const next = [...filtered, normalizedPromo];
  localStorage.setItem(LOCAL_PROMO_STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const getAllPromoCodes = async (): Promise<PromoCode[]> => {
  const [fromFile, fromLocal] = await Promise.all([
    fetchPromoCodesFromFile(),
    Promise.resolve(getLocalPromoCodes()),
  ]);

  const map = new Map<string, PromoCode>();
  [...fromFile, ...fromLocal].forEach((promo) => {
    map.set(normalizeCode(promo.code), {
      ...promo,
      code: normalizeCode(promo.code),
    });
  });

  return Array.from(map.values());
};

export const findPromoCode = async (code: string): Promise<PromoCode | null> => {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return null;

  const promos = await getAllPromoCodes();
  const match = promos.find((promo) => promo.code === normalizedCode);
  return match || null;
};

export const validatePromoForCart = (
  promo: PromoCode,
  items: CartItem[]
): { valid: boolean; message?: string } => {
  if (!promo.active && promo.active !== undefined) {
    return { valid: false, message: 'This promo code is inactive.' };
  }

  if (promo.scope === 'product') {
    const exists = items.some((item) => item.id === promo.productId);
    if (!exists) {
      return { valid: false, message: 'This code applies to a specific product not in your cart.' };
    }
  }

  return { valid: true };
};

export const buildPromoPreview = (promo: PromoCode): string => {
  const valueLabel = promo.type === 'percentage' ? `${promo.value}%` : `${promo.value.toFixed(2)} €`;
  const scopeLabel = promo.scope === 'cart' ? 'entire cart' : 'selected product';
  return `${valueLabel} off on ${scopeLabel}`;
};

export const normalizePromoCode = normalizeCode;
