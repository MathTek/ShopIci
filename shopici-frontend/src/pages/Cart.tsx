import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { buildPromoPreview, findPromoCode, normalizePromoCode, validatePromoForCart } from '../services/promoCodes';
import { useStripe } from '@stripe/react-stripe-js';
import { supabase, getUserId } from '../services/supabaseClient';
import StripePaymentForm from '../components/StripePaymentForm';

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
  const stripe = useStripe();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const normalizedPromoInput = normalizePromoCode(promoInput);
  const isApplyDisabled = !normalizedPromoInput || promoLoading || !!appliedPromo;

  useEffect(() => {
    const fetchUserId = async () => {
      const id = await getUserId();
      setUserId(id);
    };
    fetchUserId();
  }, []);

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

  const initializePayment = async (): Promise<string | null> => {
    if (!userId) {
      setPaymentError('You must be logged in to checkout');
      return null;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setPaymentError('Authentication token missing. Please log in again.');
        return null;
      }

      const response = await fetch(
        'https://dmnntzkzwnhckyraayxm.supabase.co/functions/v1/create-payment-intent',
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: finalTotal,
            userId,
            items: items.map((item) => item.id)[0],
            appliedPromo,
            discountAmount,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      setClientSecret(data.clientSecret);
      return data.orderId;
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Payment failed');
      return null;
    }
  };

  const handleCheckout = async () => {
    if (!stripe) {
      setPaymentError('Stripe is not loaded');
      return;
    }

    setPlacing(true);
    setPaymentError(null);

    try {
      const orderId = await initializePayment();
      if (!orderId) {
        setPlacing(false);
        return;
      }

      // Stocker l'orderId dans localStorage pour la page de confirmation
      localStorage.setItem('pendingOrderId', orderId);
      setShowPaymentForm(true);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Unexpected error');
      setPlacing(false);
    }
  };

  const handleProceedToPayment = () => {
    if (items.length === 0) {
      setPaymentError('Your cart is empty');
      return;
    }
    setShowPaymentForm(true);
  };

  if (items.length === 0 && !success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Your cart is empty</h2>
          <p className="mb-8 text-slate-400">Add some products from the catalog.</p>
          <button 
            onClick={() => navigate('/products')} 
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
          >
            View Products
          </button>
        </div>
      </div>
    );
  }

