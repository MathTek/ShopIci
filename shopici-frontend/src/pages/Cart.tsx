import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { buildPromoPreview, findPromoCode, normalizePromoCode, validatePromoForCart } from '../services/promoCodes';
import { supabase } from '../services/supabaseClient';

const LOCAL_PRODUCT_SALES_KEY = 'shopici_local_product_sales_v1';

const Cart: React.FC = () => {
  const {
    items,
    removeItem,
    updateQty,
    totalPrice,
    clearCart,
    applyPromo,
    clearPromo,
    appliedPromo,
    discountAmount,
    finalTotal,
  } = useCart();
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const navigate = useNavigate();
  const normalizedPromoInput = normalizePromoCode(promoInput);
  const isApplyDisabled = !normalizedPromoInput || promoLoading || !!appliedPromo;

  const saveLocalSalesFallback = (salesRows: Array<Record<string, unknown>>) => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(LOCAL_PRODUCT_SALES_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      const merged = [...(Array.isArray(existing) ? existing : []), ...salesRows];
      window.localStorage.setItem(LOCAL_PRODUCT_SALES_KEY, JSON.stringify(merged.slice(-5000)));
    } catch (error) {
      console.error('Error persisting local sales fallback:', error);
    }
  };

  const recordSalesForOrder = async (orderId: string, cartItems: typeof items) => {
    if (!cartItems.length) return;

    const { data: { session } } = await supabase.auth.getSession();
    const buyerId = session?.user?.id || null;
    const productIds = cartItems.map((item) => item.id);

    const { data: productRows } = await supabase
      .from('products')
      .select('id, user_id, price')
      .in('id', productIds);

    const sellerByProduct = new Map((productRows || []).map((row: any) => [row.id, row.user_id]));

    const baseRows = cartItems.map((item) => ({
      order_id: orderId,
      product_id: item.id,
      quantity: item.qty,
      amount: (item.price || 0) * item.qty,
      total_amount: (item.price || 0) * item.qty,
      price: item.price || 0,
      seller_id: sellerByProduct.get(item.id) || null,
      buyer_id: buyerId,
      user_id: buyerId,
      status: 'completed',
      created_at: new Date().toISOString(),
    }));

    const tableCandidates = ['sales', 'orders', 'transactions'];
    const variants = [
      (row: any) => ({
        seller_id: row.seller_id,
        buyer_id: row.buyer_id,
        product_id: row.product_id,
        quantity: row.quantity,
        total_amount: row.total_amount,
        order_id: row.order_id,
        status: row.status,
        created_at: row.created_at,
      }),
      (row: any) => ({
        seller_id: row.seller_id,
        user_id: row.user_id,
        product_id: row.product_id,
        quantity: row.quantity,
        amount: row.amount,
        total: row.amount,
        order_id: row.order_id,
        status: row.status,
        created_at: row.created_at,
      }),
      (row: any) => ({
        product_id: row.product_id,
        quantity: row.quantity,
        total_amount: row.total_amount,
        order_id: row.order_id,
        created_at: row.created_at,
      }),
    ];

    let inserted = false;
    for (const table of tableCandidates) {
      for (const variant of variants) {
        const payload = baseRows.map(variant);
        const { error } = await supabase.from(table).insert(payload);
        if (!error) {
          inserted = true;
          break;
        }
      }
      if (inserted) break;
    }

    if (!inserted) {
      saveLocalSalesFallback(baseRows);
    }
  };

  const handleApplyPromo = async () => {
    setPromoError(null);
    const normalizedCode = normalizePromoCode(promoInput);

    if (appliedPromo) {
      setPromoError('A promo code is already applied. Remove it to use another code.');
      return;
    }

    if (!normalizedCode) {
      setPromoError('Enter your promo code first.');
      return;
    }

    setPromoInput(normalizedCode);

    setPromoLoading(true);
    let promo;
    try {
      promo = await findPromoCode(normalizedCode);
    } catch (error) {
      setPromoLoading(false);
      setPromoError(error instanceof Error ? error.message : 'Invalid or inactive promo code');
      return;
    }
    setPromoLoading(false);

    const validation = validatePromoForCart(promo, items);
    if (!validation.valid) {
      setPromoError(validation.message || 'This code cannot be applied to your cart.');
      return;
    }

    applyPromo(promo);
    setPromoError(null);
  };

  const handleRemovePromo = () => {
    clearPromo();
    setPromoInput('');
    setPromoError(null);
  };

  const handleCheckout = async () => {
    setPlacing(true);
    const cartSnapshot = items.map((item) => ({ ...item }));
    await new Promise(r => setTimeout(r, 900));
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    await recordSalesForOrder(orderId, cartSnapshot);
    clearCart();
    clearPromo();
    setPromoInput('');
    setPromoError(null);
    setSuccess(orderId);
    setPlacing(false);
  };

  if (items.length === 0 && !success) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-200 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="mb-6 text-slate-400">Add some products from the catalog.</p>
          <button 
            onClick={() => navigate('/products')} 
            className="px-6 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
          >
            View Products
          </button>
        </div>
      </div>
    );
  }

