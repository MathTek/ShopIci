import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const Cart: React.FC = () => {
  const { items, removeItem, updateQty, totalPrice, clearCart } = useCart();
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    setPlacing(true);
    await new Promise(r => setTimeout(r, 900));
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    clearCart();
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

              <div className="flex justify-between items-center mb-6">
                <span className="text-slate-400">Estimated total</span>
                <div className="text-2xl font-bold text-white tracking-tight">
                  {totalPrice.toFixed(2)} €
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
                  className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition duration-200 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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