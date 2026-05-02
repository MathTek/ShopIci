import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getUserId, getProductById } from '../services/supabaseClient';
import { useCart } from '../contexts/CartContext';

interface Order {
  id: string;
  total_amount: number;
  items: any[];
  applied_promo: string | null;
  discount_amount: number | null;
  created_at: string;
  status: string;
}

const OrderConfirmation: React.FC = () => {
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productInformations, setProductInformations] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Récupérer l'orderId du localStorage (stocker lors du paiement)
        const orderId = localStorage.getItem('pendingOrderId');
        
        if (!orderId) {
          setError('No order found. Please contact support.');
          setLoading(false);
          return;
        }

        const userId = await getUserId();
        if (!userId) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        // Récupérer les détails de la commande
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .eq('user_id', userId)
          .single();

          
          if (fetchError) {
              console.error('Fetch error:', fetchError);
              setError('Could not load order details');
              setLoading(false);
              return;
            }
            
            setOrder(data);
            setProductInformations(await getProductById(data?.items));
        // Nettoyer le localStorage
        localStorage.removeItem('pendingOrderId');
        setLoading(false);
        clearCart();
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred');
        setLoading(false);
      }
    };

    fetchOrder();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-red-400 mb-2">Oops!</h1>
          <p className="text-slate-300 mb-6">{error || 'Could not load your order'}</p>
          <button
            onClick={() => navigate('/cart')}
            className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition"
          >
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4 mt-10">
      <div className="max-w-2xl mx-auto" >
        <div className="bg-slate-800 border border-emerald-500/30 rounded-2xl p-8 mb-6 text-center">
          <h1 className="text-4xl font-bold text-emerald-400 mb-2">Payment Successful!</h1>
          <p className="text-slate-300 mb-4">Your order has been confirmed</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">Order Details</h2>

          <div className="space-y-4 mb-6 pb-6 border-b border-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400">Order ID</span>
              <span className="text-white font-mono font-semibold">{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status</span>
              <span className="text-emerald-400 font-semibold capitalize">{order.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date</span>
              <span className="text-white">{new Date(order.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Items</h3>
            <div className="space-y-2">
                 {productInformations ? (
                  <div className="flex items-center gap-4">
                    <img src={productInformations.image_urls} alt={productInformations.title} className="w-16 h-16 object-cover rounded-md" />
                    <div>
                      <p className="text-white font-medium">{productInformations.title}</p>
                      <p className="text-slate-400">€{productInformations.price.toFixed(2)}</p>
                    </div>
                  </div>

              ) : (
                <p className="text-slate-400">No items in order</p>
              )}
            </div>
          </div>

          {order.applied_promo && order.discount_amount && (
            <div className="mb-6 pb-6 border-t border-slate-700 pt-6">
              <div className="flex justify-between text-slate-300">
                <span>Promo: {order.applied_promo}</span>
                <span className="text-emerald-400">-€{order.discount_amount.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="border-t border-slate-700 pt-6">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold text-white">Total</span>
              <span className="text-3xl font-bold text-indigo-400">€{order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/products')}
            className="flex-1 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition"
          >
            Back Home
          </button>
        </div>

        {/* Help */}
        <div className="mt-8 text-center text-slate-400">
          <p>Need help? <a href="/contact" className="text-indigo-400 hover:text-indigo-300">Contact us</a></p>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;