return (
<div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-cyan-500/30 pt-40 pb-12">
  <div className="max-w-6xl mx-auto px-4">
    <div className="pt-10 pb-8 border-b border-white/10">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div>
          <h1 className="text-4xl mt-8 lg:text-5xl font-bold text-white tracking-tight">
            Shopping Cart
          </h1>
          <p className="mt-2 text-slate-400">
            Review your items before completing your order.
          </p>
        </div>

        <button
          onClick={() => navigate('/products')}
          className="sm:mt-2 px-4 py-2 mt-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 transition cursor-pointer h-fit"
        >
          Continue Shopping
        </button>
      </div>
    </div>

      <div className="mt-4">
        {success ? (
          <div className="bg-white/5 p-8 rounded-2xl border border-white/10 text-center">
            <h3 className="text-2xl font-bold text-cyan-300 mb-2">Order Simulated</h3>
            <p className="mb-4">Order #{success} has been successfully created. Thank you!</p>
            <div className="flex justify-center gap-6">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 rounded-lg bg-white/10"
              >
                Back to Home
              </button>
              <button
                onClick={() => navigate('/products')}
                className="px-6 py-2 rounded-lg bg-cyan-500 text-black font-semibold"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white/5 p-6 rounded-2xl border border-white/10 border-t-0 mt-4 pt-4">
              <div className="space-y-6">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-8 p-6 rounded-2xl bg-white/4 shadow-md">
                    <img
                      src={item.image_urls || '/placeholder-image.jpg'}
                      alt={item.title}
                      className="w-40 h-28 object-cover rounded-xl"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-white text-lg">{item.title}</h4>
                          <p className="text-sm text-slate-300">
                            Unit price:{' '}
                            <span className="font-medium text-white">
                              {(item.price || 0).toFixed(2)} €
                            </span>
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-sm text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-4 flex items-center gap-4">
                        <button
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          className="w-10 h-10 flex items-center justify-center bg-white/6 rounded-md hover:bg-white/10 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-4 py-1 bg-white/5 rounded text-lg">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          className="w-10 h-10 flex items-center justify-center bg-white/6 rounded-md hover:bg-white/10 cursor-pointer"
                        >
                          +
                        </button>
                        <div className="ml-6 text-base text-slate-300">
                          Subtotal:{' '}
                          <span className="font-semibold text-white">
                            {((item.price || 0) * item.qty).toFixed(2)} €
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="lg:ml-8 bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 h-fit shadow-xl">
              <div className="mb-5">
                <h3 className="text-xl font-semibold text-white">Summary</h3>
                <p className="text-sm text-slate-400 mt-1">{items.length} items</p>
              </div>

              <div className="mt-5 mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 shadow-[0_6px_20px_rgba(0,0,0,0.18)] space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-white">Apply Promo Code</h4>
                  <p className="text-sm text-slate-400 mt-1">Enter your code to get a discount</p>
                </div>

                {!appliedPromo && (
                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-2">
                  <input
                    id="promo-code-input"
                    type="text"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value.toUpperCase());
                      if (promoError) setPromoError(null);
                    }}
                    placeholder="Enter your promo code"
                    disabled={!!appliedPromo}
                    className="w-full h-11 sm:h-12 px-4 rounded-lg bg-white/5 border border-white/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={isApplyDisabled}
                    className="h-11 sm:h-12 sm:min-w-[126px] px-5 rounded-lg bg-gradient-to-r from-indigo-400 to-purple-400 text-white font-semibold hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {promoLoading ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                )}

                {appliedPromo && (
                  <div className="mt-3 rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-4 py-3.5 text-sm text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.08)]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="font-semibold">✅ Code {appliedPromo.code} applied</p>
                        <p className="text-xs text-emerald-100/80 mt-0.5">{buildPromoPreview(appliedPromo)}</p>
                        <p className="text-xs text-emerald-200/90 mt-1">Discount: -{discountAmount.toFixed(2)} €</p>
                      </div>
                      <button
                        onClick={handleRemovePromo}
                        className="px-3.5 py-2 rounded-md border border-red-400/50 bg-red-500/10 text-xs font-semibold text-red-200 hover:bg-red-500/20 transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {promoError && (
                  <p className="text-sm text-red-300 rounded-md bg-red-500/10 border border-red-400/30 px-3 py-2">
                    ❌ {promoError}
                  </p>
                )}
              </div>

              <div className="space-y-2 mb-6 border-t border-white/10 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white">{totalPrice.toFixed(2)} €</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Promo ({appliedPromo.code})</span>
                    <span className="text-green-300">- {discountAmount.toFixed(2)} €</span>
                  </div>
                )}
                {!appliedPromo && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Discount</span>
                    <span className="text-green-300">- {discountAmount.toFixed(2)} €</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-slate-400">Estimated total</span>
                <div className="text-2xl font-bold text-white tracking-tight">
                  {finalTotal.toFixed(2)} €
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => clearCart()}
                  className="px-4 py-2 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 transition cursor-pointer"
                >
                  Clear Cart
                </button>

                <button
                  onClick={handleCheckout}
                  disabled={placing}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-400 text-white font-semibold transition duration-200 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {placing ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export default Cart;