return (
<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 selection:bg-blue-500/30 pt-40 pb-12">
  <div className="max-w-6xl mx-auto px-4">
    <div className="pt-10 pb-8 border-b border-slate-700/50">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div>
          <h1 className="text-5xl mt-8 lg:text-6xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight">
            Shopping Cart
          </h1>
          <p className="mt-3 text-slate-400 text-lg">
            Review your items before completing your order.
          </p>
        </div>

        <button
          onClick={() => navigate('/products')}
          className="sm:mt-2 px-6 py-3 mt-8 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-200 transition duration-300 cursor-pointer h-fit border border-slate-600/50 hover:border-slate-600"
        >
          Continue Shopping
        </button>
      </div>
    </div>

      <div className="mt-4">
        {success ? (
          <div className="bg-gradient-to-b from-slate-800/50 to-slate-800/30 backdrop-blur-sm p-10 rounded-2xl border border-slate-700/50 text-center shadow-xl">
            <h3 className="text-3xl font-bold text-green-400 mb-3">Order Confirmed</h3>
            <p className="mb-8 text-slate-300 text-lg">Your order has been successfully created. Thank you!</p>
            <div className="flex justify-center gap-4 flex-col sm:flex-row">
              <button
                onClick={() => navigate('/')}
                className="px-8 py-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-200 border border-slate-600/50 hover:border-slate-600 font-medium transition-all duration-300"
              >
                Back to Home
              </button>
              <button
                onClick={() => navigate('/products')}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gradient-to-b from-slate-800/50 to-slate-800/30 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 border-t-0 mt-4 pt-6">
              <div className="space-y-6">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-8 p-6 rounded-2xl bg-slate-800/40 hover:bg-slate-800/60 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-700/30">
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
                          className="w-10 h-10 flex items-center justify-center bg-slate-700/50 rounded-lg hover:bg-slate-700 cursor-pointer border border-slate-600/50 transition-all duration-200"
                        >
                          −
                        </button>
                        <span className="px-5 py-2 bg-slate-700/50 rounded-lg text-lg font-medium border border-slate-600/50">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          className="w-10 h-10 flex items-center justify-center bg-slate-700/50 rounded-lg hover:bg-slate-700 cursor-pointer border border-slate-600/50 transition-all duration-200"
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

            <aside className="lg:ml-8 bg-gradient-to-b from-slate-800/50 to-slate-800/30 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 h-fit shadow-2xl">
              <div className="mb-5">
                <h3 className="text-xl font-semibold text-white">Summary</h3>
                <p className="text-sm text-slate-400 mt-1">{items.length} items</p>
              </div>

              <div className="mt-5 mb-6 rounded-2xl border border-slate-700/50 bg-slate-700/20 backdrop-blur-sm p-5 sm:p-6 shadow-lg space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-white">Apply Promo Code</h4>
                  <p className="text-sm text-slate-400 mt-1">Enter your code to get a discount</p>
                </div>

                {!appliedPromo && (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 mb-2">
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
                    className="w-full h-12 px-4 rounded-xl bg-slate-700/50 border border-slate-600/50 hover:border-slate-600 text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={isApplyDisabled}
                    className="h-12 sm:min-w-[130px] px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                  >
                    {promoLoading ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                )}

                {appliedPromo && (
                  <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-5 py-4 text-sm text-emerald-200 shadow-lg backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="font-semibold text-emerald-100">✓ Code {appliedPromo.code} applied</p>
                        <p className="text-xs text-emerald-300/70 mt-1">{buildPromoPreview(appliedPromo)}</p>
                        <p className="text-xs text-emerald-300/80 mt-1.5">Discount: −{discountAmount.toFixed(2)} €</p>
                      </div>
                      <button
                        onClick={handleRemovePromo}
                        className="px-4 py-2 rounded-lg border border-red-500/40 bg-red-500/15 text-xs font-semibold text-red-300 hover:bg-red-500/25 transition-all duration-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {promoError && (
                  <p className="text-sm text-red-300 rounded-lg bg-red-500/15 border border-red-500/40 px-4 py-3 backdrop-blur-sm">
                    {promoError}
                  </p>
                )}
              </div>

              <div className="space-y-3 mb-6 border-t border-slate-700/50 pt-5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white font-medium">{totalPrice.toFixed(2)} €</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Promo ({appliedPromo.code})</span>
                    <span className="text-green-400 font-medium">− {discountAmount.toFixed(2)} €</span>
                  </div>
                )}
                {!appliedPromo && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Discount</span>
                    <span className="text-green-400 font-medium">− {discountAmount.toFixed(2)} €</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30">
                <span className="text-slate-300 font-medium">Total</span>
                <div className="text-3xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                  {finalTotal.toFixed(2)} €
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => clearCart()}
                  className="px-4 py-3 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/40 transition-all duration-300 cursor-pointer font-medium"
                >
                  Clear Cart
                </button>

                {paymentError && (
                  <p className="text-sm text-red-300 rounded-lg bg-red-500/15 border border-red-500/40 px-4 py-3 backdrop-blur-sm">
                     {paymentError}
                  </p>
                )}

                {!showPaymentForm ? (
                  <button
                    onClick={handleCheckout}
                    className="px-4 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-500/25 cursor-pointer"
                  >
                    Proceed to Payment
                  </button>
                ) : clientSecret ? (
                  <>
                    <StripePaymentForm
                      clientSecret={clientSecret}
                      onSuccess={() => {
                        clearCart();
                        clearPromo();
                        setPromoInput('');
                        setSuccess('Payment successful');
                        setShowPaymentForm(false);
                      }}
                      onBack={() => {
                        setShowPaymentForm(false);
                        setPaymentError(null);
                      }}
                      loading={placing}
                    />
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-400">Loading payment form...</p>
                  </div>
                )}
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